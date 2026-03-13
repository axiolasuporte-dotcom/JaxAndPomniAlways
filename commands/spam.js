// Comando: /spam
// Spamma uma mensagem personalizada (SEM LIMITES)

import { SlashCommandBuilder, MessageFlags, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { isWhitelisted } from '../utils/whitelist.js';
import { canSendMessages } from '../utils/permissions.js';

export default {
  data: new SlashCommandBuilder()
    .setName('spam')
    .setDescription('spam a custom message unlimited')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('message to spam')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('quantidade')
        .setDescription('amount of messages to send')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(100)
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

    // Check permissions and delivery method
    const { canSend, errorMessage } = canSendMessages(interaction);
    if (!canSend) {
      return interaction.editReply({
        content: errorMessage,
      });
    }

    const message = interaction.options.getString('message');
    const quantidade = interaction.options.getInteger('quantidade') || 5;
    
    // Update initial message
    await interaction.editReply({
      content: '✅ Sending messages...',
    });
    
    // Mass send messages (Parallel for max speed)
    const promises = [];
    for (let i = 0; i < quantidade; i++) {
      let finalMessage = message;

      const messageOptions = {
        content: finalMessage,
        allowedMentions: { 
          parse: ['everyone', 'users', 'roles']
        }
      };

      if (interaction.deferred || interaction.replied) {
        promises.push(
          interaction.followUp(messageOptions)
            .then(() => true)
            .catch(err => {
              console.error('Parallel send error:', err.message);
              return false;
            })
        );
      }
    }

    // Wait for all triggers
    const results = await Promise.all(promises);
    const sent = results.filter(r => r === true).length;
    
    // Repeat button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`spam_repeat_${quantidade}_${Buffer.from(message).toString('base64')}`)
          .setLabel('Send More')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🚀')
      );

    // Update completion message
    try {
      await interaction.editReply({
        content: `✅ ${sent} messages sent!`,
        components: [row]
      });
    } catch (error) {
      console.error('Error editing final reply:', error.message);
    }
  },
};
