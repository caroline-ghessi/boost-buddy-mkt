-- Adicionar coluna llm_model à tabela agent_configs
ALTER TABLE agent_configs 
ADD COLUMN IF NOT EXISTS llm_model TEXT DEFAULT 'gpt-4';

-- Adicionar comentário para documentação
COMMENT ON COLUMN agent_configs.llm_model IS 'Modelo de LLM usado pelo agente (gpt-4, gpt-3.5, claude-3, dall-e-3)';