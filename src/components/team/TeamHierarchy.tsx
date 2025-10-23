import { Card } from "@/components/ui/card";
import { buddyAgents, getAgentsByLevel, getAgentsByTeam } from "@/lib/buddyAgents";
import { BuddyAgentCard } from "@/components/buddy/BuddyAgentCard";

const TeamHierarchy = () => {
  const level1 = getAgentsByLevel(1);
  const level2 = getAgentsByLevel(2);
  const level3 = getAgentsByLevel(3);

  // Group level 2 by team
  const intelligenceTeam = getAgentsByTeam("Intelligence");
  const strategyTeam = getAgentsByTeam("Strategy");

  // Group level 3 by team
  const contentTeam = level3.filter(a => a.team === "Content");
  const creativeTeam = level3.filter(a => a.team === "Creative");
  const paidMediaTeam = level3.filter(a => a.team === "Paid Media");
  const qualityTeam = level3.filter(a => a.team === "Quality");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-5xl animate-bounce-in">🐕</span>
          <h2 className="text-4xl font-bold text-gradient">The Pack</h2>
          <span className="text-5xl animate-bounce-in">🐾</span>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Conheça os <strong className="text-primary">17 especialistas</strong> que formam o melhor time de marketing. 
          Cada um com sua raça, personalidade e superpoder único!
        </p>
      </div>

      {/* Fun Facts Card */}
      <Card className="bg-gradient-to-r from-accent/10 to-primary/10 p-6 border-2 border-primary/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🦴</span>
          Fun Facts sobre The Pack
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-1">17</div>
            <div className="text-sm text-muted-foreground font-medium">Especialistas</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-secondary mb-1">15</div>
            <div className="text-sm text-muted-foreground font-medium">Raças diferentes</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-accent mb-1">∞</div>
            <div className="text-sm text-muted-foreground font-medium">Lealdade e dedicação</div>
          </div>
        </div>
      </Card>

      {/* Hierarchy */}
      <div className="space-y-8">
        {/* Level 1 - CMO */}
        <div>
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg">
              1
            </div>
            <h3 className="text-2xl font-bold">Nível 1 - Liderança</h3>
          </div>
          
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              {level1.map((agent) => (
                <Card
                  key={agent.id}
                  className="bg-gradient-to-br from-primary to-secondary text-white p-8 shadow-xl border-0 card-paw"
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce-in">{agent.emoji}</div>
                    <h4 className="text-2xl font-bold mb-2">{agent.name}</h4>
                    <p className="text-white/90 mb-3">{agent.role}</p>
                    <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-4">
                      🐕 {agent.breed}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <p className="text-sm font-medium">⭐ {agent.breedTrait}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-1 h-12 bg-gradient-to-b from-primary to-primary/20 rounded-full" />
        </div>

        {/* Level 2 - Specialists */}
        <div>
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
              2
            </div>
            <h3 className="text-2xl font-bold">Nível 2 - Especialistas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Intelligence Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                Intelligence Team
              </h4>
              <div className="space-y-3">
                {intelligenceTeam.map((agent) => (
                  <BuddyAgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </Card>

            {/* Strategy Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Strategy Team
              </h4>
              <div className="space-y-3">
                {strategyTeam.map((agent) => (
                  <BuddyAgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-1 h-12 bg-gradient-to-b from-secondary to-secondary/20 rounded-full" />
        </div>

        {/* Level 3 - Executors */}
        <div>
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
              3
            </div>
            <h3 className="text-2xl font-bold">Nível 3 - Executores</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-accent/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">✍️</span>
                Content Team
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contentTeam.map((agent) => (
                  <BuddyAgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </Card>

            {/* Creative Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎨</span>
                Creative Team
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creativeTeam.map((agent) => (
                  <BuddyAgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </Card>

            {/* Paid Media Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-accent/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">📱</span>
                Paid Media Team
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paidMediaTeam.map((agent) => (
                  <BuddyAgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </Card>

            {/* Quality Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">✅</span>
                Quality Team
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {qualityTeam.map((agent) => (
                  <BuddyAgentCard key={agent.id} agent={agent} />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Loyalty Message */}
      <Card className="bg-gradient-to-r from-primary to-secondary text-white p-8 text-center border-0 shadow-xl">
        <div className="text-5xl mb-4">🐕💙</div>
        <h3 className="text-2xl font-bold mb-2">
          Loyalty. Strategy. Results.
        </h3>
        <p className="text-white/90 text-lg">
          The Pack nunca dorme e está sempre pronto para buscar os melhores resultados para você!
        </p>
      </Card>
    </div>
  );
};

export default TeamHierarchy;
