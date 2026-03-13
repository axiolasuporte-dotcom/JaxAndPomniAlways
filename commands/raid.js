import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { isWhitelisted } from '../utils/whitelist.js';

export default {
  data: new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Deploy a RAID with interactive buttons'),
  
  async execute(interaction) {
    if (!isWhitelisted(interaction.user.id)) {
      return interaction.reply({
        content: '❌ You do not have permission to use this bot.',
        flags: 64
      });
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('raid_horror')
          .setLabel('Horror')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('💀'),
        new ButtonBuilder()
          .setCustomId('raid_lag')
          .setLabel('Lag')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('⚡'),
        new ButtonBuilder()
          .setCustomId('raid_text')
          .setLabel('Text')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('📝')
      );

    await interaction.reply({
      content: '⚡ **Select the type of RAID to deploy (10 messages per click):**',
      components: [row],
      flags: 64
    });
  },
};