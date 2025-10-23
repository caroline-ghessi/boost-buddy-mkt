import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useCompetitorMonitoring } from "@/hooks/useCompetitorMonitoring";
import { supabase } from "@/integrations/supabase/client";

interface AddCompetitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddCompetitorModal({ isOpen, onClose, onSuccess }: AddCompetitorModalProps) {
  const [competitorData, setCompetitorData] = useState({
    name: "",
    platforms: {
      website: "",
      instagram: "",
      facebook: "",
      linkedin: "",
    },
    monitoringFrequency: "daily",
  });

  const { startMonitoring, isScrapingLoading } = useCompetitorMonitoring();

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      await startMonitoring(
        competitorData.name,
        competitorData.platforms,
        user.id
      );

      onSuccess();
      onClose();
      
      // Reset form
      setCompetitorData({
        name: "",
        platforms: { website: "", instagram: "", facebook: "", linkedin: "" },
        monitoringFrequency: "daily",
      });
    } catch (error) {
      console.error("Error adding competitor:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>🐶 Adicionar Concorrente para Monitoramento</DialogTitle>
          <DialogDescription>
            Thiago Costa irá coletar e analisar dados automaticamente
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Nome do Concorrente */}
          <div>
            <Label htmlFor="name">Nome do Concorrente</Label>
            <Input
              id="name"
              placeholder="Ex: Empresa Concorrente LTDA"
              value={competitorData.name}
              onChange={(e) =>
                setCompetitorData((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          {/* Plataformas */}
          <div>
            <Label>Plataformas para Monitorar</Label>
            <div className="space-y-3 mt-2">
              <div>
                <Label htmlFor="website" className="text-sm">
                  🌐 Website
                </Label>
                <Input
                  id="website"
                  placeholder="https://exemplo.com"
                  value={competitorData.platforms.website}
                  onChange={(e) =>
                    setCompetitorData((prev) => ({
                      ...prev,
                      platforms: { ...prev.platforms, website: e.target.value },
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="instagram" className="text-sm">
                  📷 Instagram
                </Label>
                <Input
                  id="instagram"
                  placeholder="@username ou https://instagram.com/username"
                  value={competitorData.platforms.instagram}
                  onChange={(e) =>
                    setCompetitorData((prev) => ({
                      ...prev,
                      platforms: { ...prev.platforms, instagram: e.target.value },
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="facebook" className="text-sm">
                  📘 Facebook Page
                </Label>
                <Input
                  id="facebook"
                  placeholder="nome-da-pagina"
                  value={competitorData.platforms.facebook}
                  onChange={(e) =>
                    setCompetitorData((prev) => ({
                      ...prev,
                      platforms: { ...prev.platforms, facebook: e.target.value },
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="linkedin" className="text-sm">
                  💼 LinkedIn Company
                </Label>
                <Input
                  id="linkedin"
                  placeholder="empresa-exemplo"
                  value={competitorData.platforms.linkedin}
                  onChange={(e) =>
                    setCompetitorData((prev) => ({
                      ...prev,
                      platforms: { ...prev.platforms, linkedin: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Frequência */}
          <div>
            <Label>Frequência de Monitoramento</Label>
            <Select
              value={competitorData.monitoringFrequency}
              onValueChange={(val) =>
                setCompetitorData((prev) => ({ ...prev, monitoringFrequency: val }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">🌞 Diário</SelectItem>
                <SelectItem value="weekly">📅 Semanal</SelectItem>
                <SelectItem value="manual">🖐️ Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isScrapingLoading || !competitorData.name}
          >
            {isScrapingLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Configurando...
              </>
            ) : (
              "🐶 Iniciar Monitoramento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
