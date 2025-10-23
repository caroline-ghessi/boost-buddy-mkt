import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RAGUploadWidget() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Apenas arquivos PDF, TXT e DOCX são aceitos");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar autenticado");
        return;
      }

      // Insert document into database
      const { data: docData, error } = await supabase
        .from('rag_documents')
        .insert({
          user_id: user.id,
          title: file.name,
          file_type: file.type,
          file_size: file.size,
          status: 'pending',
          metadata: {
            original_filename: file.name,
            uploaded_at: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (error || !docData) {
        console.error('Upload error:', error);
        toast.error('Erro ao fazer upload do documento');
        setIsUploading(false);
        return;
      }

      // Trigger document processing
      toast.success('Documento enviado! Processando...');
      
      try {
        const { error: processError } = await supabase.functions.invoke('ingest-documents', {
          body: { documentId: docData.id }
        });

        if (processError) {
          console.error('Processing error:', processError);
          toast.error('Erro ao processar documento');
        }
      } catch (err) {
        console.error('Processing invocation error:', err);
      }

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erro ao fazer upload do documento");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Card 
      className={`p-6 border-2 border-dashed transition-colors ${
        isDragging ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-primary/10 p-4">
          {isUploading ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <Upload className="h-8 w-8 text-primary" />
          )}
        </div>
        
        <div>
          <h3 className="font-semibold mb-1">Upload de Documentos</h3>
          <p className="text-sm text-muted-foreground">
            Arraste arquivos ou clique para adicionar à base de conhecimento
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Formatos: PDF, TXT, DOCX (máx. 10MB)
          </p>
        </div>

        <label htmlFor="file-upload">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            className="cursor-pointer"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <FileText className="mr-2 h-4 w-4" />
            {isUploading ? "Enviando..." : "Selecionar Arquivo"}
          </Button>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".pdf,.txt,.docx"
            onChange={(e) => handleFileUpload(e.target.files)}
            disabled={isUploading}
          />
        </label>
      </div>
    </Card>
  );
}
