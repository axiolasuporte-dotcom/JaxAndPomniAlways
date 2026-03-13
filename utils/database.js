import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, and, gt } from 'drizzle-orm';
import * as schema from '../shared/schema.js';

// Conexão com database é opcional
let db = null;
if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  db = drizzle(sql, { schema });
}

export { db };

// Guild Config functions
export async function getGuildConfig(guildId) {
  const configs = await db.select().from(schema.guildConfigs).where(eq(schema.guildConfigs.guildId, guildId));
  return configs[0] || null;
}

export async function createGuildConfig(guildId, guildName) {
  const result = await db.insert(schema.guildConfigs).values({
    guildId,
    guildName,
  }).returning();
  return result[0];
}

export async function updateGuildConfig(guildId, updates) {
  const result = await db.update(schema.guildConfigs)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(schema.guildConfigs.guildId, guildId))
    .returning();
  return result[0];
}

export async function getOrCreateGuildConfig(guildId, guildName) {
  // Se não há database, retorna null
  if (!db) return null;
  
  let config = await getGuildConfig(guildId);
  if (!config) {
    config = await createGuildConfig(guildId, guildName);
  }
  return config;
}

// Action Log functions
export async function logAction(actionData) {
  // Se não há database, não faz nada
  if (!db) return null;
  
  const result = await db.insert(schema.actionLogs).values(actionData).returning();
  return result[0];
}

export async function getActionLogs(guildId, limit = 100) {
  return await db.select()
    .from(schema.actionLogs)
    .where(eq(schema.actionLogs.guildId, guildId))
    .orderBy(schema.actionLogs.timestamp)
    .limit(limit);
}

export async function getAllActionLogs(limit = 500) {
  return await db.select()
    .from(schema.actionLogs)
    .orderBy(schema.actionLogs.timestamp)
    .limit(limit);
}

// Cooldown functions
export async function checkCooldown(userId, guildId, commandName) {
  // Se não há database, não há cooldown
  if (!db) return null;
  
  const now = new Date();
  const cooldowns = await db.select()
    .from(schema.cooldowns)
    .where(
      and(
        eq(schema.cooldowns.userId, userId),
        eq(schema.cooldowns.guildId, guildId),
        eq(schema.cooldowns.commandName, commandName),
        gt(schema.cooldowns.expiresAt, now)
      )
    );
  
  return cooldowns[0] || null;
}

export async function setCooldown(userId, guildId, commandName, durationSeconds) {
  // Se não há database, não faz nada
  if (!db) return null;
  
  const expiresAt = new Date(Date.now() + durationSeconds * 1000);
  
  const result = await db.insert(schema.cooldowns).values({
    userId,
    guildId,
    commandName,
    expiresAt,
  }).returning();
  
  return result[0];
}

export async function clearExpiredCooldowns() {
  const now = new Date();
  await db.delete(schema.cooldowns).where(gt(now, schema.cooldowns.expiresAt));
}

// Moderation Action functions
export async function logModerationAction(actionData) {
  const result = await db.insert(schema.moderationActions).values(actionData).returning();
  return result[0];
}

export async function getActiveMutes(guildId) {
  const now = new Date();
  return await db.select()
    .from(schema.moderationActions)
    .where(
      and(
        eq(schema.moderationActions.guildId, guildId),
        eq(schema.moderationActions.actionType, 'mute'),
        eq(schema.moderationActions.active, true),
        gt(schema.moderationActions.expiresAt, now)
      )
    );
}

export async function deactivateModerationAction(id) {
  const result = await db.update(schema.moderationActions)
    .set({ active: false })
    .where(eq(schema.moderationActions.id, id))
    .returning();
  return result[0];
}

export async function getModerationHistory(guildId, limit = 100) {
  return await db.select()
    .from(schema.moderationActions)
    .where(eq(schema.moderationActions.guildId, guildId))
    .orderBy(schema.moderationActions.createdAt)
    .limit(limit);
}

// Permission check functions
export async function hasPermission(member, commandName) {
  // Se não há database, permite por padrão
  if (!db) return true;
  
  const config = await getGuildConfig(member.guild.id);
  
  if (!config) {
    return true; // Se não há configuração, permite por padrão
  }
  
  let allowedRoles = [];
  
  switch (commandName) {
    case 'spam':
      allowedRoles = config.allowedRolesSpam || [];
      break;
    case 'gore':
      allowedRoles = config.allowedRolesGore || [];
      break;
    case 'gping':
      allowedRoles = config.allowedRolesGping || [];
      break;
    case 'kick':
    case 'ban':
    case 'mute':
      allowedRoles = config.allowedRolesMod || [];
      break;
    default:
      return true;
  }
  
  // Se não há roles configuradas, permite todos
  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }
  
  // Verifica se o usuário tem alguma das roles permitidas
  const memberRoles = member.roles.cache.map(role => role.id);
  return allowedRoles.some(roleId => memberRoles.includes(roleId));
}
