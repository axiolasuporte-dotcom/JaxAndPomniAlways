import {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} from 'discord.js';
import { isOwner } from '../utils/owner.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        if (error.code === 10062) return;
        console.error(`❌ Error executing command ${interaction.commandName}: ${error.message}`);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '❌ There was an error executing this command!', flags: 64 }).catch(() => {});
        }
      }
      return;
    }

    if (interaction.isButton()) {
      // Check if button is for raid execution
      if (interaction.customId.startsWith('raid_')) {
        const { isWhitelisted } = await import('../utils/whitelist.js');
        if (!isWhitelisted(interaction.user.id)) {
          return interaction.reply({
            content: '❌ You do not have permission to use this bot.',
            flags: 64
          }).catch(() => {});
        }

        const action = interaction.customId.replace('raid_', ''); // horror, lag, text
        const quantidade = 10; 

        try {
          await interaction.deferReply({ flags: 64 }).catch(() => {});
          
          // Updated GIF links that are more reliable
          const horrorGifs = [
            'https://tenor.com/view/yapping-creepy-under-the-bed-talking-ghost-gif-10296050582380126660',
            'https://tenor.com/view/the-boy-and-the-bath-gif-12375480220549004388',
            'https://tenor.com/view/yapping-creepy-under-the-bed-talking-ghost-gif-10296050582380126660',
          ];
          const lagEmojis = '<a:Jax_Laughing:1416850943235854406> '.repeat(30).trim();

          // Use for loop with individual awaits or batch carefully to ensure delivery
          for (let i = 0; i < quantidade; i++) {
            let content = '';
            if (action === 'horror') {
              const gif = horrorGifs[Math.floor(Math.random() * horrorGifs.length)];
              content = `**[ORIONSEC](${gif})**\n**[ORIONSEC](${gif})**\n@everyone @here`;
            } else if (action === 'lag') {
              content = `@everyone @here\n${lagEmojis}`;
            } else if (action === 'text') {
              const { getRandomFloodText } = await import('../utils/text.js');
              content = getRandomFloodText('data/flood_texts') || 'ORIONSEC RAID';
            }

            if (content) {
              // Using individual sends to ensure they all go through even if rate limited
              await interaction.channel.send({
                content,
                allowedMentions: { parse: ['everyone', 'users', 'roles'] }
              }).catch(err => console.error('Send error:', err.message));
            }
          }

          return interaction.editReply({ content: `✅ RAID ${action.toUpperCase()} finalizada com sucesso (10 mensagens enviadas).` }).catch(() => {});
        } catch (err) {
          console.error('Error in raid execution:', err.message);
        }
        return;
      }

      // Handler for control panel buttons
      if (interaction.customId === 'panel_logs') {
        const { getLogs } = await import('../utils/config.js');
        const logs = getLogs();
        return interaction.reply({
          content: logs.length > 0 ? `\`\`\`\n${logs.join('\n')}\n\`\`\`` : '⚠️ No logs registered.',
          flags: 64
        });
      }

      if (interaction.customId === 'panel_edit') {
        const embed = new EmbedBuilder()
          .setTitle('⚙️ Edit Settings')
          .setDescription('Choose what you want to edit on the bot:')
          .setColor(0x0099ff);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('edit_name').setLabel('Name').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('edit_avatar').setLabel('Avatar').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('edit_status').setLabel('Status').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('edit_logs').setLabel('Logs Channel').setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
      }

      if (interaction.customId === 'panel_help') {
        const embed = new EmbedBuilder()
          .setTitle('❓ Help')
          .setDescription('Public commands:\n/test - Status\n/invite - Invite\n/blame - Blame\n/say - Say\n/gping - Ghost Ping\n!nuke - Deploy Nuke')
          .setColor(0x5865F2);
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      if (interaction.customId === 'panel_commands') {
        const embed = new EmbedBuilder()
          .setTitle('📜 Available Commands')
          .addFields(
            { name: 'Public', value: '`/test`, `/invite`, `/blame`, `/say`, `/gping`' },
            { name: 'Owner', value: '`/whitelist`, `/panel`, `/edit`, `/security`, `/config`' }
          )
          .setColor(0x5865F2);
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      if (interaction.customId === 'panel_status') {
        const embed = new EmbedBuilder()
          .setTitle('📊 Bot Status')
          .addFields(
            { name: 'Ping', value: `${interaction.client.ws.ping}ms`, inline: true },
            { name: 'Servers', value: `${interaction.client.guilds.cache.size}`, inline: true },
            { name: 'Uptime', value: `<t:${Math.floor(Date.now() / 1000 - interaction.client.uptime / 1000)}:R>`, inline: true }
          )
          .setColor(0x5865F2);
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      if (interaction.customId === 'panel_security') {
        const { loadConfig } = await import('../utils/config.js');
        const config = loadConfig();
        const embed = new EmbedBuilder()
          .setTitle('🛡️ Security')
          .setDescription('Status of protection systems:')
          .addFields(
            { name: 'Anti-Raid', value: config.security?.antiRaid?.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Anti-Spam', value: config.security?.antiSpam?.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
            { name: 'Lockdown', value: config.security?.lockdown?.active ? '🔒 Enabled' : '🔓 Disabled', inline: true },
            { name: 'Global Whitelist', value: config.globalWhitelist ? '🌍 Enabled' : '🔒 Disabled', inline: true }
          )
          .setColor(0xe74c3c);
        return interaction.reply({ embeds: [embed], flags: 64 });
      }

      if (interaction.customId === 'panel_global_whitelist') {
        if (!isOwner(interaction.user.id)) {
          return interaction.reply({ content: '❌ Only the owner can manage the Global Whitelist.', flags: 64 });
        }
        const { loadConfig, saveConfig } = await import('../utils/config.js');
        const config = loadConfig();
        const currentStatus = config.globalWhitelist === true || config.globalWhitelist === 'true';
        config.globalWhitelist = !currentStatus;
        saveConfig(config);
        
        return interaction.reply({ 
          content: `🌍 Global Whitelist is now: **${config.globalWhitelist ? 'ENABLED' : 'DISABLED'}**\n${config.globalWhitelist ? 'Everyone has access to the bot.' : 'Only whitelisted users have access.'}`, 
          flags: 64 
        });
      }

      if (interaction.customId === 'panel_blacklist_server') {
        if (!isOwner(interaction.user.id)) {
          return interaction.reply({ content: '❌ Only the owner can manage the Server Blacklist.', flags: 64 });
        }
        
        const modal = new ModalBuilder()
          .setCustomId('modal_blacklist_server')
          .setTitle('Block Server');

        const input = new TextInputBuilder()
          .setCustomId('server_id')
          .setLabel('Server ID')
          .setPlaceholder('Enter the server ID to protect')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      if (interaction.customId === 'panel_whitelist') {
        const { loadConfig } = await import('../utils/config.js');
        const config = loadConfig();
        const whitelist = config.whitelist || [];
        const embed = new EmbedBuilder()
          .setTitle('📋 Whitelist')
          .setDescription(whitelist.length > 0 ? whitelist.join('\n') : '*No users in whitelist*')
          .setColor(0x2ecc71);
        
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('access_add').setLabel('Add').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('access_remove').setLabel('Remove').setStyle(ButtonStyle.Danger)
        );

        return interaction.reply({ embeds: [embed], components: [row], flags: 64 });
      }

      if (interaction.customId === 'access_add' || interaction.customId === 'access_remove') {
        const action = interaction.customId.replace('access_', '') === 'add' ? 'allow' : 'remove';
        const modal = new ModalBuilder()
          .setCustomId(`access_modal_${action}`)
          .setTitle(action === 'allow' ? 'Add to Whitelist' : 'Remove from Whitelist');

        const input = new TextInputBuilder()
          .setCustomId('user_identifier')
          .setLabel('User ID')
          .setPlaceholder('Enter the Discord ID')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('edit_')) {
        const field = interaction.customId.replace('edit_', '');
        const modal = new ModalBuilder()
          .setCustomId(`modal_edit_${field}`)
          .setTitle(`Edit ${field.charAt(0).toUpperCase() + field.slice(1)}`);

        const input = new TextInputBuilder()
          .setCustomId(`new_${field}`)
          .setLabel(`New ${field}`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        if (field === 'logs') input.setCustomId('logs_channel_id').setLabel('Channel ID');
        if (field === 'avatar') input.setCustomId('avatar_url').setLabel('Image URL');

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        return interaction.showModal(modal);
      }

      if (interaction.customId.startsWith('access_')) {
        if (!isOwner(interaction.user.id)) {
          return interaction.reply({ content: '❌ Only the owner can manage access.', flags: 64 });
        }

        if (interaction.customId === 'access_list') {
          const { getWhitelist, getBlacklist } = await import('../utils/config.js');
          const whitelistUsers = getWhitelist();
          const blacklistUsers = getBlacklist();

          const embed = new EmbedBuilder()
            .setTitle('🔐 Access List')
            .setColor(0xf1c40f);

          if (whitelistUsers.length > 0) {
            embed.addFields({
              name: '✅ Whitelist',
              value: whitelistUsers.join('\n'),
              inline: false
            });
          } else {
            embed.addFields({
              name: '✅ Whitelist',
              value: '*Empty*',
              inline: false
            });
          }

          if (blacklistUsers.length > 0) {
            embed.addFields({
              name: '🚫 Blacklist',
              value: blacklistUsers.join('\n'),
              inline: false
            });
          } else {
            embed.addFields({
              name: '🚫 Blacklist',
              value: '*Empty*',
              inline: false
            });
          }

          return interaction.reply({ embeds: [embed], flags: 64 });
        }

        const action = interaction.customId.replace('access_', '');
        const actionLabels = {
          allow: { title: 'Allow User', label: 'Nick or User ID' },
          block: { title: 'Block User', label: 'Nick or User ID' },
          remove: { title: 'Remove User', label: 'Nick or User ID' }
        };

        const modal = new ModalBuilder()
          .setCustomId(`access_modal_${action}`)
          .setTitle(actionLabels[action].title);

        const userInput = new TextInputBuilder()
          .setCustomId('user_identifier')
          .setLabel(actionLabels[action].label)
          .setPlaceholder('Ex: username or 123456789012345678')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(userInput));
        return interaction.showModal(modal);
      }
      return;
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal_blacklist_server') {
        const serverId = interaction.fields.getTextInputValue('server_id').trim();
        const { loadConfig, saveConfig } = await import('../utils/config.js');
        const config = loadConfig();
        
        if (!config.serverBlacklist) config.serverBlacklist = [];
        
        if (!config.serverBlacklist.includes(serverId)) {
          config.serverBlacklist.push(serverId);
          saveConfig(config);
          return interaction.reply({ content: `✅ Server **${serverId}** added to protection blacklist.`, flags: 64 });
        } else {
          return interaction.reply({ content: `❌ Server **${serverId}** is already protected.`, flags: 64 });
        }
      }

      if (interaction.customId === 'modal_send_message') {
        const content = interaction.fields.getTextInputValue('message_content');
        try {
          await interaction.channel.send({
            content: content,
            allowedMentions: { parse: ['everyone', 'users', 'roles'] }
          });
          return interaction.reply({ content: '✅ Message sent successfully!', flags: 64 });
        } catch (error) {
          return interaction.reply({ content: `❌ Error sending message: ${error.message}`, flags: 64 });
        }
      }

      if (interaction.customId.startsWith('modal_edit_')) {
        if (!isOwner(interaction.user.id)) {
          return interaction.reply({ content: '❌ Only the owner can use this feature.', flags: 64 });
        }

        if (interaction.customId === 'modal_edit_name') {
          const newName = interaction.fields.getTextInputValue('new_name').trim();
          try {
            await interaction.client.user.setUsername(newName);
            return interaction.reply({ content: `✅ Name changed to **${newName}**.`, flags: 64 });
          } catch (error) {
            return interaction.reply({ content: `❌ Error changing name: ${error.message}`, flags: 64 });
          }
        }

        if (interaction.customId === 'modal_edit_avatar') {
          const avatarUrl = interaction.fields.getTextInputValue('avatar_url').trim();
          try {
            await interaction.client.user.setAvatar(avatarUrl);
            return interaction.reply({ content: '✅ Avatar changed successfully.', flags: 64 });
          } catch (error) {
            return interaction.reply({ content: `❌ Error changing avatar: ${error.message}`, flags: 64 });
          }
        }

        if (interaction.customId === 'modal_edit_status') {
          const newStatus = interaction.fields.getTextInputValue('new_status').trim();
          try {
            await interaction.client.user.setActivity(newStatus, { type: 0 });
            return interaction.reply({ content: `✅ Status changed to: **${newStatus}**`, flags: 64 });
          } catch (error) {
            return interaction.reply({ content: `❌ Error changing status: ${error.message}`, flags: 64 });
          }
        }

        if (interaction.customId === 'modal_edit_logs') {
          const channelId = interaction.fields.getTextInputValue('logs_channel_id').trim();
          try {
            const { updateConfig } = await import('../utils/config.js');
            updateConfig('logsChannelId', channelId);
            return interaction.reply({ content: `✅ Logs channel configured to: <#${channelId}>`, flags: 64 });
          } catch (error) {
            return interaction.reply({ content: `❌ Error: ${error.message}`, flags: 64 });
          }
        }
      }

      if (interaction.customId.startsWith('access_modal_')) {
        const action = interaction.customId.replace('access_modal_', '');
        const userIdentifier = interaction.fields.getTextInputValue('user_identifier').trim();
        
        const { loadConfig, saveConfig } = await import('../utils/config.js');
        const config = loadConfig();
        
        let message = '';
        let success = false;
        const cleanId = userIdentifier;

        if (action === 'allow' || action === 'add') {
          if (!config.whitelist.includes(cleanId)) {
            config.whitelist.push(cleanId);
            saveConfig(config);
            message = `User **${cleanId}** added to whitelist.`;
            success = true;
          } else {
            message = `User **${cleanId}** is already in the whitelist.`;
          }
        } else if (action === 'remove') {
          if (config.whitelist.includes(cleanId)) {
            config.whitelist = config.whitelist.filter(id => id !== cleanId);
            saveConfig(config);
            message = `User **${cleanId}** removed from whitelist.`;
            success = true;
          } else {
            message = `User **${cleanId}** is not in the whitelist.`;
          }
        } else if (action === 'block') {
          if (!config.blacklist.includes(cleanId)) {
            config.blacklist.push(cleanId);
            saveConfig(config);
            message = `User **${cleanId}** added to blacklist.`;
            success = true;
          } else {
            message = `User **${cleanId}** is already in the blacklist.`;
          }
        }

        try {
          return await interaction.reply({
            content: success ? `✅ ${message}` : `❌ ${message}`,
            flags: 64
          });
        } catch (e) {
          if (e.code === 10062) return;
          console.error('Error responding to modal:', e);
        }
      }
    }
  }
};