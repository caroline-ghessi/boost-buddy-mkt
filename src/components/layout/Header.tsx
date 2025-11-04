import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { user } = useAuth();

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <header className="flex items-center justify-between p-6 bg-[#1e1e1e]/80 backdrop-blur-sm border-b border-gray-700/50">
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-400">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Notifications */}
        <div className="relative">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <Bell className="w-5 h-5" />
          </Button>
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
            3
          </span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-[#A1887F]">
            <AvatarFallback className="bg-[#A1887F] text-white">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="font-semibold text-white text-sm">
              {user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-gray-400">Marketing Lead</p>
          </div>
        </div>
      </div>
    </header>
  );
}
