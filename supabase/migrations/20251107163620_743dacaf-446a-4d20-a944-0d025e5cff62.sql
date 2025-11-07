-- ============================================
-- FASE 1: OTIMIZAÇÃO DE ÍNDICES
-- ============================================

-- Remover índice IVFFlat antigo e criar HNSW (mais rápido para queries)
DROP INDEX IF EXISTS rag_embeddings_embedding_idx;

-- HNSW é geralmente superior: queries mais rápidas, melhor recall
-- m=16: número de conexões bidirecionais (padrão, bom equilíbrio)
-- ef_construction=64: qualidade do índice durante construção
CREATE INDEX rag_embeddings_embedding_idx ON rag_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Índices compostos para otimizar queries com RLS
CREATE INDEX IF NOT EXISTS idx_rag_chunks_user_document ON rag_chunks(user_id, document_id);
CREATE INDEX IF NOT EXISTS idx_rag_chunks_document ON rag_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_rag_embeddings_user ON rag_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_embeddings_chunk ON rag_embeddings(chunk_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_user_status ON rag_documents(user_id, status);

-- ============================================
-- FASE 3: TRIGGERS DE REPROCESSAMENTO
-- ============================================

-- Adicionar coluna para rastrear se documento precisa reprocessamento
ALTER TABLE rag_documents ADD COLUMN IF NOT EXISTS needs_reprocessing boolean DEFAULT false;
ALTER TABLE rag_documents ADD COLUMN IF NOT EXISTS last_processed_at timestamp with time zone;

-- Função: Marcar documento para reprocessamento quando conteúdo muda
CREATE OR REPLACE FUNCTION mark_document_for_reprocessing()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o file_url mudou, precisa reprocessar
  IF OLD.file_url IS DISTINCT FROM NEW.file_url THEN
    NEW.needs_reprocessing := true;
    NEW.status := 'processing';
    
    -- Deletar chunks e embeddings antigos para reprocessamento limpo
    DELETE FROM rag_embeddings 
    WHERE chunk_id IN (
      SELECT id FROM rag_chunks WHERE document_id = NEW.id
    );
    
    DELETE FROM rag_chunks WHERE document_id = NEW.id;
    
    NEW.chunk_count := 0;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Detectar mudanças em documentos
DROP TRIGGER IF EXISTS trigger_mark_document_for_reprocessing ON rag_documents;
CREATE TRIGGER trigger_mark_document_for_reprocessing
  BEFORE UPDATE ON rag_documents
  FOR EACH ROW
  EXECUTE FUNCTION mark_document_for_reprocessing();

-- Função: Limpar embeddings órfãos quando chunks são deletados
CREATE OR REPLACE FUNCTION cleanup_orphaned_embeddings()
RETURNS TRIGGER AS $$
BEGIN
  -- Deletar embeddings que referenciam o chunk deletado
  DELETE FROM rag_embeddings WHERE chunk_id = OLD.id;
  
  -- Atualizar contagem de chunks no documento
  UPDATE rag_documents 
  SET chunk_count = (
    SELECT COUNT(*) FROM rag_chunks WHERE document_id = OLD.document_id
  )
  WHERE id = OLD.document_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Limpar embeddings quando chunks são deletados
DROP TRIGGER IF EXISTS trigger_cleanup_orphaned_embeddings ON rag_chunks;
CREATE TRIGGER trigger_cleanup_orphaned_embeddings
  AFTER DELETE ON rag_chunks
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_orphaned_embeddings();

-- Função: Atualizar timestamp quando documento é processado
CREATE OR REPLACE FUNCTION update_document_processed_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando status muda para 'ready', atualizar timestamp e limpar flag
  IF NEW.status = 'ready' AND OLD.status != 'ready' THEN
    NEW.last_processed_at := now();
    NEW.needs_reprocessing := false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger: Atualizar timestamp de processamento
DROP TRIGGER IF EXISTS trigger_update_processed_timestamp ON rag_documents;
CREATE TRIGGER trigger_update_processed_timestamp
  BEFORE UPDATE ON rag_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_document_processed_timestamp();

-- Função RPC: Marcar documento para reprocessamento manual
CREATE OR REPLACE FUNCTION reprocess_document(document_id uuid)
RETURNS json AS $$
DECLARE
  doc_exists boolean;
  result json;
BEGIN
  -- Verificar se documento existe e pertence ao usuário
  SELECT EXISTS(
    SELECT 1 FROM rag_documents 
    WHERE id = document_id AND user_id = auth.uid()
  ) INTO doc_exists;
  
  IF NOT doc_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Document not found or access denied'
    );
  END IF;
  
  -- Deletar chunks e embeddings existentes
  DELETE FROM rag_embeddings 
  WHERE chunk_id IN (
    SELECT id FROM rag_chunks WHERE rag_chunks.document_id = reprocess_document.document_id
  );
  
  DELETE FROM rag_chunks WHERE rag_chunks.document_id = reprocess_document.document_id;
  
  -- Marcar documento para reprocessamento
  UPDATE rag_documents 
  SET 
    status = 'processing',
    needs_reprocessing = true,
    chunk_count = 0
  WHERE id = document_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Document marked for reprocessing'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;