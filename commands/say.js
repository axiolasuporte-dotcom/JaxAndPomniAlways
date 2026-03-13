// Comando: /say
// Faz o bot repetir uma mensagem com formatação personalizada

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { canSendMessages } from '../utils/permissions.js';
import { isWhitelisted } from '../utils/whitelist.js';

export default {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('make the bot say something')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('message for the bot to say')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('embed')
        .setDescription('send as embed')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    // RESPONDER IMEDIATAMENTE (evita timeout de 3s)
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Check if user is whitelisted
    if (!isWhitelisted(interaction.user.id)) {
      return interaction.editReply({
        content: '❌ You do not have permission to use this bot.',
      });
    }

    const message = interaction.options.getString('message');
    const useEmbed = interaction.options.getBoolean('embed') || false;
    
    // Check permissions and delivery method
    const { canSend, useFollowUp, errorMessage } = canSendMessages(interaction);
    if (!canSend) {
      return interaction.editReply({
        content: errorMessage,
      });
    }
    
    // Update first message
    await interaction.editReply({
      content: '✅ Message sent!',
    });
    
    // Send message
    try {
      if (useEmbed) {
        await interaction.followUp({
          embeds: [{
            description: message,
            color: 0x5865F2,
          }],
        });
      } else {
        await interaction.followUp(message);
      }
    } catch (error) {
      console.error('Error sending say:', error.message);
      await interaction.editReply({
        content: `❌ Error sending message: ${error.message}\n💡 Check if the bot has permission to send messages in this channel.`,
      });
    }
  },
};
