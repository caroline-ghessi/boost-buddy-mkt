import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BuddyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
  showPaw?: boolean;
}

export function BuddyButton({ 
  children, 
  variant = "primary", 
  showPaw = true,
  className,
  ...props 
}: BuddyButtonProps) {
  return (
    <Button
      className={cn(
        "rounded-full font-semibold transition-all hover:scale-105 shadow-md hover:shadow-lg",
        variant === "primary" && "bg-gradient-to-r from-primary to-secondary hover:opacity-90",
        variant === "secondary" && "bg-accent hover:bg-accent/90",
        variant === "outline" && "border-2 border-primary hover:bg-primary/10",
        className
      )}
      {...props}
    >
      <span className="flex items-center gap-2">
        {showPaw && <span className="text-lg">🐾</span>}
        {children}
      </span>
    </Button>
  );
}
