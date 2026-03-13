// Logging System for Discord Bot
// Logs messages to console and log file

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logsDir = join(__dirname, '..', 'logs');
const HISTORY_PATH = join(__dirname, '..', 'data', 'command_history.json');

// Create logs folder if it doesn't exist
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Console colors
const colors = {
  reset: '\x1b[0m',
  info: '\x1b[36m',    // Cyan
  success: '\x1b[32m', // Green
  warn: '\x1b[33m',    // Yellow
  error: '\x1b[31m',   // Red
  debug: '\x1b[35m',   // Magenta
};

/**
 * Main logging function
 * @param {string} message - Message to be logged
 * @param {string} level - Log level (info, success, warn, error, debug)
 */
export function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const color = colors[level] || colors.info;
  const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Colored console
  console.log(`${color}${logMessage}${colors.reset}`);
  
  // Plain file
  const logFile = join(logsDir, `bot-${new Date().toISOString().split('T')[0]}.log`);
  try {
    appendFileSync(logFile, logMessage + '\n');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

/**
 * Loads command history
 * @returns {Array} - Array of executed commands
 */
function loadCommandHistory() {
  try {
    if (!existsSync(HISTORY_PATH)) {
      return [];
    }
    const data = readFileSync(HISTORY_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading history:', error);
    return [];
  }
}

/**
 * Saves command history
 * @param {Array} history - Array of commands
 */
function saveCommandHistory(history) {
  try {
    writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving history:', error);
  }
}

/**
 * Adds command to history
 * @param {object} commandData - Data of executed command
 */
export function addToCommandHistory(commandData) {
  const history = loadCommandHistory();
  history.push({
    ...commandData,
    timestamp: new Date().toISOString()
  });
  
  // Keep only the last 100 commands
  if (history.length > 100) {
    history.shift();
  }
  
  saveCommandHistory(history);
}

/**
 * Gets command history
 * @param {number} limit - Limit of commands to return
 * @returns {Array} - Array of executed commands
 */
export function getCommandHistory(limit = 50) {
  const history = loadCommandHistory();
  return history.slice(-limit).reverse();
}

/**
 * Logs executed command action
 * @param {object} params - Action parameters
 */
export function logCommandAction(params) {
  const { command, user, guild, target, content } = params;
  const logMessage = [
    `Command: ${command}`,
    `Executor: ${user.tag} (${user.id})`,
    guild ? `Server: ${guild.name} (${guild.id})` : 'DM',
    target ? `Target: ${target.tag} (${target.id})` : null,
    content ? `Content: ${content}` : null,
  ].filter(Boolean).join(' | ');
  
  log(logMessage, 'info');
  
  // Add to history
  addToCommandHistory({
    command,
    user: {
      id: user.id,
      tag: user.tag,
      username: user.username
    },
    guild: guild ? {
      id: guild.id,
      name: guild.name,
      memberCount: guild.memberCount,
      ownerId: guild.ownerId
    } : null,
    target: target ? {
      id: target.id,
      tag: target.tag
    } : null,
    content: content || null
  });
  
  return logMessage;
}

/**
 * Sends detailed log to configured logs channel
 * @param {object} client - Discord client
 * @param {object} params - Log parameters
 */
export async function sendDetailedLog(client, params) {
  const { loadConfig } = await import('./config.js');
  const { EmbedBuilder } = await import('discord.js');
  
  const config = loadConfig();
  
  // Check if logs are enabled and channel is configured
  if (!config.features?.logsEnabled || !config.logsChannelId) {
    return;
  }
  
  const { command, executor, target, channel, guild, content, color = 0x5865F2 } = params;
  
  try {
    const logsChannel = await client.channels.fetch(config.logsChannelId);
    if (!logsChannel || !logsChannel.send) return;
    
    // Detailed executor info
    const executorAge = Math.floor((Date.now() - executor.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    const embed = new EmbedBuilder()
      .setTitle(`📋 [${command.toUpperCase()}] Command Executed`)
      .setColor(color)
      .setTimestamp()
      .addFields(
        { 
          name: '👤 Executor', 
          value: [
            `**Tag:** ${executor.tag}`,
            `**ID:** \`${executor.id}\``,
            `**Username:** ${executor.username}`,
            `**Bot:** ${executor.bot ? '✅ Yes' : '❌ No'}`,
            `**Account created:** ${executor.createdAt.toLocaleDateString('en-US')}`,
            `**Account age:** ${executorAge} days`
          ].join('\n'),
          inline: false 
        }
      );
    
    // Thumbnail with executor's avatar
    if (executor.displayAvatarURL) {
      embed.setThumbnail(executor.displayAvatarURL({ dynamic: true, size: 256 }));
    }
    
    // Server info
    if (guild) {
      embed.addFields({
        name: '🌐 Server',
        value: [
          `**Name:** ${guild.name}`,
          `**ID:** \`${guild.id}\``,
          `**Total Members:** ${guild.memberCount || 'N/A'}`,
          `**Owner ID:** \`${guild.ownerId || 'N/A'}\``
        ].join('\n'),
        inline: true
      });
      
      if (guild.iconURL) {
        embed.setFooter({ 
          text: `Server: ${guild.name}`, 
          iconURL: guild.iconURL({ dynamic: true }) 
        });
      }
    } else {
      embed.addFields({
        name: '🌐 Location',
        value: '📬 DM (Direct Message)',
        inline: true
      });
    }
    
    // Channel info
    if (channel) {
      embed.addFields({
        name: '📝 Channel',
        value: [
          `**Name:** ${channel.name}`,
          `**ID:** \`${channel.id}\``,
          `**Type:** ${channel.type}`
        ].join('\n'),
        inline: true
      });
    }
    
    // Target info (if any)
    if (target) {
      const targetAge = Math.floor((Date.now() - target.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      embed.addFields({ 
        name: '🎯 Command Target', 
        value: [
          `**Tag:** ${target.tag}`,
          `**ID:** \`${target.id}\``,
          `**Bot:** ${target.bot ? '✅ Yes' : '❌ No'}`,
          `**Account age:** ${targetAge} days`
        ].join('\n'),
        inline: false 
      });
    }
    
    // Command content (if any)
    if (content) {
      embed.addFields({ 
        name: '💬 Content', 
        value: `\`\`\`${content.substring(0, 1000)}\`\`\``, 
        inline: false 
      });
    }
    
    await logsChannel.send({ embeds: [embed] });
    
  } catch (error) {
    log(`❌ Error sending detailed log: ${error.message}`, 'error');
  }
}
