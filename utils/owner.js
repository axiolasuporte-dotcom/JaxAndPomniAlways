import { isOwner as isOwnerFromConfig, getOwnerId as getOwnerIdFromConfig } from './config.js';

export function isOwner(userId) {
  return isOwnerFromConfig(userId);
}

export function getOwnerId() {
  return getOwnerIdFromConfig();
}
