-- Criar bucket de storage para fotos dos agentes
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-assets', 'agent-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de acesso ao bucket agent-assets
-- Permitir que todos vejam as fotos (bucket público)
CREATE POLICY "Public access to agent photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'agent-assets');

-- Permitir que usuários autenticados façam upload de fotos
CREATE POLICY "Authenticated users can upload agent photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'agent-assets'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados atualizem fotos
CREATE POLICY "Authenticated users can update agent photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'agent-assets'
  AND auth.role() = 'authenticated'
);

-- Permitir que usuários autenticados deletem fotos
CREATE POLICY "Authenticated users can delete agent photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'agent-assets'
  AND auth.role() = 'authenticated'
);