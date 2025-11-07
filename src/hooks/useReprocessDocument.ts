import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useReprocessDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const { data, error } = await supabase.rpc("reprocess_document", {
        document_id: documentId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      
      if (!result.success) {
        throw new Error(result.error || "Failed to reprocess document");
      }

      // Chamar a edge function para processar o documento
      const { error: ingestError } = await supabase.functions.invoke(
        "ingest-documents",
        {
          body: { documentId },
        }
      );

      if (ingestError) throw ingestError;

      return result;
    },
    onSuccess: () => {
      toast.success("Documento marcado para reprocessamento");
      queryClient.invalidateQueries({ queryKey: ["rag-documents"] });
    },
    onError: (error: Error) => {
      toast.error("Erro ao reprocessar documento", {
        description: error.message,
      });
    },
  });
};
