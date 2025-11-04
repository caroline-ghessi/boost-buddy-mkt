import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Campaign {
  name: string;
  impressions: string;
  clicks: string;
  ctr: string;
  conversions: number;
  roas: string;
  status: "active" | "paused";
}

const campaigns: Campaign[] = [
  {
    name: "Black Friday 2024",
    impressions: "245K",
    clicks: "9,234",
    ctr: "3.77%",
    conversions: 487,
    roas: "5.2x",
    status: "active",
  },
  {
    name: "Produto Novo - Lançamento",
    impressions: "189K",
    clicks: "7,123",
    ctr: "3.76%",
    conversions: 342,
    roas: "4.8x",
    status: "active",
  },
  {
    name: "Remarketing Q4",
    impressions: "156K",
    clicks: "5,891",
    ctr: "3.78%",
    conversions: 298,
    roas: "3.9x",
    status: "paused",
  },
];

export function CampaignTable() {
  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Análise Detalhada por Campanha</h3>
        <Button className="bg-[#A1887F] hover:bg-[#8D6E63]">
          <Plus className="w-4 h-4 mr-2" />
          Nova Análise
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-700">
              <TableHead className="text-gray-400">Campanha</TableHead>
              <TableHead className="text-gray-400">Impressões</TableHead>
              <TableHead className="text-gray-400">Cliques</TableHead>
              <TableHead className="text-gray-400">CTR</TableHead>
              <TableHead className="text-gray-400">Conversões</TableHead>
              <TableHead className="text-gray-400">ROAS</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => (
              <TableRow key={campaign.name} className="border-b border-gray-700/50">
                <TableCell className="text-white">{campaign.name}</TableCell>
                <TableCell className="text-white">{campaign.impressions}</TableCell>
                <TableCell className="text-white">{campaign.clicks}</TableCell>
                <TableCell className="text-white">{campaign.ctr}</TableCell>
                <TableCell className="text-white">{campaign.conversions}</TableCell>
                <TableCell className="text-green-400">{campaign.roas}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    campaign.status === "active" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {campaign.status === "active" ? "Ativa" : "Pausada"}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
