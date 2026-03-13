// Comando: /test
// Mostra status do bot (ephemeral) com ping e versão

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { isWhitelisted } from '../utils/whitelist.js';

// Versão do bot
const BOT_VERSION = '1.0.0';

export default {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('test if bot is online and show info'),
  
  async execute(interaction) {
    // RESPONDER IMEDIATAMENTE (evita timeout de 3s)
    await interaction.deferReply({ flags: 64 });

    // Check if user is whitelisted
    if (!isWhitelisted(interaction.user.id)) {
      return interaction.editReply({
        content: '❌ You do not have permission to use this bot.',
      });
    }

    // Calculate ping
    const ping = Math.round(interaction.client.ws.ping);
    
    // Calculate uptime
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    const uptimeString = `${hours}h ${minutes}m ${seconds}s`;
    
    // Send bot info
    await interaction.editReply({
      content: [
        '✅ **Bot Online**',
        '',
        `📊 **Ping:** ${ping}ms`,
        `📦 **Version:** ${BOT_VERSION}`,
        `⏰ **Uptime:** ${uptimeString}`,
        `🌐 **Servers:** ${interaction.client.guilds.cache.size}`,
        '',
        '*Made by axiola*',
      ].join('\n'),
    });
  },
};
