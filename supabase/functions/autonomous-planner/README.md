# Autonomous Planner - Sistema de Percepção-Planejamento-Ação

Loop autônomo que reage a eventos e toma decisões proativas sobre quais tarefas os agentes devem executar.

## Arquitetura

```
┌─────────────────┐
│   PERCEPÇÃO     │  Triggers DB detectam eventos
│   (Triggers)    │  - Novos dados competidores
└────────┬────────┘  - Campanha criada
         │           - Performance degradada
         │           - Revisão diária agendada
         v
┌─────────────────┐
│ autonomous_     │  Evento inserido na tabela
│ events          │  Trigger dispara planner via HTTP
└────────┬────────┘
         │
         v
┌─────────────────┐
│  PLANEJAMENTO   │  1. Busca contexto (buildAgentContext)
│  (LLM Decision) │  2. Analisa situação com GPT-4
└────────┬────────┘  3. Decide tarefas necessárias
         │           4. Define prioridades e agentes
         v
┌─────────────────┐
│     AÇÃO        │  1. Cria tarefas via hierarchical-task-router
│  (Task Routing) │  2. Enfileira jobs em pgmq
└────────┬────────┘  3. Notifica agentes
         │
         v
┌─────────────────┐
│   EXECUÇÃO      │  agent-executor processa fila
│  (Background)   │  Agentes executam tarefas
└─────────────────┘
```

## Tipos de Eventos

### 1. `new_competitor_data`
**Trigger:** Quando novos dados de competidores chegam  
**Decisões típicas:**
- Analisar mudanças significativas
- Comparar com nossas campanhas
- Sugerir ajustes estratégicos

### 2. `campaign_created`
**Trigger:** Quando campanha é criada (status draft)  
**Decisões típicas:**
- Pesquisa de mercado inicial
- Análise competitiva
- Validação de orçamento

### 3. `performance_degradation`
**Trigger:** Taxa de sucesso do agente cai >20% (checado a cada 2h)  
**Decisões típicas:**
- Investigar causa da falha
- Revisar prompts do agente
- Ajustar parâmetros

### 4. `daily_review`
**Trigger:** Diariamente às 9h da manhã  
**Decisões típicas:**
- Revisar campanhas ativas
- Identificar oportunidades
- Sugerir otimizações

## Configuração

### Variáveis de Ambiente
```bash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...  # Necessário para decisões do planner
```

### Triggers Configurados

```sql
-- Novos dados de competidores
CREATE TRIGGER trigger_on_new_competitor_data
  AFTER INSERT ON competitor_data
  FOR EACH ROW
  EXECUTE FUNCTION on_new_competitor_data();

-- Campanha criada
CREATE TRIGGER trigger_on_campaign_created
  AFTER INSERT ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION on_campaign_created();

-- Evento autônomo criado (dispara planner)
CREATE TRIGGER on_autonomous_event_created
  AFTER INSERT ON autonomous_events
  FOR EACH ROW
  WHEN (processed = false)
  EXECUTE FUNCTION trigger_autonomous_planner();
```

### pg_cron Jobs

```sql
-- Verificar degradação de performance a cada 2 horas
'0 */2 * * *' → check_agent_performance_degradation()

-- Revisão diária às 9h
'0 9 * * *' → INSERT daily_review events
```

## Exemplo de Fluxo

### Caso: Novo Competidor Inicia Campanha

1. **Percepção:** Dados de competidor scraped → `competitor_data` inserido
2. **Trigger:** `on_new_competitor_data()` cria `autonomous_events`
3. **Planejamento:** 
   - Planner busca contexto (RAG, métricas, histórico)
   - LLM analisa: "Competidor X lançou campanha agressiva"
   - Decide criar tarefa: `competitive_intelligence`
4. **Ação:**
   - Tarefa roteada para agente Thiago (nível 2)
   - Subtarefa para Pedro (copywriter, nível 3)
   - Jobs enfileirados em pgmq
5. **Execução:**
   - `agent-executor` processa jobs
   - Thiago analisa competidor
   - Pedro documenta insights

## Logs e Observabilidade

Todas as etapas são registradas em `tool_execution_logs`:

- `perception`: Tempo para coletar contexto
- `planning_decision`: Decisão do LLM (tokens, custo)
- `action_execution`: Criação de tarefas

## Monitoramento

Dashboard: `/admin/autonomous-system`

Métricas disponíveis:
- Eventos processados vs pendentes (24h)
- Taxa de processamento
- Tipos de eventos mais comuns
- Tarefas criadas por evento

## Queries Úteis

### Ver eventos recentes
```sql
SELECT * FROM autonomous_events
ORDER BY created_at DESC
LIMIT 20;
```

### Taxa de processamento por tipo
```sql
SELECT 
  event_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE processed) as processed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE processed) / COUNT(*), 2) as rate
FROM autonomous_events
GROUP BY event_type;
```

### Tarefas criadas autonomamente
```sql
SELECT 
  at.*,
  ae.event_type
FROM agent_tasks at
JOIN autonomous_events ae ON ae.entity_id = at.campaign_id
WHERE at.context->>'autonomous' = 'true'
ORDER BY at.created_at DESC;
```

## Testando Manualmente

Criar evento de teste:
```sql
INSERT INTO autonomous_events (event_type, user_id, metadata)
VALUES ('daily_review', 'your-user-id', '{"test": true}'::jsonb);
```

Ou via API:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/autonomous-planner \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "daily_review",
    "user_id": "your-user-id",
    "metadata": {"test": true}
  }'
```

## Troubleshooting

### Planner não está disparando
1. Verificar logs do trigger: `SELECT * FROM autonomous_events WHERE processed = false`
2. Checar logs da função: Supabase Dashboard → Edge Functions → autonomous-planner → Logs
3. Verificar pg_net: `SELECT * FROM net.http_request_queue()`

### Decisões ruins do planner
1. Revisar contexto: logs em `tool_execution_logs` com `tool_name = 'perception'`
2. Ajustar system prompt no autonomous-planner
3. Testar com evento manual e analisar resposta

### Performance lenta
1. Otimizar buildAgentContext (reduzir RAG chunks)
2. Usar modelo mais rápido (gpt-4o-mini)
3. Cachear contextos repetidos
