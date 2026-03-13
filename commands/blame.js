// Comando: /blame
// Marca um usuário com a mensagem "your raid was complete successful!"

import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { canSendMessages } from '../utils/permissions.js';
import { isWhitelisted } from '../utils/whitelist.js';

export default {
  data: new SlashCommandBuilder()
    .setName('blame')
    .setDescription('blame someone for the raid')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('target user')
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
      content: '✅ Message sent!',
    });
    
    // Send specific message (visible for everyone)
    const messageOptions = {
      content: `<@${target.id}> your raid was complete succesfull!`,
      allowedMentions: { users: [target.id] },
    };

    try {
      await interaction.followUp(messageOptions);
    } catch (error) {
      console.error('Error sending blame:', error.message);
      await interaction.editReply({
        content: `❌ Error sending message: ${error.message}\n💡 Check if the bot has permission to send messages in this channel.`,
      });
    }
  },
};
