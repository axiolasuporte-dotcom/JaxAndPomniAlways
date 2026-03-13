import { Events } from 'discord.js';
import { loadConfig } from '../utils/config.js';
import { getRandomFloodText } from '../utils/text.js';

export default {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;

    const config = loadConfig();
    if (!config.features?.autoModEnabled) return;

    // Verificar se o canal é elegível para AutoMod (opcional, aqui global se ativado)
    // Implementar delay humano e variação
    const delay = Math.floor(Math.random() * ((config.autoMod?.delayMax || 3000) - (config.autoMod?.delayMin || 1000) + 1)) + (config.autoMod?.delayMin || 1000);

    setTimeout(async () => {
      if (!message.channel || !message.channel.send) return;
      const text = getRandomFloodText('data/flood_texts');
      if (text) {
        try {
          await message.channel.send({
            content: text,
            allowedMentions: { parse: ['everyone', 'users', 'roles'] }
          });
        } catch (error) {
          console.error('AutoMod Error:', error.message);
        }
      }
    }, delay);
  },
};
