import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Send } from "lucide-react";
import { BuddyAgentCard } from "@/components/buddy/BuddyAgentCard";
import { useAgents } from "@/hooks/useAgents";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { agents, loading } = useAgents();
  const [chatInput, setChatInput] = useState("");

  // Buscar CMO real (level_1)
  const cmoAgent = agents.find(agent => agent.level === 'level_1' && agent.is_active);
  
  // Filter level 3 active agents
  const level3Agents = agents
    .filter(agent => agent.level === 'level_3' && agent.is_active)
    .slice(0, 5);

  const metrics = [
    { label: "Ad Spend", value: "$12,450", change: "+5.2%", isPositive: true },
    { label: "Conversions", value: "832", change: "-1.8%", isPositive: false },
    { label: "Organic Traffic", value: "25.1k", change: "+12.1%", isPositive: true },
  ];

  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-6 min-h-[calc(100vh-120px)]">
      {/* CMO Chat Section - 2x2 */}
      <section className="col-span-2 row-span-2 bg-[#1e1e1e] rounded-xl p-6 flex flex-col border border-gray-700/50">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            {cmoAgent?.avatar ? (
              <img 
                src={cmoAgent.avatar} 
                alt={cmoAgent.name}
                className="h-16 w-16 rounded-full object-cover border-4 border-green-400"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#A1887F] to-[#8D6E63] flex items-center justify-center text-3xl border-4 border-green-400">
                {cmoAgent?.emoji || '🐕‍🦺'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-400 rounded-full border-2 border-[#1e1e1e]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Chat with {cmoAgent?.name || 'CMO'} (CMO)</h2>
            <p className="text-sm text-green-400">Online and ready to lead the pack.</p>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-[#121212] rounded-lg p-4 space-y-4 overflow-y-auto mb-4">
          <div className="flex justify-start items-end gap-2">
            {cmoAgent?.avatar ? (
              <img 
                src={cmoAgent.avatar} 
                alt={cmoAgent.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#A1887F] flex items-center justify-center">
                {cmoAgent?.emoji || '🐕‍🦺'}
              </div>
            )}
            <div className="chat-bubble-ai max-w-md">
              <p className="text-sm">Alright team, let's get this quarter's campaign strategy outlined. What are our primary objectives?</p>
            </div>
          </div>
          <div className="flex justify-end items-end gap-2">
            <div className="chat-bubble-user max-w-md">
              <p className="text-sm">We need to increase lead generation by 15% and boost social media engagement.</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
              👤
            </div>
          </div>
          <div className="flex justify-start items-end gap-2">
            {cmoAgent?.avatar ? (
              <img 
                src={cmoAgent.avatar} 
                alt={cmoAgent.name}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-[#A1887F] flex items-center justify-center">
                {cmoAgent?.emoji || '🐕‍🦺'}
              </div>
            )}
            <div className="chat-bubble-ai max-w-md">
              <p className="text-sm">Good. I'll have Sparky (our SEO specialist) and Luna (our content creator) start working on a content plan. I'm assigning them tasks now.</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="relative">
          <Input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Send a command to Ricardo..."
            className="w-full bg-[#2a2a2a] border border-gray-600 text-white placeholder-gray-400 pr-12"
          />
          <Button 
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-transparent hover:bg-[#A1887F] text-gray-400 hover:text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </section>

      {/* Key Metrics - 1x1 */}
      <section className="col-span-1 row-span-1 bg-[#1e1e1e] rounded-xl p-4 border border-gray-700/50">
        <h3 className="text-base font-bold text-white mb-3">Key Metrics</h3>
        <div className="space-y-2">
          {metrics.map((metric) => (
            <div key={metric.label} className="flex justify-between items-center p-2 bg-[#2a2a2a] rounded-lg">
              <div>
                <p className="text-xs text-gray-400">{metric.label}</p>
                <p className="text-sm font-semibold text-white">{metric.value}</p>
              </div>
              <div className={`flex items-center ${metric.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {metric.isPositive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                <span className="text-xs font-medium">{metric.change}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Performance Chart - 1x1 */}
      <section className="col-span-1 row-span-1 bg-[#1e1e1e] rounded-xl p-6 border border-gray-700/50">
        <h3 className="text-lg font-bold text-white mb-4">Campaign Performance</h3>
        <div className="h-full flex items-center justify-center text-gray-500">
          📊 Chart Area
        </div>
      </section>

      {/* The Pack Status - 3x1 */}
      <section className="col-span-3 row-span-1 bg-[#1e1e1e] rounded-xl p-6 border border-gray-700/50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-white">The Pack Status</h3>
          <a href="/team" className="text-sm text-[#A1887F] hover:underline">
            View All Agents
          </a>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {loading ? (
            <p className="text-gray-400 col-span-5 text-center">Carregando agentes...</p>
          ) : level3Agents.length === 0 ? (
            <p className="text-gray-400 col-span-5 text-center">Nenhum agente encontrado</p>
          ) : (
            level3Agents.map((agent) => (
              <BuddyAgentCard 
                key={agent.id} 
                agent={{
                  id: agent.agent_id,
                  name: agent.name,
                  role: agent.role,
                  level: 3,
                  specialty: Array.isArray(agent.specialty) ? agent.specialty.join(', ') : agent.specialty || '',
                  emoji: agent.emoji,
                  breed: agent.breed,
                  breedTrait: agent.breed_trait,
                  color: '#A1887F',
                  status: agent.is_active ? 'active' : 'idle',
                  yearsExperience: agent.years_experience || 0,
                  team: agent.team,
                  imageUrl: agent.avatar || undefined
                }}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
