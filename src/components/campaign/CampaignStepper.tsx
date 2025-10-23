import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Phase {
  label: string;
  icon: React.ElementType;
  status: "completed" | "active" | "pending";
}

interface CampaignStepperProps {
  phases: Phase[];
}

export default function CampaignStepper({ phases }: CampaignStepperProps) {
  return (
    <div className="flex items-center justify-between">
      {phases.map((phase, index) => {
        const Icon = phase.icon;
        const isCompleted = phase.status === "completed";
        const isActive = phase.status === "active";
        const isPending = phase.status === "pending";

        return (
          <div key={phase.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              {/* Icon Circle */}
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all",
                  isCompleted && "bg-primary text-primary-foreground",
                  isActive && "bg-primary/20 text-primary border-2 border-primary",
                  isPending && "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <Icon className="w-6 h-6" />
                )}
              </div>
              
              {/* Label */}
              <p
                className={cn(
                  "text-sm font-medium text-center",
                  (isCompleted || isActive) && "text-foreground",
                  isPending && "text-muted-foreground"
                )}
              >
                {phase.label}
              </p>
            </div>

            {/* Connector Line */}
            {index < phases.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-4 mt-[-24px] transition-all",
                  isCompleted && "bg-primary",
                  !isCompleted && "bg-muted"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
