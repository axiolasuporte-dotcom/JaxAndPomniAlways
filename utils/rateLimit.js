// Sistema de Rate Limiting (SEM COOLDOWNS)
// Protege contra abuso da API do Discord

const userMessageCount = new Map();

// Configurações de proteção
const CONFIG = {
  // Limites de mensagens
  MAX_MESSAGES_PER_COMMAND: 3,
  MIN_DELAY_BETWEEN_MESSAGES: 2000, // 2 segundos
  
  // Rate limiting global por usuário
  MAX_MESSAGES_PER_MINUTE: 5,
  RESET_INTERVAL: 60000, // 1 minuto
};

/**
 * Verifica rate limit global do usuário
 * @param {string} userId - ID do usuário
 * @returns {object} { allowed: boolean, remaining: number }
 */
export function checkRateLimit(userId) {
  const now = Date.now();
  
  if (!userMessageCount.has(userId)) {
    userMessageCount.set(userId, {
      count: 0,
      resetTime: now + CONFIG.RESET_INTERVAL
    });
  }
  
  const userData = userMessageCount.get(userId);
  
  // Reset se o tempo expirou
  if (now >= userData.resetTime) {
    userData.count = 0;
    userData.resetTime = now + CONFIG.RESET_INTERVAL;
  }
  
  const remaining = CONFIG.MAX_MESSAGES_PER_MINUTE - userData.count;
  const allowed = userData.count < CONFIG.MAX_MESSAGES_PER_MINUTE;
  
  return { allowed, remaining, resetIn: Math.ceil((userData.resetTime - now) / 1000) };
}

/**
 * Incrementa contador de mensagens do usuário
 * @param {string} userId - ID do usuário
 * @param {number} count - Número de mensagens a adicionar
 */
export function incrementMessageCount(userId, count = 1) {
  const userData = userMessageCount.get(userId);
  if (userData) {
    userData.count += count;
  }
}

/**
 * Envia mensagens com rate limiting seguro
 * @param {object} params - Parâmetros
 * @returns {number} - Número de mensagens enviadas
 */
export async function sendMessagesWithRateLimit(params) {
  const { interaction, messages, useFollowUp } = params;
  
  // Limitar número de mensagens
  const messagesToSend = messages.slice(0, CONFIG.MAX_MESSAGES_PER_COMMAND);
  let sent = 0;
  
  for (const messageContent of messagesToSend) {
    try {
      const messageOptions = {
        content: messageContent,
        allowedMentions: { 
          parse: [] // Desabilitar @everyone e @here para segurança
        }
      };

      if (useFollowUp) {
        await interaction.followUp(messageOptions);
      } else {
        await interaction.channel.send(messageOptions);
      }
      
      sent++;
      
      // Delay seguro entre mensagens (2 segundos)
      if (sent < messagesToSend.length) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.MIN_DELAY_BETWEEN_MESSAGES));
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error.message);
      
      // Se for erro de rate limit, parar completamente
      if (error.code === 50035 || error.message.includes('rate limit')) {
        console.error('⚠️ RATE LIMIT DETECTADO - Parando envio');
        break;
      }
    }
  }
  
  // Incrementar contador do usuário
  incrementMessageCount(interaction.user.id, sent);
  
  return sent;
}

/**
 * Limpa contadores expirados (executar periodicamente)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  
  for (const [userId, userData] of userMessageCount.entries()) {
    if (now >= userData.resetTime && userData.count === 0) {
      userMessageCount.delete(userId);
    }
  }
}

// Limpar rate limits a cada 5 minutos
setInterval(cleanupRateLimits, 5 * 60 * 1000);

export { CONFIG };
