import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const ModelSelector = ({ value, onValueChange }: ModelSelectorProps) => {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o modelo LLM" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>🔥 Claude Direct (Anthropic API) - Máximo Controle</SelectLabel>
          <SelectItem value="claude-sonnet-4-20250514">
            Claude Sonnet 4 (2025) ⭐ (Mais Recente)
          </SelectItem>
          <SelectItem value="claude-opus-4-20250514">
            Claude Opus 4 (2025) 💎 (Mais Poderoso)
          </SelectItem>
          <SelectItem value="claude-3-7-sonnet-20250219">
            Claude 3.7 Sonnet (Pensamento Estendido)
          </SelectItem>
          <SelectItem value="claude-3-5-haiku-20241022">
            Claude 3.5 Haiku (Mais Rápido)
          </SelectItem>
          <SelectItem value="claude-3-5-sonnet-20241022-direct">
            Claude 3.5 Sonnet Direct (Legacy)
          </SelectItem>
          <SelectItem value="claude-3-opus-20240229">
            Claude 3 Opus (Legacy)
          </SelectItem>
          <SelectItem value="claude-3-haiku-20240307">
            Claude 3 Haiku (Legacy)
          </SelectItem>
        </SelectGroup>
        
        <SelectGroup>
          <SelectLabel>🤖 OpenAI Direct - Acesso Direto</SelectLabel>
          <SelectItem value="gpt-5-2025-08-07">
            GPT-5 (Flagship) 🚀
          </SelectItem>
          <SelectItem value="gpt-5-mini-2025-08-07">
            GPT-5 Mini (Balanceado)
          </SelectItem>
          <SelectItem value="gpt-5-nano-2025-08-07">
            GPT-5 Nano (Rápido)
          </SelectItem>
          <SelectItem value="o3-2025-04-16">
            O3 (Raciocínio Avançado)
          </SelectItem>
          <SelectItem value="o4-mini-2025-04-16">
            O4 Mini (Raciocínio Rápido)
          </SelectItem>
        </SelectGroup>
        
        <SelectGroup>
          <SelectLabel>✨ Google Gemini Direct - Multimodal</SelectLabel>
          <SelectItem value="gemini-2.5-pro">
            Gemini 2.5 Pro ⭐ (Reasoning Complexo)
          </SelectItem>
          <SelectItem value="gemini-2.5-flash">
            Gemini 2.5 Flash (Melhor Custo-Benefício)
          </SelectItem>
          <SelectItem value="gemini-2.0-flash-exp">
            Gemini 2.0 Flash Exp (Experimental)
          </SelectItem>
          <SelectItem value="gemini-1.5-pro">
            Gemini 1.5 Pro (Legacy)
          </SelectItem>
          <SelectItem value="gemini-1.5-flash">
            Gemini 1.5 Flash (Legacy)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
