// Evento: Guild Member Add
// Detecta raids (múltiplos membros entrando rapidamente) e envia logs detalhadas

import { Events, EmbedBuilder } from 'discord.js';
import { loadConfig } from '../utils/config.js';
import { log } from '../utils/logger.js';

// Armazenar membros recentes por servidor
const recentJoins = new Map();

export default {
  name: Events.GuildMemberAdd,
  async execute(member) {
    const config = loadConfig();
    
    // Verificar se detecção de raids está ativada
    if (!config.raidDetection?.enabled) {
      return;
    }

    const guildId = member.guild.id;
    const now = Date.now();
    
    // Inicializar array de entradas recentes se não existir
    if (!recentJoins.has(guildId)) {
      recentJoins.set(guildId, []);
    }
    
    const joins = recentJoins.get(guildId);
    
    // Remover entradas antigas (fora da janela de tempo)
    const timeWindow = (config.raidDetection.timeWindow || 10) * 1000; // converter para ms
    const validJoins = joins.filter(timestamp => now - timestamp < timeWindow);
    
    // Adicionar entrada atual
    validJoins.push(now);
    recentJoins.set(guildId, validJoins);
    
    // Verificar se atingiu o limite mínimo para ser considerado raid
    const minMembers = config.raidDetection.minMembers || 5;
    const isRaid = validJoins.length >= minMembers;
    
    // Se detectou raid e deve enviar logs
    if (isRaid && config.raidDetection.sendLogs && config.logsChannelId) {
      try {
        const channel = await member.client.channels.fetch(config.logsChannelId);
        
        // Informações detalhadas do usuário
        const userInfo = config.raidDetection.includeUserInfo !== false ? {
          id: member.user.id,
          tag: member.user.tag,
          username: member.user.username,
          discriminator: member.user.discriminator,
          bot: member.user.bot,
          avatar: member.user.displayAvatarURL({ dynamic: true, size: 256 }),
          accountCreated: member.user.createdAt,
          accountAge: Math.floor((now - member.user.createdAt.getTime()) / (1000 * 60 * 60 * 24)), // dias
        } : null;
        
        // Informações do servidor
        const serverInfo = config.raidDetection.includeServerInfo !== false ? {
          name: member.guild.name,
          id: member.guild.id,
          memberCount: member.guild.memberCount,
          icon: member.guild.iconURL({ dynamic: true, size: 256 }),
        } : null;
        
        // Criar embed com as informações
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🚨 RAID DETECTED!')
          .setDescription(`**${validJoins.length} members** joined in the last **${config.raidDetection.timeWindow || 10} seconds**!`)
          .setTimestamp();
        
        // Adicionar informações do usuário mais recente
        if (userInfo) {
          embed.addFields(
            { 
              name: '👤 Most Recent User', 
              value: [
                `**Tag:** ${userInfo.tag}`,
                `**ID:** \`${userInfo.id}\``,
                `**Bot:** ${userInfo.bot ? '✅ Yes' : '❌ No'}`,
                `**Account created:** ${userInfo.accountCreated.toLocaleDateString('en-US')}`,
                `**Account age:** ${userInfo.accountAge} days`
              ].join('\n'),
              inline: false 
            }
          );
          
          // Adicionar avatar do usuário
          if (userInfo.avatar) {
            embed.setThumbnail(userInfo.avatar);
          }
        }
        
        // Adicionar informações do servidor
        if (serverInfo) {
          embed.addFields(
            { 
              name: '🌐 Server', 
              value: [
                `**Name:** ${serverInfo.name}`,
                `**ID:** \`${serverInfo.id}\``,
                `**Total Members:** ${serverInfo.memberCount}`
              ].join('\n'),
              inline: false 
            }
          );
          
          // Adicionar ícone do servidor
          if (serverInfo.icon) {
            embed.setFooter({ 
              text: `Server: ${serverInfo.name}`, 
              iconURL: serverInfo.icon 
            });
          }
        }
        
        // Adicionar estatísticas do raid
        embed.addFields(
          { 
            name: '📊 Raid Statistics', 
            value: [
              `**Members detected:** ${validJoins.length}`,
              `**Time window:** ${config.raidDetection.timeWindow || 10}s`,
              `**Threshold:** ${minMembers} members`
            ].join('\n'),
            inline: false 
          }
        );
        
        // Enviar embed no canal de logs
        await channel.send({ 
          content: '⚠️ **RAID ALERT** ⚠️',
          embeds: [embed] 
        });
        
        // Log no console
        log(`🚨 RAID detected in ${member.guild.name}: ${validJoins.length} members in ${config.raidDetection.timeWindow || 10}s`, 'warn');
        
      } catch (error) {
        log(`❌ Erro ao enviar log de raid: ${error.message}`, 'error');
      }
    }
    
    // Limpar dados antigos periodicamente (a cada 100 entradas)
    if (Math.random() < 0.01) {
      for (const [guildId, joins] of recentJoins.entries()) {
        const validJoins = joins.filter(timestamp => now - timestamp < timeWindow);
        if (validJoins.length === 0) {
          recentJoins.delete(guildId);
        } else {
          recentJoins.set(guildId, validJoins);
        }
      }
    }
  },
};
