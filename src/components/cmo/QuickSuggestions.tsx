import { Button } from "@/components/ui/button";

interface QuickSuggestionsProps {
  onSuggestionClick?: (suggestion: string) => void;
}

const suggestions = [
  "Campanha Completa",
  "Análise Competitiva",
  "Otimização SEO",
];

export function QuickSuggestions({ onSuggestionClick }: QuickSuggestionsProps) {
  return (
    <div className="flex gap-2">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion}
          variant="ghost"
          size="sm"
          onClick={() => onSuggestionClick?.(suggestion)}
          className="px-3 py-1 bg-[#2a2a2a] text-gray-300 text-xs rounded-full hover:bg-[#333333] transition-all duration-200"
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
