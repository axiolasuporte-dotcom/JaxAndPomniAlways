// Utility para verificar permissões de canal
// Modificado para suportar bot funcionando externamente (User Install)

/**
 * Verifica se o bot pode realizar a operação
 * @param {Interaction} interaction - A interação do Discord
 * @returns {Object} { canSend: boolean, errorMessage: string|null }
 */
export function canSendMessages(interaction) {
  // Para bot funcionar externamente, sempre retornamos true
  // pois o Discord permite responder interações via followUp
  // em qualquer lugar onde o usuário possa usar o comando.
  return { 
    canSend: true, 
    errorMessage: null 
  };
}
