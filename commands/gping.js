// Comando: /gping (Ghost Ping)
// Menciona um usuário e deleta a mensagem imediatamente (ghostping)

import { SlashCommandBuilder, REST, Routes, MessageFlags } from 'discord.js';
import { canSendMessages } from '../utils/permissions.js';
import { isWhitelisted } from '../utils/whitelist.js';
import { checkRateLimit, incrementMessageCount } from '../utils/rateLimit.js';

export default {
  data: new SlashCommandBuilder()
    .setName('gping')
    .setDescription('ghostping someone mentions and removes')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('target')
        .setRequired(true)
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

    // Check global rate limit
    const rateLimit = checkRateLimit(interaction.user.id);
    if (!rateLimit.allowed) {
      return interaction.editReply({
        content: `🚫 Rate limit reached! Wait ${rateLimit.resetIn}s.`,
      });
    }

    const target = interaction.options.getUser('target');
    
    // Check permissions and delivery method
    const { canSend, useFollowUp, errorMessage } = canSendMessages(interaction);
    if (!canSend) {
      return interaction.editReply({
        content: errorMessage,
      });
    }
    
    // Update first message
    await interaction.editReply({
      content: '✅ Ghostping sent!',
    });
    
    // Send message with mention
    let message;
    try {
      // Use the interaction itself to send, if fails try channel
      try {
        message = await interaction.followUp({
          content: `${target}`,
          allowedMentions: { users: [target.id] }
        });
      } catch (err) {
        if (interaction.channel) {
          message = await interaction.channel.send({
            content: `${target}`,
            allowedMentions: { users: [target.id] }
          });
        } else {
          throw err;
        }
      }
      
      // Increment counter
      incrementMessageCount(interaction.user.id, 1);
      
    // Delete the message after 100ms
    setTimeout(async () => {
      try {
        if (message && message.delete) {
          await message.delete();
        } else {
          const rest = new REST().setToken(interaction.client.token);
          await rest.delete(
            Routes.webhookMessage(interaction.applicationId, interaction.token, message.id)
          );
        }
      } catch (error) {
        // Silent if already deleted or API failure (webhook expired)
      }
    }, 100);
      
    } catch (error) {
      console.error('Error sending ghostping:', error);
      await interaction.editReply({
        content: `❌ Error sending ghostping: ${error.message}\n💡 Check if the bot has permission to send messages in this channel.`
      });
    }
  },
};
