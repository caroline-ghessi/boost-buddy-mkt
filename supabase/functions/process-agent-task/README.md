# Agent Task Processing with Observability

Sistema de processamento de tarefas dos agentes com logging estruturado completo.

## Logs Implementados

### 1. Context Building (`context_build`)
Registra a construção de contexto para cada tarefa:
- Input: opções de contexto (categorias preferidas, tipos de dados)
- Output: quais contextos foram incluídos (RAG, métricas, competidores, social media)
- Duração: tempo para buscar e construir contexto

### 2. LLM Calls (`llm_call`)
Registra cada chamada ao modelo de linguagem:
- Input: modelo usado, tamanho do prompt, temperatura, max_tokens
- Output: tamanho da resposta, modelo efetivamente usado
- Duração: latência da API
- Tokens: total de tokens consumidos
- Custo: custo estimado em USD baseado no modelo
- Status: success, failed, timeout
- Metadata: endpoint utilizado

## Estrutura dos Logs

```typescript
{
  agent_id: string,           // ID do agente executando
  task_id: uuid,              // ID da tarefa sendo processada
  campaign_id: uuid,          // ID da campanha relacionada
  tool_name: string,          // Nome da ferramenta/ação
  input: jsonb,               // Entrada da operação
  output: jsonb,              // Resultado da operação
  duration_ms: integer,       // Duração em milissegundos
  tokens_used: integer,       // Tokens consumidos (LLM)
  cost_usd: numeric(10,4),    // Custo estimado
  status: string,             // success | failed | timeout
  error_message: text,        // Mensagem de erro se falhou
  metadata: jsonb,            // Metadados adicionais
  created_at: timestamp       // Timestamp da execução
}
```

## Cálculo de Custos

Os custos são calculados automaticamente baseado no modelo usado:

| Modelo | Input (por 1K tokens) | Output (por 1K tokens) |
|--------|----------------------|------------------------|
| gpt-4 | $0.03 | $0.06 |
| gpt-4-turbo | $0.01 | $0.03 |
| gpt-3.5-turbo | $0.0015 | $0.002 |
| claude-3-opus | $0.015 | $0.075 |
| claude-3-sonnet | $0.003 | $0.015 |
| claude-3-haiku | $0.00025 | $0.00125 |
| gemini-pro | $0.0005 | $0.0015 |

Aproximação usada: 75% input, 25% output

## Métricas Disponíveis

### Views do Banco

1. **mv_agent_performance** (Materialized View)
   - Performance agregada por agente por dia
   - Inclui: execuções, duração média/mediana/P95, tokens, custo, taxa de sucesso
   - Atualizada diariamente às 4h via pg_cron

2. **v_tool_performance** (View)
   - Performance agregada por ferramenta
   - Últimos 30 dias
   - Taxa de sucesso, custos, latência

3. **v_recent_tool_logs** (View)
   - Últimos 100 logs com detalhes do agente
   - Útil para debugging em tempo real

## Dashboard

Acesse `/admin/agents-performance` para visualizar:

- **Estatísticas 24h**: Execuções, custo total, tokens, duração média
- **Gráfico de Taxa de Sucesso**: Performance de cada agente ao longo do tempo
- **Tabela de Ferramentas**: Performance detalhada por tipo de ferramenta
- **Logs Recentes**: Stream em tempo real das últimas execuções (auto-refresh 10s)

## Exemplo de Uso

```typescript
import { logExecution, calculateCost } from '../_shared/execution-logger.ts';

// Log manual
await logExecution({
  supabase,
  agentId: 'ana-silva',
  taskId: taskId,
  campaignId: campaignId,
  toolName: 'fetch_competitors',
  input: { query: 'competitor analysis' },
  output: { count: 5, competitors: [...] },
  durationMs: 1500,
  status: 'success'
});

// Calcular custo
const cost = calculateCost(1000, 'gpt-4'); // $0.045
```

## Queries Úteis

### Top 10 agentes por custo (últimos 7 dias)
```sql
SELECT 
  agent_id,
  SUM(cost_usd) as total_cost,
  COUNT(*) as executions,
  AVG(duration_ms) as avg_duration
FROM tool_execution_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY agent_id
ORDER BY total_cost DESC
LIMIT 10;
```

### Ferramentas com alta taxa de falha
```sql
SELECT 
  tool_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'failed') as failures,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'failed') / COUNT(*), 2) as failure_rate
FROM tool_execution_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY tool_name
HAVING COUNT(*) FILTER (WHERE status = 'failed') > 0
ORDER BY failure_rate DESC;
```

### Agentes mais lentos
```sql
SELECT 
  agent_id,
  AVG(duration_ms) as avg_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95_ms
FROM tool_execution_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
  AND status = 'success'
GROUP BY agent_id
ORDER BY avg_ms DESC;
```
