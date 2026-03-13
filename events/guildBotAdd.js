// Evento: Guild Bot Add (via guildMemberAdd)
// Detecta bots maliciosos sendo adicionados ao servidor

import { Events, EmbedBuilder, AuditLogEvent } from 'discord.js';
import { 
  loadConfig, 
  addSecurityLog 
} from '../utils/config.js';
import { getOwnerId } from '../utils/owner.js';
import { log } from '../utils/logger.js';

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    // Verificar se é um bot
    if (!member.user.bot) return;

    const config = loadConfig();
    const security = config.security;

    // Se proteção de bot não está ativada, ignorar
    if (!security?.botProtection?.enabled) return;

    const guild = member.guild;
    
    try {
      // Aguardar um pouco para o audit log ser atualizado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Buscar quem adicionou o bot
      const auditLogs = await guild.fetchAuditLogs({
        type: AuditLogEvent.BotAdd,
        limit: 1
      });

      const botAddLog = auditLogs.entries.first();
      
      if (!botAddLog) return;

      const { executor, target } = botAddLog;
      
      // Verificar se é o mesmo bot
      if (target.id !== member.user.id) return;

      // Log de segurança
      addSecurityLog({
        type: 'BOT_ADDED',
        guildId: guild.id,
        guildName: guild.name,
        botId: member.user.id,
        botName: member.user.tag,
        addedBy: executor.id,
        addedByName: executor.tag
      });

      log(`🤖 Bot "${member.user.tag}" added by "${executor.tag}" in "${guild.name}"`, 'info');

      // Notify owner
      try {
        const ownerId = getOwnerId();
        const owner = await member.client.users.fetch(ownerId);

        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('🤖 New Bot Added')
          .setDescription(`A new bot has been added to the server.`)
          .addFields(
            { name: 'Bot', value: `${member.user.tag} (\`${member.user.id}\`)`, inline: true },
            { name: 'Added by', value: `${executor.tag} (\`${executor.id}\`)`, inline: true },
            { name: 'Server', value: guild.name, inline: false }
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        await owner.send({ embeds: [embed] });
      } catch (error) {
        log(`Error notifying owner about new bot: ${error.message}`, 'error');
      }

    } catch (error) {
      log(`Erro ao verificar bot adicionado: ${error.message}`, 'error');
    }
  }
};
