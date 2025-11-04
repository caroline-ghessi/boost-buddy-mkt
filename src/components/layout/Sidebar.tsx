import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, MessageSquare, BarChart3, Users, Search, 
  Plug, BookOpen, Calendar, LogOut 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { path: "/", label: "Dashboard", icon: Home },
  { path: "/chat", label: "Chat com o CMO", icon: MessageSquare },
  { path: "/performance", label: "Analytics", icon: BarChart3 },
  { path: "/team", label: "A Matilha", icon: Users },
  { path: "/competitive-intelligence", label: "Benchmark", icon: Search },
  { path: "/planning", label: "Planejamento", icon: Calendar },
  { path: "/knowledge", label: "Base de Conhecimento", icon: BookOpen },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-[#1e1e1e] p-6 flex flex-col justify-between border-r border-gray-700/50 h-screen sticky top-0">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-3 mb-10">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#A1887F] to-[#8D6E63] flex items-center justify-center text-2xl">
            🐕
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">Buddy AI</span>
            <span className="text-xs text-gray-400 -mt-1">Marketing Pack</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center p-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-[#A1887F] text-white' 
                    : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="ml-3 font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="space-y-4">
        {/* Upgrade Card */}
        <div className="bg-[#2a2a2a] p-4 rounded-lg text-center">
          <p className="text-sm text-gray-300 mb-3">
            Unleash your marketing potential.
          </p>
          <Button 
            className="w-full bg-[#A1887F] text-white hover:bg-[#8D6E63]"
            size="sm"
          >
            Upgrade Plan
          </Button>
        </div>

        {/* Logout Button */}
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </aside>
  );
}
