import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { BusinessFront } from "@/hooks/useBusinessFronts";
import { PlatformDistribution } from "./PlatformDistribution";

interface BusinessFrontCardProps {
  front: BusinessFront;
  percentage: number;
  allocatedAmount: number;
  onPercentageChange: (value: number) => void;
  allocationId?: string;
}

export const BusinessFrontCard = ({
  front,
  percentage,
  allocatedAmount,
  onPercentageChange,
  allocationId,
}: BusinessFrontCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: front.color }}
            />
            <div>
              <h3 className="font-semibold text-lg">{front.name}</h3>
              {front.description && (
                <p className="text-sm text-muted-foreground">{front.description}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Percentual do Orçamento</Label>
            <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
          </div>
          <Slider
            value={[percentage]}
            onValueChange={(values) => onPercentageChange(values[0])}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">Valor Alocado</span>
          <span className="text-lg font-bold">
            R$ {allocatedAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </span>
        </div>

        {isExpanded && allocationId && (
          <div className="pt-4 border-t">
            <PlatformDistribution
              allocationId={allocationId}
              totalAmount={allocatedAmount}
            />
          </div>
        )}
      </div>
    </Card>
  );
};