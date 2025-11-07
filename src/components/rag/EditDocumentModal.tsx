import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, X, RefreshCw } from "lucide-react";
import { CATEGORY_OPTIONS } from "@/lib/ragCategories";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useReprocessDocument } from "@/hooks/useReprocessDocument";

interface EditDocumentModalProps {
  document: {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    tags: string[] | null;
    needs_reprocessing?: boolean;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function EditDocumentModal({ document, open, onOpenChange, onSave }: EditDocumentModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const reprocessDocument = useReprocessDocument();

  useEffect(() => {
    if (document) {
      setTitle(document.title);
      setDescription(document.description || "");
      setCategory(document.category || "");
      setTags(document.tags || []);
    }
  }, [document]);

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

  const handleSave = async () => {
    if (!document) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('rag_documents')
        .update({
          title,
          description: description || null,
          category: category || null,
          tags: tags.length > 0 ? tags : null
        })
        .eq('id', document.id);

      if (error) throw error;

      toast.success("Documento atualizado");
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating document:", error);
      toast.error("Erro ao atualizar documento");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Documento</DialogTitle>
          <DialogDescription>
            Atualize as informações e categorização do documento
          </DialogDescription>
        </DialogHeader>

        {document?.needs_reprocessing && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Este documento precisa ser reprocessado. Clique no botão de reprocessar abaixo.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
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
              placeholder="Descreva o conteúdo do documento"
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

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 flex-1">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            {document?.needs_reprocessing && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  reprocessDocument.mutate(document.id);
                  onOpenChange(false);
                }}
                disabled={reprocessDocument.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {reprocessDocument.isPending ? "Reprocessando..." : "Reprocessar"}
              </Button>
            )}
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
