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

    // Fetch pending tasks (not yet processed)
    const { data: pendingTasks, error: fetchError } = await supabase
      .from('agent_tasks')
      .select('id, title, agent_id, priority, created_at')
      .eq('status', 'pending')
      .order('priority', { ascending: false }) // High priority first
      .order('created_at', { ascending: true }) // Older tasks first
      .limit(10); // Process max 10 tasks per run

    if (fetchError) {
      throw fetchError;
    }

    if (!pendingTasks || pendingTasks.length === 0) {
      console.log('No pending tasks to process');
      return new Response(
        JSON.stringify({ 
          message: 'No pending tasks',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${pendingTasks.length} pending tasks to process`);

    // Process each task by calling process-agent-task
    const results = [];
    for (const task of pendingTasks) {
      try {
        console.log(`Triggering processing for task ${task.id} (${task.title})`);
        
        const { data, error } = await supabase.functions.invoke('process-agent-task', {
          body: { taskId: task.id }
        });

        if (error) {
          console.error(`Error processing task ${task.id}:`, error);
          results.push({
            taskId: task.id,
            success: false,
            error: error.message
          });
        } else {
          console.log(`Successfully triggered processing for task ${task.id}`);
          results.push({
            taskId: task.id,
            success: true,
            data
          });
        }
      } catch (error: any) {
        console.error(`Exception processing task ${task.id}:`, error);
        results.push({
          taskId: task.id,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Processed ${successCount} tasks successfully, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        message: `Processed ${pendingTasks.length} tasks`,
        success: successCount,
        failed: failureCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in auto-process-tasks:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
