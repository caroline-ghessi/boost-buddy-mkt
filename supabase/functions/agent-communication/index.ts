import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Agent hierarchy levels
const AGENT_LEVELS = {
  'ricardo-santos': 1, // CMO
  'ana-silva': 2, // Market Research
  'thiago-costa': 2, // Competitive Intelligence
  'camila-rodrigues': 2, // Data & Analytics
  'renata-lima': 2, // Brand Strategy
  'andre-martins': 2, // Quality Assurance
  'pedro-oliveira': 3, // Copywriter
  'marina-santos': 3, // Designer
  'lucas-ferreira': 3, // Video Producer
  'rafael-costa': 3, // Performance Manager
  'isabela-almeida': 3, // Social Media
  'juliana-mendes': 3, // SEO Specialist
};

// Valid communication types
const COMMUNICATION_TYPES = ['delegation', 'question', 'result', 'escalation', 'update'];

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { from_agent, to_agent, content, type, task_id, campaign_id, context } = await req.json();

    console.log('Agent communication request:', { from_agent, to_agent, type });

    // Validation
    if (!from_agent || !to_agent || !content || !type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: from_agent, to_agent, content, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!COMMUNICATION_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: `Invalid communication type. Must be one of: ${COMMUNICATION_TYPES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate hierarchy rules
    const fromLevel = AGENT_LEVELS[from_agent as keyof typeof AGENT_LEVELS];
    const toLevel = AGENT_LEVELS[to_agent as keyof typeof AGENT_LEVELS];

    if (!fromLevel || !toLevel) {
      return new Response(
        JSON.stringify({ error: 'Invalid agent ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hierarchy validation rules
    if (type === 'delegation') {
      // Can only delegate downwards (higher level to lower level)
      if (fromLevel >= toLevel) {
        return new Response(
          JSON.stringify({ error: 'Delegation must flow from higher level to lower level' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else if (type === 'question' || type === 'escalation') {
      // Can only question/escalate upwards
      if (fromLevel <= toLevel) {
        return new Response(
          JSON.stringify({ error: 'Questions and escalations must flow upwards in hierarchy' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Insert communication
    const { data: communication, error: insertError } = await supabase
      .from('agent_communications')
      .insert({
        from_agent,
        to_agent,
        content,
        type,
        task_id,
        campaign_id,
        context: context || {},
        requires_response: type === 'question' || type === 'escalation',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting communication:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save communication', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Communication saved:', communication.id);

    // Send real-time notification via Supabase Realtime
    // The client will subscribe to changes on agent_communications table

    return new Response(
      JSON.stringify({
        success: true,
        communication,
        message: 'Communication sent successfully'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in agent-communication:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
