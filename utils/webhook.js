// Utilitário para enviar logs via webhook do Discord
// Usado para registrar ações sensíveis dos comandos

import axios from 'axios';
import { EmbedBuilder } from 'discord.js';

/**
 * Envia log de ação para webhook do Discord com informações detalhadas
 * @param {object} params - Parâmetros do log
 */
export async function sendWebhookLog(params) {
  const webhookUrl = process.env.WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('⚠️  WEBHOOK_URL não configurada - log não será enviado ao webhook');
    return;
  }
  
  const { command, executor, target, channel, guild, content, color = 0x5865F2 } = params;
  
  // Informações detalhadas do executor
  const executorAge = Math.floor((Date.now() - executor.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  const embed = new EmbedBuilder()
    .setTitle(`🔔 [${command.toUpperCase()}] Comando Executado`)
    .setColor(color)
    .setTimestamp()
    .addFields(
      { 
        name: '👤 Executor', 
        value: [
          `**Tag:** ${executor.tag}`,
          `**ID:** \`${executor.id}\``,
          `**Bot:** ${executor.bot ? '✅ Sim' : '❌ Não'}`,
          `**Conta criada:** ${executor.createdAt.toLocaleDateString('pt-BR')}`,
          `**Idade:** ${executorAge} dias`
        ].join('\n'),
        inline: false 
      }
    );
  
  // Thumbnail com avatar do executor
  if (executor.displayAvatarURL) {
    embed.setThumbnail(executor.displayAvatarURL({ dynamic: true, size: 256 }));
  }
  
  // Informações do servidor
  if (guild) {
    embed.addFields({
      name: '🌐 Servidor',
      value: [
        `**Nome:** ${guild.name}`,
        `**ID:** \`${guild.id}\``,
        `**Membros:** ${guild.memberCount || 'N/A'}`
      ].join('\n'),
      inline: true
    });
    
    if (guild.iconURL) {
      embed.setFooter({ 
        text: `Servidor: ${guild.name}`, 
        iconURL: guild.iconURL({ dynamic: true }) 
      });
    }
  } else {
    embed.addFields({
      name: '🌐 Servidor',
      value: '📬 DM (Mensagem Direta)',
      inline: true
    });
  }
  
  // Informações do canal
  if (channel) {
    embed.addFields({
      name: '📝 Canal',
      value: `${channel.name}\n\`${channel.id}\``,
      inline: true
    });
  }
  
  // Informações do alvo
  if (target) {
    const targetAge = Math.floor((Date.now() - target.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    embed.addFields({ 
      name: '🎯 Alvo', 
      value: [
        `**Tag:** ${target.tag}`,
        `**ID:** \`${target.id}\``,
        `**Bot:** ${target.bot ? '✅ Sim' : '❌ Não'}`,
        `**Idade:** ${targetAge} dias`
      ].join('\n'),
      inline: false 
    });
  }
  
  // Conteúdo do comando
  if (content) {
    embed.addFields({ 
      name: '💬 Conteúdo', 
      value: content.substring(0, 1024), 
      inline: false 
    });
  }
  
  try {
    await axios.post(webhookUrl, {
      embeds: [embed.toJSON()],
    });
  } catch (error) {
    console.error('❌ Erro ao enviar webhook:', error.message);
  }
}
