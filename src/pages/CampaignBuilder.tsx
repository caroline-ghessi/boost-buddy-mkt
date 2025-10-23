import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Rocket, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import StepOne from "@/components/campaign/StepOne";
import StepTwo from "@/components/campaign/StepTwo";
import StepThree from "@/components/campaign/StepThree";
import StepFour from "@/components/campaign/StepFour";
import StepFive from "@/components/campaign/StepFive";

export default function CampaignBuilder() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.prefill;

  const [currentStep, setCurrentStep] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);

  const [campaignData, setCampaignData] = useState({
    name: prefill?.name || "",
    objectives: prefill?.objectives || [],
    targetAudience: prefill?.targetAudience || {
      demographics: {},
      interests: [],
      behaviors: [],
    },
    channels: prefill?.channels || [],
    budget: prefill?.budget || {
      total: 0,
      distribution: {},
    },
    timeline: prefill?.timeline || {
      startDate: "",
      endDate: "",
    },
    creativeBrief: {
      mainMessage: "",
      toneOfVoice: "",
      keywords: [],
      avoidWords: [],
    },
    kpis: {},
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateCampaignData = (field: string, value: any) => {
    setCampaignData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const executeCampaign = async () => {
    setIsExecuting(true);

    try {
      // Validação básica
      if (!campaignData.name) {
        toast.error("Nome da campanha é obrigatório");
        return;
      }

      if (campaignData.objectives.length === 0) {
        toast.error("Selecione pelo menos um objetivo");
        return;
      }

      console.log("🚀 Executando campanha:", campaignData);

      // Chamar execute-campaign edge function
      const { data, error } = await supabase.functions.invoke("execute-campaign", {
        body: {
          brief: campaignData,
        },
      });

      if (error) throw error;

      console.log("✅ Campanha executada:", data);

      toast.success("🎉 Campanha em execução! The Pack está trabalhando...");

      // Redirecionar para Progress Tracker
      navigate(`/campaigns/${data.campaignId}/progress`);
    } catch (error) {
      console.error("❌ Erro ao executar campanha:", error);
      toast.error("Erro ao executar campanha. Tente novamente.");
    } finally {
      setIsExecuting(false);
    }
  };

  const saveDraft = async () => {
    try {
      const { data, error } = await supabase.from("campaigns").insert([{
        user_id: (await supabase.auth.getUser()).data.user?.id || "",
        name: campaignData.name || "Rascunho sem nome",
        budget_total: campaignData.budget.total,
        channels: campaignData.channels,
        objectives: campaignData.objectives,
        target_audience: campaignData.targetAudience,
        metadata: {
          creativeBrief: campaignData.creativeBrief,
          budgetDistribution: campaignData.budget.distribution,
          timeline: campaignData.timeline,
          kpis: campaignData.kpis,
        },
        status: "draft",
      }]).select().single();

      if (error) throw error;

      toast.success("💾 Rascunho salvo com sucesso!");
      navigate("/");
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
      toast.error("Erro ao salvar rascunho");
    }
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Nova Campanha</h1>
        <p className="text-muted-foreground">
          Configure sua campanha em 5 passos simples
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Passo {currentStep} de {totalSteps}</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Steps Content */}
      <div className="mb-8">
        {currentStep === 1 && (
          <StepOne data={campaignData} updateData={updateCampaignData} />
        )}
        {currentStep === 2 && (
          <StepTwo data={campaignData} updateData={updateCampaignData} />
        )}
        {currentStep === 3 && (
          <StepThree data={campaignData} updateData={updateCampaignData} />
        )}
        {currentStep === 4 && (
          <StepFour data={campaignData} updateData={updateCampaignData} />
        )}
        {currentStep === 5 && (
          <StepFive 
            data={campaignData} 
            onExecute={executeCampaign}
            onSaveDraft={saveDraft}
            isExecuting={isExecuting}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      {currentStep < 5 && (
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          <Button onClick={nextStep}>
            Próximo
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
