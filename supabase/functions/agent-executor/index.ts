import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { batchSize = 5, visibilityTimeout = 300 } = await req.json().catch(() => ({}));

    console.log(`Agent Executor: Reading up to ${batchSize} messages from queue`);

    // Read messages from pgmq queue using wrapper function
    const { data: messages, error: readError } = await supabase
      .rpc('pgmq_read_messages', {
        queue_name: 'agent_jobs_queue',
        visibility_timeout: visibilityTimeout,
        quantity: batchSize
      });

    if (readError) {
      console.error('Error reading from queue:', readError);
      throw readError;
    }

    if (!messages || messages.length === 0) {
      console.log('No messages in queue');
      return new Response(
        JSON.stringify({ 
          message: 'No jobs to process',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${messages.length} jobs`);

    const results = [];
    
    for (const message of messages) {
      const jobData = message.message;
      const messageId = message.msg_id;
      
      console.log(`Processing job ${jobData.job_id} (message ${messageId})`);
      
      try {
        // Update job status to processing
        const { error: updateError } = await supabase
          .from('agent_jobs')
          .update({
            status: 'processing',
            started_at: new Date().toISOString(),
            attempts: jobData.attempts + 1
          })
          .eq('id', jobData.job_id);

        if (updateError) {
          console.error(`Error updating job ${jobData.job_id}:`, updateError);
          throw updateError;
        }

        // Process the task
        const { data: processResult, error: processError } = await supabase.functions.invoke(
          'process-agent-task',
          { body: { taskId: jobData.task_id } }
        );

        if (processError) {
          throw new Error(processError.message || 'Task processing failed');
        }

        // Mark job as completed
        await supabase
          .from('agent_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            result: processResult
          })
          .eq('id', jobData.job_id);

        // Delete message from queue
        await supabase.rpc('pgmq_delete_message', {
          queue_name: 'agent_jobs_queue',
          message_id: messageId
        });

        console.log(`✓ Job ${jobData.job_id} completed successfully`);
        
        results.push({
          jobId: jobData.job_id,
          taskId: jobData.task_id,
          success: true
        });

      } catch (error: any) {
        console.error(`✗ Job ${jobData.job_id} failed:`, error.message);
        
        const attempts = jobData.attempts + 1;
        const maxAttempts = jobData.max_attempts || 3;

        if (attempts >= maxAttempts) {
          // Mark as dead letter (too many retries)
          await supabase
            .from('agent_jobs')
            .update({
              status: 'dead',
              error_message: error.message,
              completed_at: new Date().toISOString()
            })
            .eq('id', jobData.job_id);

          // Delete from queue
          await supabase.rpc('pgmq_delete_message', {
            queue_name: 'agent_jobs_queue',
            message_id: messageId
          });

          console.log(`Job ${jobData.job_id} moved to dead letter queue (${attempts}/${maxAttempts} attempts)`);
        } else {
          // Mark as failed and will retry
          await supabase
            .from('agent_jobs')
            .update({
              status: 'pending',
              error_message: error.message
            })
            .eq('id', jobData.job_id);

          // Delete current message, will be re-enqueued
          await supabase.rpc('pgmq_delete_message', {
            queue_name: 'agent_jobs_queue',
            message_id: messageId
          });

          console.log(`Job ${jobData.job_id} will retry (${attempts}/${maxAttempts} attempts)`);
        }

        results.push({
          jobId: jobData.job_id,
          taskId: jobData.task_id,
          success: false,
          error: error.message,
          willRetry: attempts < maxAttempts
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    console.log(`Execution complete: ${successCount} succeeded, ${failedCount} failed`);

    return new Response(
      JSON.stringify({
        message: `Processed ${messages.length} jobs`,
        success: successCount,
        failed: failedCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in agent-executor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
