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

    const { agent_id, version, user_id } = await req.json();

    console.log('Rollback agent prompt request:', { agent_id, version });

    if (!agent_id || version === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agent_id, version' }),
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

    // Get the specific version from history
    const { data: historyVersion, error: historyError } = await supabase
      .from('agent_prompt_history')
      .select('*')
      .eq('agent_config_id', currentAgent.id)
      .eq('version', version)
      .single();

    if (historyError || !historyVersion) {
      return new Response(
        JSON.stringify({ error: 'Version not found in history' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get current max version
    const { data: maxVersionData } = await supabase
      .from('agent_prompt_history')
      .select('version')
      .eq('agent_config_id', currentAgent.id)
      .order('version', { ascending: false })
      .limit(1);

    const currentMaxVersion = maxVersionData && maxVersionData.length > 0 ? maxVersionData[0].version : 0;
    const newVersion = currentMaxVersion + 1;

    // Create new history entry for the rollback
    await supabase
      .from('agent_prompt_history')
      .insert({
        agent_config_id: currentAgent.id,
        system_prompt: historyVersion.system_prompt,
        version: newVersion,
        changed_by: user_id || null,
        change_reason: `Rollback to version ${version}`
      });

    // Update agent config with rolled back prompt
    const { data: updatedAgent, error: updateError } = await supabase
      .from('agent_configs')
      .update({
        system_prompt: historyVersion.system_prompt,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentAgent.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating agent config:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to rollback prompt', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Rollback successful. New version:', newVersion);

    return new Response(
      JSON.stringify({
        success: true,
        agent: updatedAgent,
        version: newVersion,
        rolled_back_to: version,
        message: `Successfully rolled back to version ${version}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rollback-agent-prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
