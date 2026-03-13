// Evento: Bot Ready
// Disparado quando o bot está online e pronto para uso

import { Events, ActivityType } from 'discord.js';
import { log } from '../utils/logger.js';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    log(`✅ Bot online as ${client.user.tag}!`, 'success');
    log(`📊 Connected to ${client.guilds.cache.size} server(s)`, 'info');
    
    // Configurar status do bot
    client.user.setPresence({
      activities: [{ 
        name: '/help for commands', 
        type: ActivityType.Watching 
      }],
      status: 'online',
    });
    
    log('🎮 Status configured successfully', 'success');
    log('🚀 Bot ready for use!', 'success');
  },
};
