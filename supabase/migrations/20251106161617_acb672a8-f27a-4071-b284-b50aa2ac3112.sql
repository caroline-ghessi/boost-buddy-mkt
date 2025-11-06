-- Update agent configs with recommended LLM models based on their level

-- Level 1 (Leadership) -> Claude Sonnet 4.5 (superior reasoning)
UPDATE agent_configs 
SET llm_model = 'claude-sonnet-4-5' 
WHERE level = 'level_1';

-- Level 2 (Strategy/Intelligence) -> GPT-5 (powerful analysis)
UPDATE agent_configs 
SET llm_model = 'openai/gpt-5' 
WHERE level = 'level_2';

-- Level 3 (Execution) -> Gemini 2.5 Flash (balanced performance)
UPDATE agent_configs 
SET llm_model = 'google/gemini-2.5-flash' 
WHERE level = 'level_3';

-- Level 4 (QA/Analytics) -> Gemini 2.5 Flash Lite (fast and efficient)
UPDATE agent_configs 
SET llm_model = 'google/gemini-2.5-flash-lite' 
WHERE level = 'level_4';