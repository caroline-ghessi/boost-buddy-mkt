import { Link, useLocation } from "react-router-dom";
import { MessageSquare, Users, BarChart3, Settings, BookOpen } from "lucide-react";

const menuItems = [
  { path: "/", label: "Chat com Ricardo", icon: MessageSquare },
  { path: "/knowledge", label: "Base de Conhecimento", icon: BookOpen },
  { path: "/team", label: "The Pack", icon: Users },
  { path: "/performance", label: "Performance", icon: BarChart3 },
  { path: "/settings", label: "Configurações", icon: Settings }
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background relative">
      {/* Decorative paw prints */}
      <div className="absolute top-20 left-10 text-6xl opacity-5 pointer-events-none">🐾</div>
      <div className="absolute top-40 right-20 text-6xl opacity-5 pointer-events-none">🐾</div>
      <div className="absolute bottom-40 left-1/4 text-6xl opacity-5 pointer-events-none">🐾</div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-card border-b-2 border-primary/20 shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-5xl animate-tail-wag">🐕</div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient">BUDDY AI</h1>
                  <p className="text-xs text-muted-foreground font-medium">Your Marketing Best Friend</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-700 font-medium">The Pack is Ready!</span>
                </div>
              </div>
            </div>
            
            {/* Navigation */}
            <nav className="mt-4">
              <div className="flex gap-2 overflow-x-auto">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-full transition-all whitespace-nowrap
                        ${isActive 
                          ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-md' 
                          : 'bg-card hover:bg-accent text-foreground border border-primary/20'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
