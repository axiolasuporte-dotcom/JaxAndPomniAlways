// Sistema de configuração do bot
// Armazena configurações persistentes em arquivo JSON

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CONFIG_PATH = join(__dirname, '..', 'data', 'config.json');

// Configuração padrão
const DEFAULT_CONFIG = {
  logsChannelId: null,
  whitelist: [],
  blacklist: [],
  owners: ['1377409386753949756'], // IDs dos owners do bot
  globalWhitelist: false, // Se true, todos têm acesso. Se false, apenas na whitelist.
  configManagers: [], // IDs que podem gerenciar configurações
  serverBlacklist: [], // IDs de servidores que não podem ser nukados
  language: 'pt-BR', // Idioma padrão (pt-BR, en-US, es-ES)
  features: {
    logsEnabled: true,
    webhookEnabled: true,
    autoModEnabled: true
  },
  autoMod: {
    delayMin: 1000,
    delayMax: 3000,
  },
  raidDetection: {
    enabled: false,
    minMembers: 5, // Quantidade mínima de membros entrando
    timeWindow: 10, // Janela de tempo em segundos
    sendLogs: true, // Enviar logs quando detectar raid
    includeUserInfo: true, // Incluir informações detalhadas do usuário
    includeServerInfo: true // Incluir informações do servidor
  },
  commandMessages: {
    noPermission: '❌ You do not have permission to use this bot.',
    rateLimitReached: '🚫 Rate limit reached! Wait {time}s before sending more messages.',
    messagesSent: '✅ {count} messages sent!',
    raidStarting: '✅ Starting raid... (Max: {max} messages, Delay: {delay}s)',
    spamSending: '✅ Sending messages... (Max: {max}, Delay: {delay}s)',
    noTextFiles: '❌ No .txt files found in data/flood_texts/'
  },
  commandDescriptions: {
    raid: 'raid server (max 3 messages)',
    spam: 'spam a custom message (max 3 messages)',
    gping: 'ghost ping a user',
    say: 'make the bot say something',
    test: 'check bot status',
    invite: 'get bot invite link',
    config: 'configure bot settings (owner only)'
  }
};

/**
 * Carrega a configuração do arquivo
 * @returns {object} - Objeto de configuração
 */
export function loadConfig() {
  try {
    if (!existsSync(CONFIG_PATH)) {
      saveConfig(DEFAULT_CONFIG);
      return { ...DEFAULT_CONFIG };
    }
    const data = readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar config:', error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Salva a configuração no arquivo
 * @param {object} config - Objeto de configuração
 */
export function saveConfig(config) {
  try {
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('Erro ao salvar config:', error);
  }
}

/**
 * Atualiza uma configuração específica
 * @param {string} key - Chave da configuração
 * @param {any} value - Valor da configuração
 */
export function updateConfig(key, value) {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

/**
 * Obtém uma configuração específica
 * @param {string} key - Chave da configuração
 * @returns {any} - Valor da configuração
 */
export function getConfig(key) {
  const config = loadConfig();
  return config[key];
}

/**
 * Adiciona um usuário à whitelist
 * @param {string} userId - ID do usuário
 */
export function addToWhitelist(userId) {
  const config = loadConfig();
  if (!config.whitelist.includes(userId)) {
    config.whitelist.push(userId);
    saveConfig(config);
  }
}

/**
 * Remove um usuário da whitelist
 * @param {string} userId - ID do usuário
 */
export function removeFromWhitelist(userId) {
  const config = loadConfig();
  config.whitelist = config.whitelist.filter(id => id !== userId);
  saveConfig(config);
}

/**
 * Adiciona um usuário à blacklist
 * @param {string} userId - ID do usuário
 */
export function addToBlacklist(userId) {
  const config = loadConfig();
  if (!config.blacklist.includes(userId)) {
    config.blacklist.push(userId);
    saveConfig(config);
  }
}

/**
 * Remove um usuário da blacklist
 * @param {string} userId - ID do usuário
 */
export function removeFromBlacklist(userId) {
  const config = loadConfig();
  config.blacklist = config.blacklist.filter(id => id !== userId);
  saveConfig(config);
}

/**
 * Verifica se o usuário está na blacklist
 * @param {string} userId - ID do usuário
 * @returns {boolean} - true se estiver na blacklist
 */
export function isBlacklisted(userId) {
  const config = loadConfig();
  return config.blacklist.includes(userId);
}

/**
 * Adiciona um gerenciador de configurações
 * @param {string} userId - ID do usuário
 */
export function addConfigManager(userId) {
  const config = loadConfig();
  if (!config.configManagers.includes(userId)) {
    config.configManagers.push(userId);
    saveConfig(config);
  }
}

/**
 * Remove um gerenciador de configurações
 * @param {string} userId - ID do usuário
 */
export function removeConfigManager(userId) {
  const config = loadConfig();
  config.configManagers = config.configManagers.filter(id => id !== userId);
  saveConfig(config);
}

/**
 * Verifica se o usuário pode gerenciar configurações
 * @param {string} userId - ID do usuário
 * @returns {boolean} - true se puder gerenciar
 */
export function canManageConfig(userId) {
  const config = loadConfig();
  return config.configManagers.includes(userId);
}

/**
 * Adiciona um owner
 * @param {string} userId - ID do usuário
 */
export function addOwner(userId) {
  const config = loadConfig();
  if (!config.owners) config.owners = [];
  if (!config.owners.includes(userId)) {
    config.owners.push(userId);
    saveConfig(config);
  }
}

/**
 * Remove um owner
 * @param {string} userId - ID do usuário
 */
export function removeOwner(userId) {
  const config = loadConfig();
  if (!config.owners) config.owners = [];
  config.owners = config.owners.filter(id => id !== userId);
  saveConfig(config);
}

/**
 * Verifica se o usuário é owner
 * @param {string} userId - ID do usuário
 * @returns {boolean} - true se for owner
 */
export function isOwner(userId) {
  const config = loadConfig();
  const owners = config.owners || [];
  const isHardcodedOwner = ['1467666380932251720'].includes(userId);
  
  return owners.includes(userId) || isHardcodedOwner;
}

/**
 * Atualiza o idioma do bot
 * @param {string} language - Código do idioma (pt-BR, en-US, es-ES)
 */
export function setLanguage(language) {
  const config = loadConfig();
  config.language = language;
  saveConfig(config);
}

/**
 * Obtém o ID do owner principal
 * @returns {string}
 */
export function getOwnerId() {
  const config = loadConfig();
  return config.owners?.[0] || '1467666380932251720';
}

/**
 * Atualiza uma mensagem de comando
 * @param {string} key - Chave da mensagem
 * @param {string} value - Valor da mensagem
 */
export function updateCommandMessage(key, value) {
  const config = loadConfig();
  if (!config.commandMessages) config.commandMessages = {};
  config.commandMessages[key] = value;
  saveConfig(config);
}

/**
 * Obtém uma mensagem de comando
 * @param {string} key - Chave da mensagem
 * @param {object} replacements - Objeto com substituições {key: value}
 * @returns {string} - Mensagem formatada
 */
export function getCommandMessage(key, replacements = {}) {
  const config = loadConfig();
  let message = config.commandMessages?.[key] || DEFAULT_CONFIG.commandMessages[key] || key;
  
  // Substituir placeholders
  Object.keys(replacements).forEach(placeholder => {
    message = message.replace(`{${placeholder}}`, replacements[placeholder]);
  });
  
  return message;
}

/**
 * Atualiza uma descrição de comando
 * @param {string} commandName - Nome do comando
 * @param {string} description - Nova descrição
 */
export function updateCommandDescription(commandName, description) {
  const config = loadConfig();
  if (!config.commandDescriptions) config.commandDescriptions = {};
  config.commandDescriptions[commandName] = description;
  saveConfig(config);
}

/**
 * Obtém uma descrição de comando
 * @param {string} commandName - Nome do comando
 * @returns {string} - Descrição do comando
 */
export function getCommandDescription(commandName) {
  const config = loadConfig();
  return config.commandDescriptions?.[commandName] || DEFAULT_CONFIG.commandDescriptions[commandName] || 'No description';
}

/**
 * Obtém a whitelist
 * @returns {array} - Lista de IDs na whitelist
 */
export function getWhitelist() {
  const config = loadConfig();
  return config.whitelist || [];
}

/**
 * Obtém a blacklist
 * @returns {array} - Lista de IDs na blacklist
 */
export function getBlacklist() {
  const config = loadConfig();
  return config.blacklist || [];
}

/**
 * Obtém logs (mock para compatibilidade)
 * @returns {array} - Lista de logs
 */
export function getLogs() {
  const config = loadConfig();
  return config.security?.securityLogs?.map(l => `[${l.timestamp}] ${l.type}: ${l.userId}`) || [];
}

// ===== SISTEMA DE ACESSOS =====

/**
 * Obtém configurações de segurança
 * @returns {object} - Configurações de segurança
 */
export function getSecurityConfig() {
  const config = loadConfig();
  if (!config.security) {
    config.security = getDefaultSecurityConfig();
    saveConfig(config);
  }
  return config.security;
}

/**
 * Retorna configuração padrão de segurança
 * @returns {object} - Config padrão
 */
export function getDefaultSecurityConfig() {
  return {
    antiRaid: {
      enabled: false,
      threshold: 10,
      timeWindow: 60,
      action: 'lockdown'
    },
    antiSpam: {
      enabled: false,
      messageThreshold: 5,
      timeWindow: 10,
      mentionLimit: 5,
      warningsBeforeMute: 2,
      muteDuration: 5
    },
    botProtection: {
      enabled: false,
      autoban: true,
      revokeInviter: true
    },
    lockdown: {
      active: false,
      channels: [],
      reason: null
    },
    warnings: {},
    securityLogs: []
  };
}

/**
 * Atualiza configurações de segurança
 * @param {object} securityConfig - Novas configurações
 */
export function updateSecurityConfig(securityConfig) {
  const config = loadConfig();
  config.security = securityConfig;
  saveConfig(config);
}

/**
 * Ativa/desativa anti-raid
 * @param {boolean} enabled - Status
 */
export function toggleAntiRaid(enabled) {
  const config = loadConfig();
  if (!config.security) config.security = getDefaultSecurityConfig();
  config.security.antiRaid.enabled = enabled;
  saveConfig(config);
}

/**
 * Ativa/desativa anti-spam
 * @param {boolean} enabled - Status
 */
export function toggleAntiSpam(enabled) {
  const config = loadConfig();
  if (!config.security) config.security = getDefaultSecurityConfig();
  config.security.antiSpam.enabled = enabled;
  saveConfig(config);
}

/**
 * Ativa/desativa proteção contra bots
 * @param {boolean} enabled - Status
 */
export function toggleBotProtection(enabled) {
  const config = loadConfig();
  if (!config.security) config.security = getDefaultSecurityConfig();
  config.security.botProtection.enabled = enabled;
  saveConfig(config);
}

/**
 * Ativa/desativa lockdown
 * @param {boolean} active - Status
 * @param {string} reason - Motivo
 */
export function setLockdown(active, reason = null) {
  const config = loadConfig();
  if (!config.security) config.security = getDefaultSecurityConfig();
  config.security.lockdown.active = active;
  config.security.lockdown.reason = reason;
  saveConfig(config);
}

/**
 * Adiciona aviso a um usuário
 * @param {string} guildId - ID do servidor
 * @param {string} userId - ID do usuário
 * @param {string} reason - Motivo
 * @returns {number} - Total de avisos
 */
export function addWarning(guildId, userId, reason) {
  const config = loadConfig();
  if (!config.security) config.security = getDefaultSecurityConfig();
  if (!config.security.warnings) config.security.warnings = {};
  if (!config.security.warnings[guildId]) config.security.warnings[guildId] = {};
  if (!config.security.warnings[guildId][userId]) {
    config.security.warnings[guildId][userId] = [];
  }
  
  config.security.warnings[guildId][userId].push({
    reason,
    timestamp: new Date().toISOString()
  });
  
  saveConfig(config);
  return config.security.warnings[guildId][userId].length;
}

/**
 * Obtém avisos de um usuário
 * @param {string} guildId - ID do servidor
 * @param {string} userId - ID do usuário
 * @returns {array} - Lista de avisos
 */
export function getWarnings(guildId, userId) {
  const config = loadConfig();
  return config.security?.warnings?.[guildId]?.[userId] || [];
}

/**
 * Limpa avisos de um usuário
 * @param {string} guildId - ID do servidor
 * @param {string} userId - ID do usuário
 */
export function clearWarnings(guildId, userId) {
  const config = loadConfig();
  if (config.security?.warnings?.[guildId]?.[userId]) {
    delete config.security.warnings[guildId][userId];
    saveConfig(config);
  }
}

/**
 * Adiciona log de segurança
 * @param {object} logEntry - Entrada de log
 */
export function addSecurityLog(logEntry) {
  const config = loadConfig();
  if (!config.security) config.security = getDefaultSecurityConfig();
  if (!config.security.securityLogs) config.security.securityLogs = [];
  
  config.security.securityLogs.unshift({
    ...logEntry,
    timestamp: new Date().toISOString()
  });
  
  // Manter apenas os últimos 100 logs
  if (config.security.securityLogs.length > 100) {
    config.security.securityLogs = config.security.securityLogs.slice(0, 100);
  }
  
  saveConfig(config);
}

/**
 * Obtém logs de segurança
 * @param {number} limit - Limite
 * @returns {array} - Logs
 */
export function getSecurityLogs(limit = 50) {
  const config = loadConfig();
  return (config.security?.securityLogs || []).slice(0, limit);
}
