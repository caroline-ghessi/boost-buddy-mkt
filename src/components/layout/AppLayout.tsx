import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PawAnimation } from "./PawAnimation";

interface AppLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ 
  children, 
  title = "Dashboard",
  subtitle = "Welcome back, let's get to work!"
}: AppLayoutProps) {
  return (
    <div className="bg-[#121212] text-gray-200 relative min-h-screen">
      <PawAnimation />
      
      <div className="flex relative z-10">
        <Sidebar />
        
        <main className="flex-1 flex flex-col">
          <Header title={title} subtitle={subtitle} />
          
          <div className="flex-1 p-6 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
