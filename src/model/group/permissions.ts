import { getConfigValue, logger, type EventKeys, type Events } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberInfo } from '../../adapter/onebot';
import { getEventGroupId, toSafeInteger } from './admin';

export type GroupRole = 'owner' | 'admin' | 'member' | '';

const normalizeRole = (value: unknown): GroupRole => {
  const role = String(value ?? '').trim().toLowerCase();
  if (role === 'owner' || role === 'admin' || role === 'member') return role;
  return '';
};

const getEventSenderRole = <T extends EventKeys>(event: Events[T]): GroupRole => {
  const value = event.value as { sender?: { role?: unknown }; member?: { role?: unknown }; role?: unknown } | undefined;
  return normalizeRole(value?.sender?.role) || normalizeRole(value?.member?.role) || normalizeRole(value?.role);
};

export const getGroupRole = async <T extends EventKeys>(event: Events[T]): Promise<GroupRole> => {
  const senderRole = getEventSenderRole(event);
  if (senderRole) return senderRole;

  const groupId = getEventGroupId(event);
  const userId = toSafeInteger(event.UserId);
  if (!groupId || !userId) return '';

  return getGroupMemberRole(event, groupId, userId);
};

export const getGroupMemberRole = async <T extends EventKeys>(event: Events[T], groupId: number, userId: number): Promise<GroupRole> => {
  try {
    const [client] = useClient(event);
    const member = normalizeGroupMemberInfo(await client.getGroupMemberInfo({ group_id: groupId, user_id: userId, no_cache: false }));
    return normalizeRole(member?.role);
  } catch (error) {
    logger.warn(`xiangling get group role failed: ${error instanceof Error ? error.message : String(error)}`);
    return '';
  }
};

export const getBotGroupRole = async <T extends EventKeys>(event: Events[T], groupId: number): Promise<GroupRole> => {
  const botId = toSafeInteger(event.BotId);
  if (!botId) return '';
  return getGroupMemberRole(event, groupId, botId);
};

export const hasBotGroupAdminPermission = async <T extends EventKeys>(event: Events[T], groupId: number): Promise<boolean> => {
  const role = await getBotGroupRole(event, groupId);
  return role === '' || role === 'owner' || role === 'admin';
};

export const hasBotGroupOwnerPermission = async <T extends EventKeys>(event: Events[T], groupId: number): Promise<boolean> => {
  const role = await getBotGroupRole(event, groupId);
  return role === '' || role === 'owner';
};

export const hasGroupAdminPermission = async <T extends EventKeys>(event: Events[T]): Promise<boolean> => {
  if (event.IsMaster) return true;
  const role = await getGroupRole(event);
  return role === 'owner' || role === 'admin';
};

export const hasGroupOwnerPermission = async <T extends EventKeys>(event: Events[T]): Promise<boolean> => {
  if (event.IsMaster) return true;
  return await getGroupRole(event) === 'owner';
};

export const isAdminRole = (role: GroupRole): boolean => role === 'owner' || role === 'admin';

export const isMasterUser = <T extends EventKeys>(event: Events[T], userId: unknown): boolean => {
  if (String(event.UserId || '') === String(userId || '') && event.IsMaster) return true;
  const config = getConfigValue<Record<string, unknown>>() || {};
  const onebot = config.onebot && typeof config.onebot === 'object' && !Array.isArray(config.onebot)
    ? config.onebot as Record<string, unknown>
    : {};
  const masterIds = Array.isArray(onebot.master_id) ? onebot.master_id : [];
  return masterIds.map(String).includes(String(userId || ''));
};
