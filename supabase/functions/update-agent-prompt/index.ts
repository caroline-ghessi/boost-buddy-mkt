import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { agent_id, new_prompt, reason, user_id } = await req.json();

    console.log('Update agent prompt request:', { agent_id, reason });

    // Validation
    if (!agent_id || !new_prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agent_id, new_prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current agent config
    const { data: currentAgent, error: fetchError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_id', agent_id)
      .single();

    if (fetchError || !currentAgent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const oldPrompt = currentAgent.system_prompt;

    // Check if prompt actually changed
    if (oldPrompt === new_prompt) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'No changes detected',
          agent: currentAgent 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current version count
    const { data: historyData, error: historyError } = await supabase
      .from('agent_prompt_history')
      .select('version')
      .eq('agent_config_id', currentAgent.id)
      .order('version', { ascending: false })
      .limit(1);

    const currentVersion = historyData && historyData.length > 0 ? historyData[0].version : 0;
    const newVersion = currentVersion + 1;

    console.log('Creating new version:', newVersion);

    // Insert into history
    const { error: historyInsertError } = await supabase
      .from('agent_prompt_history')
      .insert({
        agent_config_id: currentAgent.id,
        system_prompt: new_prompt,
        version: newVersion,
        changed_by: user_id || null,
        change_reason: reason || 'Manual update'
      });

    if (historyInsertError) {
      console.error('Error inserting prompt history:', historyInsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save prompt history', details: historyInsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update agent config
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agent_configs')
      .update({
        system_prompt: new_prompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentAgent.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating agent config:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update agent config', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Prompt updated successfully. New version:', newVersion);

    return new Response(
      JSON.stringify({
        success: true,
        agent: updatedAgent,
        version: newVersion,
        message: 'Prompt updated successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in update-agent-prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
