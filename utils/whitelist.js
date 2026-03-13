import { loadConfig, isOwner } from './config.js';

/**
 * Verifica se um usuário está na whitelist ou é owner
 * @param {string} userId - ID do usuário
 * @returns {boolean} - True se tem permissão
 */
export function isWhitelisted(userId) {
  const config = loadConfig();
  const owners = config.owners || ['1467666380932251720'];
  
  // Logic: Owner, Whitelisted, or Global Whitelist enabled
  if (owners.includes(userId)) return true;
  if (config.globalWhitelist === true) return true;
  if (config.whitelist && config.whitelist.includes(userId)) return true;
  
  return false;
}

/**
 * Adiciona um usuário à whitelist (via config.js)
 * @param {string} userId - ID do usuário
 */
export async function addToWhitelist(userId) {
  const { addToWhitelist: addWL } = await import('./config.js');
  addWL(userId);
}

/**
 * Remove um usuário da whitelist (via config.js)
 * @param {string} userId - ID do usuário
 */
export async function removeFromWhitelist(userId) {
  const { removeFromWhitelist: removeWL } = await import('./config.js');
  removeWL(userId);
}

/**
 * Carrega a whitelist (via config.js)
 * @returns {string[]}
 */
export function loadWhitelist() {
  const config = loadConfig();
  return config.whitelist || [];
}
