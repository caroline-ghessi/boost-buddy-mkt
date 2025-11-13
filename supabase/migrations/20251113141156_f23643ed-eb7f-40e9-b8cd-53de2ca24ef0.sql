-- Tabela de memória compartilhada entre agentes
CREATE TABLE agent_shared_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  memory_key text NOT NULL,
  memory_value jsonb NOT NULL,
  memory_type text NOT NULL CHECK (memory_type IN ('fact', 'decision', 'insight', 'data', 'context')),
  created_by_agent text NOT NULL,
  accessible_to_agents text[], -- null = todos podem acessar
  expires_at timestamptz,
  relevance_score numeric DEFAULT 1.0, -- 0-1 para priorização
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  accessed_count integer DEFAULT 0,
  last_accessed_at timestamptz
);

-- Índices para performance
CREATE INDEX idx_shared_memory_campaign ON agent_shared_memory(campaign_id);
CREATE INDEX idx_shared_memory_key ON agent_shared_memory(memory_key);
CREATE INDEX idx_shared_memory_type ON agent_shared_memory(memory_type);
CREATE INDEX idx_shared_memory_relevance ON agent_shared_memory(relevance_score DESC);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_shared_memory_updated_at
  BEFORE UPDATE ON agent_shared_memory
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE agent_shared_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service can manage all memory"
  ON agent_shared_memory FOR ALL
  USING (true);

CREATE POLICY "Users can view memory for their campaigns"
  ON agent_shared_memory FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = agent_shared_memory.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Comentários
COMMENT ON TABLE agent_shared_memory IS 'Memória compartilhada entre agentes para colaboração em campanhas';
COMMENT ON COLUMN agent_shared_memory.memory_key IS 'Chave identificadora da memória (ex: target_audience_age)';
COMMENT ON COLUMN agent_shared_memory.memory_type IS 'Tipo de memória: fact, decision, insight, data, context';
COMMENT ON COLUMN agent_shared_memory.relevance_score IS 'Score de relevância 0-1 para priorização';
COMMENT ON COLUMN agent_shared_memory.accessible_to_agents IS 'Array de agent_ids que podem acessar (null = todos)';