// Comando: /panel
// Painel interativo principal do bot

import { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  MessageFlags
} from 'discord.js';
import { isOwner, getOwnerId } from '../utils/owner.js';
import { loadWhitelist, isWhitelisted } from '../utils/whitelist.js';
import { loadConfig } from '../utils/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('open bot control panel'),
  
  async execute(interaction) {
    const config = loadConfig();
    const whitelist = loadWhitelist();
    const userIsOwner = isOwner(interaction.user.id);
    const userIsWhitelisted = isWhitelisted(interaction.user.id);
    const hasAccess = userIsOwner || userIsWhitelisted;

    // Create main embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎛️ Control Panel')
      .setDescription(`Welcome to the bot's control panel!\n\n**Owner:** axiola\n**Your Access:** ${userIsOwner ? '👑 Owner' : userIsWhitelisted ? '✅ Whitelisted' : '❌ No Permission'}`)
      .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { 
          name: '📊 Statistics', 
          value: [
            `**Servers:** ${interaction.client.guilds.cache.size}`,
            `**Whitelist:** ${whitelist.length} user(s)`,
            `**Ping:** ${Math.round(interaction.client.ws.ping)}ms`
          ].join('\n'),
          inline: true 
        },
        { 
          name: '🛡️ Security', 
          value: [
            `**Anti-Raid:** ${config.security?.antiRaid?.enabled ? '✅' : '❌'}`,
            `**Anti-Spam:** ${config.security?.antiSpam?.enabled ? '✅' : '❌'}`,
            `**Lockdown:** ${config.security?.lockdown?.active ? '🔒' : '🔓'}`
          ].join('\n'),
          inline: true 
        }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag} | Made by axiola` })
      .setTimestamp();

    // First row of buttons - Public
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('panel_help')
        .setLabel('Help')
        .setEmoji('❓')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('panel_commands')
        .setLabel('Commands')
        .setEmoji('📜')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('panel_status')
        .setLabel('Status')
        .setEmoji('📊')
        .setStyle(ButtonStyle.Secondary)
    );

    // Segunda linha de botões - Owner only
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('panel_edit')
        .setLabel('Edit')
        .setEmoji('⚙️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!userIsOwner),
      new ButtonBuilder()
        .setCustomId('panel_security')
        .setLabel('Security')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Success)
        .setDisabled(!userIsOwner),
      new ButtonBuilder()
        .setCustomId('panel_whitelist')
        .setLabel('Whitelist')
        .setEmoji('📋')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!userIsOwner),
      new ButtonBuilder()
        .setCustomId('panel_global_whitelist')
        .setLabel('Global WL')
        .setEmoji('🌍')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!userIsOwner),
      new ButtonBuilder()
        .setCustomId('panel_blacklist_server')
        .setLabel('Blacklist Server')
        .setEmoji('🚫')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!userIsOwner)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row1, row2],
      flags: MessageFlags.Ephemeral
    });
  }
};
