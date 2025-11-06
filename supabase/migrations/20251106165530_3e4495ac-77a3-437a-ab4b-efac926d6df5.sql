-- Atualizar modelos LLM para usar apenas APIs diretas
-- Remover dependência do Lovable AI Gateway

-- Level 1 (Leadership) - Claude Sonnet 4 (Anthropic Direct)
UPDATE agent_configs 
SET llm_model = 'claude-sonnet-4-20250514' 
WHERE level = 'level_1';

-- Level 2 (Strategy/Intelligence) - GPT-5 (OpenAI Direct)
UPDATE agent_configs 
SET llm_model = 'gpt-5-2025-08-07' 
WHERE level = 'level_2';

-- Level 3 (Execution) - Gemini 2.5 Flash (Google Direct)
UPDATE agent_configs 
SET llm_model = 'gemini-2.5-flash' 
WHERE level = 'level_3';

-- Level 4 (QA/Analytics) - Gemini 2.0 Flash Experimental (Google Direct)
UPDATE agent_configs 
SET llm_model = 'gemini-2.0-flash-exp' 
WHERE level = 'level_4';