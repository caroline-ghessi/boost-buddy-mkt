-- Funções wrapper para acessar pgmq via Supabase client

-- Função para enviar mensagem para a fila
CREATE OR REPLACE FUNCTION public.pgmq_send_message(
  queue_name text,
  message jsonb
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg_id bigint;
BEGIN
  SELECT pgmq.send(queue_name, message) INTO msg_id;
  RETURN msg_id;
END;
$$;

-- Função para ler mensagens da fila
CREATE OR REPLACE FUNCTION public.pgmq_read_messages(
  queue_name text,
  visibility_timeout integer DEFAULT 300,
  quantity integer DEFAULT 1
)
RETURNS TABLE(
  msg_id bigint,
  read_ct integer,
  enqueued_at timestamp with time zone,
  vt timestamp with time zone,
  message jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM pgmq.read(queue_name, visibility_timeout, quantity);
END;
$$;

-- Função para deletar mensagem da fila
CREATE OR REPLACE FUNCTION public.pgmq_delete_message(
  queue_name text,
  message_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted boolean;
BEGIN
  SELECT pgmq.delete(queue_name, message_id) INTO deleted;
  RETURN deleted;
END;
$$;

-- Função para arquivar mensagem (dead letter)
CREATE OR REPLACE FUNCTION public.pgmq_archive_message(
  queue_name text,
  message_id bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  archived boolean;
BEGIN
  SELECT pgmq.archive(queue_name, message_id) INTO archived;
  RETURN archived;
END;
$$;