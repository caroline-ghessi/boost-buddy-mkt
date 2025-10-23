import { getRandomMessage } from "@/lib/buddyMessages";
import { useEffect, useState } from "react";

interface BuddyLoadingSpinnerProps {
  message?: string;
}

export function BuddyLoadingSpinner({ message }: BuddyLoadingSpinnerProps) {
  const [displayMessage, setDisplayMessage] = useState(
    message || getRandomMessage("working")
  );

  useEffect(() => {
    if (!message) {
      const interval = setInterval(() => {
        setDisplayMessage(getRandomMessage("working"));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [message]);

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Animated dog running */}
      <div className="text-6xl animate-bounce mb-4">
        🐕‍🦺
      </div>
      
      {/* Animated paw prints */}
      <div className="flex gap-2 mb-4">
        <span className="text-2xl animate-pulse" style={{ animationDelay: "0s" }}>🐾</span>
        <span className="text-2xl animate-pulse" style={{ animationDelay: "0.2s" }}>🐾</span>
        <span className="text-2xl animate-pulse" style={{ animationDelay: "0.4s" }}>🐾</span>
      </div>
      
      <p className="text-secondary font-medium text-center max-w-md">
        {displayMessage}
      </p>
    </div>
  );
}
