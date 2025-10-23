export const buddyMessages = {
  working: [
    "🐕 Farejando as melhores soluções...",
    "🐾 Correndo atrás dos resultados...",
    "🦴 Buscando insights fresquinhos...",
    "🎾 Pegando os dados mais importantes...",
    "👃 Cavando fundo nos dados...",
    "🐕‍🦺 The Pack está trabalhando duro!",
  ],
  
  success: [
    "🐕 Auau! Missão cumprida!",
    "🐾 Trouxe o osso de volta!",
    "⭐ Bom garoto! Tudo pronto!",
    "🎉 Rabo abanando de felicidade!",
    "🎾 Peguei os resultados que você pediu!",
    "💙 Trouxe resultados fresquinhos!",
  ],
  
  waiting: [
    "🐕 Sentado, aguardando seu comando...",
    "👀 Olhando atentamente para você...",
    "🐾 Pronto para a próxima aventura!",
    "🦴 Esperando ansiosamente...",
  ],
  
  alert: [
    "🚨 Au-au! Detectei algo que precisa de atenção",
    "⚠️ Orelhas em pé! Temos um alerta aqui",
    "👃 Farejei algo importante!",
    "🐕 Latindo para chamar sua atenção!",
  ],
  
  error: [
    "😢 Oops! Isso não saiu como planejado...",
    "🐕 Não consegui pegar esse osso ainda, mas vou tentar de novo!",
    "💔 Me desculpe, tive um probleminha...",
    "🐾 Tropeçei aqui, mas já estou de pé!",
  ],
  
  empathy: [
    "🐕 Sei que está difícil, mas estou aqui com você",
    "💙 Como seu Buddy, vou encontrar uma solução",
    "🐾 Nunca vou te abandonar, vamos juntos!",
    "⭐ Confie em mim, sou seu melhor amigo!",
  ],
};

export const getRandomMessage = (category: keyof typeof buddyMessages): string => {
  const messages = buddyMessages[category];
  return messages[Math.floor(Math.random() * messages.length)];
};
