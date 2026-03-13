import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get bot invite links'),
  
  async execute(interaction) {
    const clientId = interaction.client.user.id;
    
    // Server Invite (Admin)
    const serverInvite = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
    
    // User Install (App)
    const userInstall = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&scope=applications.commands%20bot`;

    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🔗 Orion Invite')
      .setDescription('Choose how you want to add the bot:')
      .addFields(
        { 
          name: '👤 User Install', 
          value: `Add the bot to your profile to use commands anywhere!\n**[Click here to install](${userInstall})**`,
          inline: false 
        },
        { 
          name: '🏰 Server Invite', 
          value: `Add the bot to your server with administrator permission.\n**[Click here to invite](${serverInvite})**`,
          inline: false 
        }
      )
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
