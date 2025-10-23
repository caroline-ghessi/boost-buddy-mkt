import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Task routing matrix - which agents handle which types of tasks
const TASK_ROUTING = {
  'market_research': {
    level2: 'ana-silva',
    level3: ['pedro-oliveira'] // Copywriter for insights documentation
  },
  'competitive_intelligence': {
    level2: 'thiago-costa',
    level3: ['pedro-oliveira'] // Copywriter for reports
  },
  'data_analysis': {
    level2: 'camila-rodrigues',
    level3: [] // Camila works independently
  },
  'brand_strategy': {
    level2: 'renata-lima',
    level3: ['marina-santos'] // Designer for brand materials
  },
  'content_creation': {
    level2: 'renata-lima', // Oversees brand consistency
    level3: ['pedro-oliveira', 'marina-santos', 'lucas-ferreira']
  },
  'paid_media': {
    level2: 'camila-rodrigues', // Oversees data & performance
    level3: ['rafael-costa', 'isabela-almeida']
  },
  'organic_growth': {
    level2: 'renata-lima', // Brand alignment
    level3: ['isabela-almeida', 'juliana-mendes']
  },
  'quality_assurance': {
    level2: 'andre-martins',
    level3: ['renata-lima'] // Brand compliance check
  }
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

    const { 
      campaign_id, 
      task_type, 
      title, 
      description, 
      priority = 'medium',
      assigned_by = 'ricardo-santos',
      context = {}
    } = await req.json();

    console.log('Task routing request:', { campaign_id, task_type, title });

    // Validation
    if (!campaign_id || !task_type || !title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: campaign_id, task_type, title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const routing = TASK_ROUTING[task_type as keyof typeof TASK_ROUTING];
    if (!routing) {
      return new Response(
        JSON.stringify({ error: `Invalid task_type. Must be one of: ${Object.keys(TASK_ROUTING).join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const createdTasks = [];

    // Create Level 2 task
    const { data: level2Task, error: level2Error } = await supabase
      .from('agent_tasks')
      .insert({
        campaign_id,
        agent_id: routing.level2,
        title,
        description,
        priority,
        assigned_by,
        status: 'pending',
        context: {
          ...context,
          task_type,
          level: 2
        }
      })
      .select()
      .single();

    if (level2Error) {
      console.error('Error creating level 2 task:', level2Error);
      return new Response(
        JSON.stringify({ error: 'Failed to create level 2 task', details: level2Error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    createdTasks.push(level2Task);
    console.log('Level 2 task created:', level2Task.id);

    // Send delegation communication
    await supabase.functions.invoke('agent-communication', {
      body: {
        from_agent: assigned_by,
        to_agent: routing.level2,
        content: `Nova tarefa delegada: ${title}`,
        type: 'delegation',
        task_id: level2Task.id,
        campaign_id,
        context: { task_type, priority }
      }
    });

    // Create Level 3 subtasks if needed
    if (routing.level3 && routing.level3.length > 0) {
      for (const level3Agent of routing.level3) {
        const subtaskTitle = `${title} - Execução`;
        const subtaskDescription = `Subtarefa de: ${title}`;

        const { data: level3Task, error: level3Error } = await supabase
          .from('agent_tasks')
          .insert({
            campaign_id,
            agent_id: level3Agent,
            title: subtaskTitle,
            description: subtaskDescription,
            priority,
            assigned_by: routing.level2,
            parent_task_id: level2Task.id,
            status: 'pending',
            context: {
              ...context,
              task_type,
              level: 3,
              parent_task_id: level2Task.id
            }
          })
          .select()
          .single();

        if (level3Error) {
          console.error('Error creating level 3 task:', level3Error);
          continue;
        }

        createdTasks.push(level3Task);
        console.log('Level 3 task created:', level3Task.id);

        // Send delegation communication from Level 2 to Level 3
        await supabase.functions.invoke('agent-communication', {
          body: {
            from_agent: routing.level2,
            to_agent: level3Agent,
            content: `Subtarefa delegada: ${subtaskTitle}`,
            type: 'delegation',
            task_id: level3Task.id,
            campaign_id,
            context: { task_type, priority, parent_task_id: level2Task.id }
          }
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        tasks: createdTasks,
        message: `Created ${createdTasks.length} task(s) successfully`,
        routing: {
          level2_agent: routing.level2,
          level3_agents: routing.level3
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in hierarchical-task-router:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
