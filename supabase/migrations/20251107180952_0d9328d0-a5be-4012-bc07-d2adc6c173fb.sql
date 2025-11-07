-- Create storage bucket for RAG documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('rag-documents', 'rag-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for storage bucket
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rag-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'rag-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rag-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Service role can access all documents"
ON storage.objects FOR ALL
USING (bucket_id = 'rag-documents');