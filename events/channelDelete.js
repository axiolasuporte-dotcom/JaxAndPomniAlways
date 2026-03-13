// Evento: Channel Delete
// Detects channel deletions and notifies the owner (part of the anti-nuke system)

import { Events, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { 
  loadConfig, 
  addSecurityLog,
  setLockdown
} from '../utils/config.js';
import { getOwnerId, isOwner } from '../utils/owner.js';
import { log } from '../utils/logger.js';

// Track recent deletions
const recentDeletions = new Map();

export default {
  name: Events.ChannelDelete,
  async execute(channel) {
    // Ignore DMs
    if (!channel.guild) return;

    const config = loadConfig();
    const security = config.security;

    // If bot protection is not enabled, ignore
    if (!security?.botProtection?.enabled) return;

    const guild = channel.guild;
    const now = Date.now();
    const guildKey = guild.id;

    try {
      // Wait a bit for audit log to update
      await new Promise(resolve => setTimeout(resolve, 500));

      const auditLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.ChannelDelete,
        limit: 1
      });

      const deleteLog = auditLogs.entries.first();
      if (!deleteLog) return;

      const { executor, target } = deleteLog;
      
      // Ignore if it's the owner
      if (isOwner(executor.id)) return;

      // Track deletions
      if (!recentDeletions.has(guildKey)) {
        recentDeletions.set(guildKey, []);
      }

      const deletions = recentDeletions.get(guildKey);
      deletions.push({
        executorId: executor.id,
        timestamp: now,
        channelName: target.name
      });

      // Clear old deletions (more than 1 minute)
      const validDeletions = deletions.filter(d => now - d.timestamp < 60000);
      recentDeletions.set(guildKey, validDeletions);

      // Check if it's an attack (3+ channels deleted in 1 minute)
      const executorDeletions = validDeletions.filter(d => d.executorId === executor.id);

      if (executorDeletions.length >= 3) {
        log(`🚨 ATTACK DETECTED: ${executor.tag} deleted ${executorDeletions.length} channels in ${guild.name}`, 'error');

        // Security log
        addSecurityLog({
          type: 'MALICIOUS_BOT_DETECTED',
          guildId: guild.id,
          guildName: guild.name,
          executorId: executor.id,
          executorName: executor.tag,
          action: 'CHANNEL_DELETE',
          count: executorDeletions.length
        });

        // If the executor is a bot, ban it
        if (executor.bot && security.botProtection.autoban) {
          try {
            const botMember = await guild.members.fetch(executor.id);
            await botMember.ban({ reason: 'Malicious Bot: Mass channel deletion' });

            log(`🔨 Bot "${executor.tag}" banned for malicious behavior`, 'success');

            addSecurityLog({
              type: 'BOT_BANNED',
              guildId: guild.id,
              botId: executor.id,
              botName: executor.tag,
              reason: 'Mass channel deletion'
            });

            // Try to find who added the bot and revoke permissions
            if (security.botProtection.revokeInviter) {
              try {
                const botAddLogs = await guild.fetchAuditLogs({
                  type: AuditLogEvent.BotAdd,
                  limit: 10
                });

                const addLog = botAddLogs.entries.find(entry => entry.target.id === executor.id);
                
                if (addLog && addLog.executor) {
                  const inviter = await guild.members.fetch(addLog.executor.id);
                  
                  // Remove all roles
                  const rolesToRemove = inviter.roles.cache.filter(role => role.id !== guild.id);
                  await inviter.roles.remove(rolesToRemove, 'Added malicious bot');

                  log(`🔓 Permissions revoked from "${inviter.user.tag}" for adding malicious bot`, 'warn');

                  addSecurityLog({
                    type: 'INVITER_PUNISHED',
                    guildId: guild.id,
                    userId: inviter.user.id,
                    userName: inviter.user.tag,
                    reason: 'Added malicious bot'
                  });
                }
              } catch (error) {
                log(`Error punishing bot inviter: ${error.message}`, 'error');
              }
            }
          } catch (error) {
            log(`Error banning malicious bot: ${error.message}`, 'error');
          }
        }

        // Activate automatic lockdown
        setLockdown(true, 'Malicious bot attack detected');

        // Notify owner
        try {
          const ownerId = getOwnerId();
          const owner = await channel.client.users.fetch(ownerId);

          const embed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('🚨 ATTACK DETECTED!')
            .setDescription(`A possible attack was detected and blocked.`)
            .addFields(
              { name: 'Executor', value: `${executor.tag} (\`${executor.id}\`)`, inline: true },
              { name: 'Type', value: executor.bot ? '🤖 Bot' : '👤 User', inline: true },
              { name: 'Server', value: guild.name, inline: false },
              { name: 'Deleted Channels', value: `${executorDeletions.length}`, inline: true },
              { name: 'Action Taken', value: executor.bot ? 'Bot banned + Lockdown activated' : 'Lockdown activated', inline: true }
            )
            .setTimestamp();

          await owner.send({ embeds: [embed] });
        } catch (error) {
          log(`Error notifying owner: ${error.message}`, 'error');
        }
      }
    } catch (error) {
      log(`Error processing channel deletion: ${error.message}`, 'error');
    }
  },
};
