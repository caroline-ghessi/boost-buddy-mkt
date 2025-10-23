import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Users } from "lucide-react";
import { useState } from "react";
import { RAGUploadWidget } from "@/components/rag/RAGUploadWidget";
import { toast } from "sonner";

interface StepTwoProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

export default function StepTwo({ data, updateData }: StepTwoProps) {
  const [newInterest, setNewInterest] = useState("");

  const updateDemographic = (key: string, value: any) => {
    updateData("targetAudience", {
      ...data.targetAudience,
      demographics: {
        ...data.targetAudience.demographics,
        [key]: value,
      },
    });
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      const interests = data.targetAudience.interests || [];
      updateData("targetAudience", {
        ...data.targetAudience,
        interests: [...interests, newInterest.trim()],
      });
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    const interests = data.targetAudience.interests || [];
    updateData("targetAudience", {
      ...data.targetAudience,
      interests: interests.filter((i: string) => i !== interest),
    });
  };

  const toggleBehavior = (behavior: string) => {
    const behaviors = data.targetAudience.behaviors || [];
    const updated = behaviors.includes(behavior)
      ? behaviors.filter((b: string) => b !== behavior)
      : [...behaviors, behavior];
    updateData("targetAudience", {
      ...data.targetAudience,
      behaviors: updated,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Público-Alvo</h2>
      </div>

      <Tabs defaultValue="demographics">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demographics">Demografia</TabsTrigger>
          <TabsTrigger value="interests">Interesses</TabsTrigger>
          <TabsTrigger value="behaviors">Comportamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="demographics" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Faixa Etária</Label>
              <Select
                value={data.targetAudience.demographics?.age || ""}
                onValueChange={(val) => updateDemographic("age", val)}
              >
                <SelectTrigger id="age" className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-24">18-24 anos</SelectItem>
                  <SelectItem value="25-34">25-34 anos</SelectItem>
                  <SelectItem value="35-44">35-44 anos</SelectItem>
                  <SelectItem value="45-54">45-54 anos</SelectItem>
                  <SelectItem value="55+">55+ anos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="gender">Gênero</Label>
              <Select
                value={data.targetAudience.demographics?.gender || ""}
                onValueChange={(val) => updateDemographic("gender", val)}
              >
                <SelectTrigger id="gender" className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                placeholder="Ex: São Paulo, SP"
                value={data.targetAudience.demographics?.location || ""}
                onChange={(e) => updateDemographic("location", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="income">Renda Familiar</Label>
              <Select
                value={data.targetAudience.demographics?.income || ""}
                onValueChange={(val) => updateDemographic("income", val)}
              >
                <SelectTrigger id="income" className="mt-1">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-2k">Até R$ 2.000</SelectItem>
                  <SelectItem value="2k-5k">R$ 2.000 - R$ 5.000</SelectItem>
                  <SelectItem value="5k-10k">R$ 5.000 - R$ 10.000</SelectItem>
                  <SelectItem value="10k+">Acima de R$ 10.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="interests" className="space-y-4 mt-6">
          <div>
            <Label htmlFor="new-interest">Adicionar Interesse</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="new-interest"
                placeholder="Ex: tecnologia, esportes, moda..."
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addInterest()}
              />
              <button
                onClick={addInterest}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
              >
                Adicionar
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {data.targetAudience.interests?.map((interest: string) => (
              <div
                key={interest}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm flex items-center gap-2"
              >
                {interest}
                <button
                  onClick={() => removeInterest(interest)}
                  className="hover:text-destructive"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="behaviors" className="space-y-3 mt-6">
          {["Compradores online frequentes", "Viajantes frequentes", "Early adopters", "Influenciadores", "Mobile-first"].map(
            (behavior) => (
              <div key={behavior} className="flex items-center space-x-2">
                <Checkbox
                  id={behavior}
                  checked={data.targetAudience.behaviors?.includes(behavior)}
                  onCheckedChange={() => toggleBehavior(behavior)}
                />
                <label htmlFor={behavior} className="text-sm font-medium cursor-pointer">
                  {behavior}
                </label>
              </div>
            )
          )}
        </TabsContent>
      </Tabs>

      {/* Persona Upload */}
      <Card className="mt-6 p-4 bg-muted/50">
        <h3 className="font-semibold mb-2">📄 Upload de Personas</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Envie documentos com personas detalhadas para a base de conhecimento
        </p>
        <RAGUploadWidget />
      </Card>
    </Card>
  );
}
