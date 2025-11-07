import { useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CATEGORY_OPTIONS } from "@/lib/ragCategories";

export function RAGUploadWidget() {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileSelect = (files: FileList | null) => {
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

    setSelectedFile(file);
    setTitle(file.name);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Selecione um arquivo primeiro");
      return;
    }

    if (!title.trim()) {
      toast.error("Digite um título para o documento");
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
          title: title.trim(),
          description: description.trim() || null,
          category: category || null,
          tags: tags.length > 0 ? tags : null,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
          status: 'pending',
          metadata: {
            original_filename: selectedFile.name,
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

      // Reset form
      setSelectedFile(null);
      setTitle("");
      setDescription("");
      setCategory("");
      setTags([]);

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
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-6">
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
              Arraste arquivos ou clique para selecionar
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
              Selecionar Arquivo
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,.txt,.docx"
              onChange={(e) => handleFileSelect(e.target.files)}
              disabled={isUploading}
            />
          </label>
        </div>
      </Card>

      {selectedFile && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b">
              <div>
                <h3 className="font-semibold">Detalhes do Documento</h3>
                <p className="text-sm text-muted-foreground">
                  Arquivo: {selectedFile.name}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nome do documento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o conteúdo do documento"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Digite uma tag e pressione Enter"
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    Adicionar
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => {
                  setSelectedFile(null);
                  setTitle("");
                  setDescription("");
                  setCategory("");
                  setTags([]);
                }}
                variant="outline"
                disabled={isUploading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || !title.trim()}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Fazer Upload"
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
