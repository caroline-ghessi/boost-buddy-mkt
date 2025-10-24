import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, Users, BarChart3, Settings, BookOpen, Rocket, Search, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";

// Menu items for navigation
const menuItems = [
  { path: "/", label: "Chat com Ricardo", icon: MessageSquare },
  { path: "/knowledge", label: "Base de Conhecimento", icon: BookOpen },
  { path: "/team", label: "The Pack", icon: Users },
  { path: "/performance", label: "Performance", icon: BarChart3 },
  { path: "/competitive-intelligence", label: "Inteligência Competitiva", icon: Search },
  { path: "/settings", label: "Configurações", icon: Settings }
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

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
              
              <div className="flex items-center gap-4">
                <Button onClick={() => navigate("/campaigns/new")} className="bg-gradient-to-r from-primary to-secondary">
                  <Rocket className="w-4 h-4 mr-2" />
                  Nova Campanha
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-700 font-medium">The Pack is Ready!</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">Minha Conta</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Configurações</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
