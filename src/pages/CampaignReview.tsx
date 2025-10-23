import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";

export default function CampaignReview() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-4">Revisar Campanha</h1>
        <p className="text-muted-foreground">
          Página de revisão de campanha {id} será implementada em breve.
        </p>
      </Card>
    </div>
  );
}
