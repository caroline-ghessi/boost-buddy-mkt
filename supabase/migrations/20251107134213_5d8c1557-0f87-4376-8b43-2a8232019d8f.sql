-- Tornar o campo avatar opcional na tabela agent_configs
-- Isso permite criar agentes sem avatar imediatamente
ALTER TABLE agent_configs 
ALTER COLUMN avatar DROP NOT NULL;