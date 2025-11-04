export interface BuddyAgent {
  id: string;
  name: string;
  role: string;
  level: 1 | 2 | 3;
  specialty: string;
  emoji: string;
  breed: string;
  breedTrait: string;
  color: string;
  status: "active" | "idle" | "busy";
  yearsExperience: number;
  team: string;
  imageUrl?: string;
}

export const buddyAgents: BuddyAgent[] = [
  // Level 1 - Leadership
  {
    id: "cmo",
    name: "Ricardo Mendes",
    role: "Chief Marketing Officer",
    level: 1,
    specialty: "Marketing Strategy",
    emoji: "🐕‍🦺",
    breed: "German Shepherd",
    breedTrait: "Liderança e Estratégia",
    color: "#8B6F47",
    status: "active",
    yearsExperience: 15,
    team: "Leadership",
  },
  
  // Level 2 - Intelligence Team
  {
    id: "market-research",
    name: "Ana Beatriz",
    role: "Market Research Specialist",
    level: 2,
    specialty: "Intelligence",
    emoji: "🐕",
    breed: "Border Collie",
    breedTrait: "Inteligência Analítica",
    color: "#2C3E50",
    status: "active",
    yearsExperience: 10,
    team: "Intelligence",
  },
  {
    id: "competitive-intel",
    name: "Thiago Costa",
    role: "Competitive Intelligence",
    level: 2,
    specialty: "Intelligence",
    emoji: "🐶",
    breed: "Beagle",
    breedTrait: "Investigação e Faro",
    color: "#E67E22",
    status: "busy",
    yearsExperience: 8,
    team: "Intelligence",
  },
  {
    id: "consumer-insights",
    name: "Camila Ribeiro",
    role: "Consumer Insights",
    level: 2,
    specialty: "Intelligence",
    emoji: "🦮",
    breed: "Golden Retriever",
    breedTrait: "Empatia e Conexão",
    color: "#D4A574",
    status: "idle",
    yearsExperience: 9,
    team: "Intelligence",
  },
  
  // Level 2 - Strategy Team
  {
    id: "brand-strategist",
    name: "Fernando Alves",
    role: "Brand Strategist",
    level: 2,
    specialty: "Strategy",
    emoji: "🐺",
    breed: "Siberian Husky",
    breedTrait: "Visão Criativa",
    color: "#5DADE2",
    status: "active",
    yearsExperience: 12,
    team: "Strategy",
  },
  {
    id: "content-strategist",
    name: "Juliana Santos",
    role: "Content Strategist",
    level: 2,
    specialty: "Strategy",
    emoji: "🐕‍🦺",
    breed: "Australian Shepherd",
    breedTrait: "Organização e Energia",
    color: "#48C9B0",
    status: "idle",
    yearsExperience: 10,
    team: "Strategy",
  },
  
  // Level 3 - Content Creation (Text)
  {
    id: "senior-copywriter",
    name: "Pedro Martins",
    role: "Senior Copywriter",
    level: 3,
    specialty: "Content Creation",
    emoji: "🐩",
    breed: "Poodle",
    breedTrait: "Elegância Verbal",
    color: "#9B59B6",
    status: "busy",
    yearsExperience: 8,
    team: "Content",
  },
  {
    id: "social-copywriter",
    name: "Larissa Oliveira",
    role: "Social Media Copywriter",
    level: 3,
    specialty: "Content Creation",
    emoji: "🐕",
    breed: "Jack Russell Terrier",
    breedTrait: "Agilidade e Energia",
    color: "#F39C12",
    status: "active",
    yearsExperience: 6,
    team: "Content",
  },
  
  // Level 3 - Visual Creation
  {
    id: "art-director",
    name: "Gustavo Lima",
    role: "Art Director",
    level: 3,
    specialty: "Visual Design",
    emoji: "🐕",
    breed: "Afghan Hound",
    breedTrait: "Refinamento Estético",
    color: "#8E44AD",
    status: "idle",
    yearsExperience: 11,
    team: "Creative",
  },
  {
    id: "image-specialist",
    name: "Marina Silva",
    role: "Image Specialist",
    level: 3,
    specialty: "Visual Design",
    emoji: "🐕",
    breed: "Dalmatian",
    breedTrait: "Criatividade Visual",
    color: "#34495E",
    status: "active",
    yearsExperience: 7,
    team: "Creative",
  },
  {
    id: "video-director",
    name: "Lucas Ferreira",
    role: "Video Director",
    level: 3,
    specialty: "Video Content",
    emoji: "🐕",
    breed: "Great Dane",
    breedTrait: "Visão Cinematográfica",
    color: "#2C3E50",
    status: "busy",
    yearsExperience: 9,
    team: "Creative",
  },
  {
    id: "video-specialist",
    name: "Beatriz Rocha",
    role: "Video Specialist",
    level: 3,
    specialty: "Video Content",
    emoji: "🐕",
    breed: "Shiba Inu",
    breedTrait: "Precisão Técnica",
    color: "#E74C3C",
    status: "idle",
    yearsExperience: 5,
    team: "Creative",
  },
  
  // Level 3 - Paid Media Team
  {
    id: "paid-media-strategist",
    name: "Rafael Campos",
    role: "Paid Media Strategist",
    level: 3,
    specialty: "Paid Media",
    emoji: "🦮",
    breed: "Labrador Retriever",
    breedTrait: "Confiabilidade Estratégica",
    color: "#F4D03F",
    status: "active",
    yearsExperience: 10,
    team: "Paid Media",
  },
  {
    id: "meta-ads-specialist",
    name: "Isabela Carvalho",
    role: "Meta Ads Specialist",
    level: 3,
    specialty: "Paid Media",
    emoji: "🐕",
    breed: "Welsh Corgi",
    breedTrait: "Agilidade Digital",
    color: "#3498DB",
    status: "busy",
    yearsExperience: 6,
    team: "Paid Media",
  },
  {
    id: "ads-creative-specialist",
    name: "Daniel Souza",
    role: "Ads Creative Specialist",
    level: 3,
    specialty: "Paid Media",
    emoji: "🐕",
    breed: "Boston Terrier",
    breedTrait: "Criatividade em Ads",
    color: "#E67E22",
    status: "active",
    yearsExperience: 7,
    team: "Paid Media",
  },
  {
    id: "performance-analyst",
    name: "Carolina Nunes",
    role: "Performance Analyst",
    level: 3,
    specialty: "Paid Media",
    emoji: "🐕",
    breed: "Shetland Sheepdog",
    breedTrait: "Análise Profunda",
    color: "#16A085",
    status: "idle",
    yearsExperience: 8,
    team: "Paid Media",
  },
  
  // Level 3 - Quality Team
  {
    id: "qa-specialist",
    name: "Renata Gomes",
    role: "QA Specialist",
    level: 3,
    specialty: "Quality",
    emoji: "🐕",
    breed: "Chihuahua",
    breedTrait: "Atenção aos Detalhes",
    color: "#E74C3C",
    status: "active",
    yearsExperience: 6,
    team: "Quality",
  },
  {
    id: "brand-compliance",
    name: "André Barbosa",
    role: "Brand Compliance",
    level: 3,
    specialty: "Quality",
    emoji: "🐕",
    breed: "Rottweiler",
    breedTrait: "Proteção da Marca",
    color: "#2C3E50",
    status: "idle",
    yearsExperience: 9,
    team: "Quality",
  },
];

export const getAgentsByLevel = (level: 1 | 2 | 3) => {
  return buddyAgents.filter((agent) => agent.level === level);
};

export const getAgentsByTeam = (team: string) => {
  return buddyAgents.filter((agent) => agent.team === team);
};

export const getAgentById = (id: string) => {
  return buddyAgents.find((agent) => agent.id === id);
};
