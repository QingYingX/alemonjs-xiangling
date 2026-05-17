import type { EventKeys, Events } from 'alemonjs';
import { createStoreKey, getRedis } from '../../adapter/storage';
import { getXianglingConfig } from '../../config/xiangling';
import { getGroupRole, type GroupRole } from './permissions';

export type RecallPermissionLevel = 'all' | 'admin' | 'owner' | 'master';

export type RecallPermissionConfig = {
  bot: RecallPermissionLevel;
  member: RecallPermissionLevel;
};

const key = (): string => createStoreKey('group-recall-permission.json');

const normalizeLevel = (value: unknown, fallback: RecallPermissionLevel): RecallPermissionLevel => {
  return value === 'all' || value === 'admin' || value === 'owner' || value === 'master' ? value : fallback;
};

const getDefaultConfig = (): RecallPermissionConfig => {
  const config = getXianglingConfig().group_recall;
  return {
    bot: normalizeLevel(config.bot, 'all'),
    member: normalizeLevel(config.member, 'admin')
  };
};

const normalize = (
  value: Partial<RecallPermissionConfig> = {},
  fallback = getDefaultConfig()
): RecallPermissionConfig => ({
  bot: normalizeLevel(value.bot, fallback.bot),
  member: normalizeLevel(value.member, fallback.member)
});

export const getRecallPermissionConfig = async (): Promise<RecallPermissionConfig> => {
  const raw = await getRedis().get(key());
  if (!raw) return getDefaultConfig();
  try {
    return normalize(JSON.parse(raw) as Partial<RecallPermissionConfig>);
  } catch {
    return getDefaultConfig();
  }
};

export const setRecallPermissionConfig = async (value: Partial<RecallPermissionConfig>): Promise<RecallPermissionConfig> => {
  const config = normalize(value, await getRecallPermissionConfig());
  await getRedis().set(key(), JSON.stringify(config));
  return config;
};

const roleRank: Record<GroupRole | 'master', number> = {
  '': 0,
  member: 1,
  admin: 2,
  owner: 3,
  master: 4
};

const requiredRank: Record<RecallPermissionLevel, number> = {
  all: 0,
  admin: 2,
  owner: 3,
  master: 4
};

export const hasRecallPermission = async <T extends EventKeys>(
  event: Events[T],
  level: RecallPermissionLevel
): Promise<boolean> => {
  if (level === 'all') return true;
  if (event.IsMaster) return true;
  const role = await getGroupRole(event);
  return roleRank[role] >= requiredRank[level];
};
