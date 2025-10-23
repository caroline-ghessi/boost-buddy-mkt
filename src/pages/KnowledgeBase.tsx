import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RAGUploadWidget } from "@/components/rag/RAGUploadWidget";
import { toast } from "sonner";
import { FileText, Search, Trash2, Eye, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface RAGDocument {
  id: string;
  title: string;
  description: string | null;
  status: string;
  file_type: string | null;
  file_size: number | null;
  chunk_count: number;
  created_at: string;
  category: string | null;
  tags: string[] | null;
}

interface RAGChunk {
  id: string;
  content: string;
  chunk_index: number;
  similarity?: number;
}

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState<RAGDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<RAGDocument | null>(null);
  const [docChunks, setDocChunks] = useState<RAGChunk[]>([]);
  const [showChunksModal, setShowChunksModal] = useState(false);

  useEffect(() => {
    loadDocuments();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('rag-documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rag_documents'
        },
        () => {
          loadDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('rag_documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
      toast.error("Erro ao carregar documentos");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('query-rag', {
        body: { 
          query: searchQuery,
          matchThreshold: 0.5,
          matchCount: 10
        }
      });

      if (error) throw error;
      setSearchResults(data?.chunks || []);
      
      if (data?.chunks?.length === 0) {
        toast.info("Nenhum resultado encontrado");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Erro ao buscar documentos");
    } finally {
      setSearching(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm("Tem certeza que deseja deletar este documento?")) return;
    
    try {
      const { error } = await supabase
        .from('rag_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      toast.success("Documento deletado");
      loadDocuments();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Erro ao deletar documento");
    }
  };

  const viewChunks = async (doc: RAGDocument) => {
    setSelectedDoc(doc);
    setShowChunksModal(true);
    
    try {
      const { data, error } = await supabase
        .from('rag_chunks')
        .select('*')
        .eq('document_id', doc.id)
        .order('chunk_index');

      if (error) throw error;
      setDocChunks(data || []);
    } catch (error) {
      console.error("Error loading chunks:", error);
      toast.error("Erro ao carregar chunks");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      ready: "default",
      processing: "secondary",
      error: "destructive",
      pending: "outline"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "N/A";
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documentos</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="search">Busca Semântica</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ) : documents.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  Faça upload de documentos para começar
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc) => (
                <Card key={doc.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                          {getStatusIcon(doc.status)}
                          {doc.title}
                        </CardTitle>
                        <CardDescription>
                          {doc.description || "Sem descrição"}
                        </CardDescription>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span>Tipo: {doc.file_type || "N/A"}</span>
                        <span>Tamanho: {formatFileSize(doc.file_size)}</span>
                        <span>Chunks: {doc.chunk_count}</span>
                        <span>
                          {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        {doc.chunk_count > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewChunks(doc)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Chunks
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload">
          <RAGUploadWidget />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Busca Semântica</CardTitle>
              <CardDescription>
                Pesquise por conceitos e significados, não apenas palavras-chave
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Como aumentar conversão de campanhas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searching}>
                  {searching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-semibold">
                    {searchResults.length} resultados encontrados
                  </h3>
                  {searchResults.map((result, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-6">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <span className="text-sm font-medium">
                              Similaridade: {(result.similarity * 100).toFixed(1)}%
                            </span>
                            <Badge variant="outline">Chunk {result.chunk_index}</Badge>
                          </div>
                          <p className="text-sm">{result.content}</p>
                          {result.metadata?.document_title && (
                            <p className="text-xs text-muted-foreground">
                              De: {result.metadata.document_title}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showChunksModal} onOpenChange={setShowChunksModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedDoc?.title}</DialogTitle>
            <DialogDescription>
              {docChunks.length} chunks processados
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {docChunks.map((chunk) => (
                <Card key={chunk.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">
                      Chunk #{chunk.chunk_index}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm whitespace-pre-wrap">{chunk.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
