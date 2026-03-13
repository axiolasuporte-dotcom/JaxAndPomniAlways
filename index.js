// Discord Bot - Main Entry Point
import 'dotenv/config';
import { Client, GatewayIntentBits, Partials, Collection, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { log } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
  ],
});

client.commands = new Collection();
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = await import(`file://${filePath}`);
  if ('data' in command.default && 'execute' in command.default) {
    client.commands.set(command.default.data.name, command.default);
    commands.push(command.default.data.toJSON());
    log(`✅ Command loaded: ${command.default.data.name}`, 'info');
  }
}

const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  const event = await import(`file://${filePath}`);
  if (event.default.once) {
    client.once(event.default.name, (...args) => event.default.execute(...args));
  } else {
    client.on(event.default.name, (...args) => event.default.execute(...args));
  }
  log(`📡 Event loaded: ${event.default.name}`, 'info');
}

if (DISCORD_TOKEN && CLIENT_ID) {
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
  try {
    log('🔄 Starting slash command registration...', 'info');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    log('✅ Slash commands registered successfully!', 'success');
  } catch (error) {
    log(`❌ Error registering commands: ${error.message}`, 'error');
  }
}

if (DISCORD_TOKEN) {
  client.login(DISCORD_TOKEN).catch(error => {
    log(`❌ Error logging in: ${error.message}`, 'error');
    process.exit(1);
  });
}

// Anti-crash system
process.on('unhandledRejection', error => {
  log(`❌ Unhandled promise rejection: ${error.stack || error}`, 'error');
  // Avoid crashing on interaction errors
  if (error.code === 10062 || error.code === 40060 || error.code === 50035) return;
});

process.on('uncaughtException', error => {
  log(`❌ Uncaught exception: ${error.stack || error}`, 'error');
  // Re-login instead of crashing if possible
  if (client) {
    log('🔄 Attempting to recover from error...', 'warn');
  } else {
    process.exit(1);
  }
});

process.on('warning', (warning) => {
  log(`⚠️ Warning: ${warning.name} - ${warning.message}`, 'warn');
});

export default client;
