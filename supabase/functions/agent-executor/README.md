# Agent Job Queue System (pgmq)

Sistema resiliente de processamento assíncrono de tarefas dos agentes com retries automáticos.

## Componentes

### 1. agent-executor (Edge Function)
- Consome jobs da fila `agent_jobs_queue`
- Processa até 10 jobs por execução (configurável)
- Implementa retry automático (máx. 3 tentativas)
- Move jobs com falhas permanentes para dead letter
- Executa automaticamente a cada 2 minutos via pg_cron

### 2. agent_jobs (Tabela)
Rastreia o estado de cada job:
- `status`: pending, processing, completed, failed, dead
- `attempts`: contador de tentativas
- `max_attempts`: limite de retries (padrão: 3)
- `priority`: 1 (alta) a 10 (baixa)
- Timestamps completos do ciclo de vida

### 3. agent_jobs_queue (Fila pgmq)
- Fila FIFO resiliente
- Visibility timeout de 5 minutos
- Processamento em batch

## Fluxo de Processamento

1. **Enfileiramento**: 
   - `hierarchical-task-router` cria tarefa e enfileira job
   - Job inserido na tabela `agent_jobs` e fila `pgmq`

2. **Execução**:
   - `agent-executor` lê jobs da fila (a cada 2 min)
   - Atualiza status para "processing"
   - Chama `process-agent-task`
   - Registra resultado

3. **Retry Automático**:
   - Falha < 3 tentativas: job volta para "pending"
   - Falha >= 3 tentativas: status vira "dead"

4. **Limpeza**:
   - Jobs completados/mortos > 30 dias são deletados automaticamente

## Monitoramento

### View de Saúde da Fila
```sql
SELECT * FROM v_agent_queue_health;
```

### Jobs Ativos
```sql
SELECT * FROM agent_jobs 
WHERE status IN ('pending', 'processing')
ORDER BY priority, enqueued_at;
```

### Taxa de Sucesso
```sql
SELECT 
  status,
  COUNT(*) as total,
  ROUND(AVG(attempts), 2) as avg_attempts
FROM agent_jobs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;
```

## Configurações pg_cron

- **Processamento**: A cada 2 minutos
- **Limpeza**: Diariamente às 3h da manhã
