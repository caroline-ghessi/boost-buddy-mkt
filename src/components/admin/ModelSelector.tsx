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
          <SelectLabel>🌟 Claude (Lovable AI) - Raciocínio Superior</SelectLabel>
          <SelectItem value="claude-sonnet-4-5">
            Claude Sonnet 4.5 ⭐ (Recomendado Líderes)
          </SelectItem>
          <SelectItem value="claude-opus-4-1-20250805">
            Claude Opus 4.1 (Alta Inteligência)
          </SelectItem>
          <SelectItem value="claude-3-5-sonnet-20241022">
            Claude 3.5 Sonnet (Balanceado)
          </SelectItem>
        </SelectGroup>
        
        <SelectGroup>
          <SelectLabel>🤖 GPT (Lovable AI) - Análise Poderosa</SelectLabel>
          <SelectItem value="openai/gpt-5">
            GPT-5 (Máximo Desempenho)
          </SelectItem>
          <SelectItem value="openai/gpt-5-mini">
            GPT-5 Mini (Balanceado)
          </SelectItem>
          <SelectItem value="openai/gpt-5-nano">
            GPT-5 Nano (Rápido e Eficiente)
          </SelectItem>
        </SelectGroup>
        
        <SelectGroup>
          <SelectLabel>✨ Gemini (Lovable AI) - Multimodal</SelectLabel>
          <SelectItem value="google/gemini-2.5-pro">
            Gemini 2.5 Pro (Complexo)
          </SelectItem>
          <SelectItem value="google/gemini-2.5-flash">
            Gemini 2.5 Flash (Recomendado Geral)
          </SelectItem>
          <SelectItem value="google/gemini-2.5-flash-lite">
            Gemini 2.5 Flash Lite (QA/Analytics)
          </SelectItem>
          <SelectItem value="google/gemini-2.0-flash-exp">
            Gemini 2.0 Flash Experimental
          </SelectItem>
          <SelectItem value="google/gemini-2.5-flash-image">
            Gemini Flash Image (Geração de Imagens)
          </SelectItem>
        </SelectGroup>
        
        <SelectGroup>
          <SelectLabel>🔧 OpenAI Direct - Acesso Direto</SelectLabel>
          <SelectItem value="gpt-5-2025-08-07">
            GPT-5 (OpenAI Direct)
          </SelectItem>
          <SelectItem value="gpt-5-mini-2025-08-07">
            GPT-5 Mini (OpenAI Direct)
          </SelectItem>
          <SelectItem value="gpt-5-nano-2025-08-07">
            GPT-5 Nano (OpenAI Direct)
          </SelectItem>
          <SelectItem value="o3-2025-04-16">
            O3 (Raciocínio Avançado)
          </SelectItem>
          <SelectItem value="o4-mini-2025-04-16">
            O4 Mini (Raciocínio Rápido)
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
