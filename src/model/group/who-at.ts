import { createStoreKey, getRedis } from '../../adapter/storage';
import type { OneBotGroupMemberInfo } from '../../adapter/onebot';

export type WhoAtRecord = {
  userId: string;
  senderName: string;
  message: string;
  messageId?: string;
  time: number;
};

const maxRecords = 30;
const ttlSeconds = 24 * 60 * 60;

const key = (groupId: string | number, userId: string | number): string => createStoreKey('group-who-at', String(groupId), `${userId}.json`);
const groupPattern = (groupId?: string | number): string => createStoreKey('group-who-at', groupId ? String(groupId) : '*', '*.json');

const toText = (value: unknown): string => String(value ?? '').trim();

export const extractAtUserIds = (rawMessage: unknown): string[] => {
  if (!Array.isArray(rawMessage)) return [];
  const ids = rawMessage
    .filter(item => item && typeof item === 'object' && (item as { type?: string }).type === 'at')
    .map(item => toText((item as { data?: { qq?: unknown }; qq?: unknown }).data?.qq ?? (item as { qq?: unknown }).qq))
    .filter(item => item && item !== 'all');
  return [...new Set(ids)];
};

export const extractRawMessageText = (rawMessage: unknown): string => {
  if (!Array.isArray(rawMessage)) return '';
  return rawMessage
    .filter(item => item && typeof item === 'object' && (item as { type?: string }).type !== 'at')
    .map(item => {
      const seg = item as { type?: string; data?: Record<string, unknown>; text?: unknown; id?: unknown };
      if (seg.type === 'text') return toText(seg.data?.text ?? seg.text);
      if (seg.type === 'image') return '[图片]';
      if (seg.type === 'face') return `[表情${toText(seg.data?.id ?? seg.id)}]`;
      if (seg.type === 'record') return '[语音]';
      if (seg.type === 'video') return '[视频]';
      return '';
    })
    .join('')
    .trim();
};

export const recordWhoAt = async (groupId: string | number, targetUserId: string | number, record: WhoAtRecord): Promise<void> => {
  const redis = getRedis();
  const redisKey = key(groupId, targetUserId);
  const raw = await redis.get(redisKey);
  let list: WhoAtRecord[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as WhoAtRecord[];
      list = Array.isArray(parsed) ? parsed : [];
    } catch {
      list = [];
    }
  }
  list.unshift(record);
  await redis.set(redisKey, JSON.stringify(list.slice(0, maxRecords)), 'EX', ttlSeconds);
};

export const listWhoAt = async (groupId: string | number, userId: string | number): Promise<WhoAtRecord[]> => {
  const raw = await getRedis().get(key(groupId, userId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as WhoAtRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const clearWhoAt = async (groupId: string | number, userId: string | number): Promise<boolean> => {
  return (await getRedis().del(key(groupId, userId))) > 0;
};

export const clearAllWhoAt = async (groupId?: string | number): Promise<number> => {
  const redis = getRedis();
  const keys = await redis.keys(groupPattern(groupId));
  if (!keys.length) return 0;
  return redis.del(...keys);
};

export const formatWhoAtRecords = (records: WhoAtRecord[], targetUserId: string | number, member?: OneBotGroupMemberInfo | null): string => {
  const targetName = member?.card || member?.nickname || String(targetUserId);
  if (!records.length) return `目前还没有人艾特过 ${targetName}。`;
  return [
    `最近艾特 ${targetName}(${targetUserId}) 的记录：`,
    ...records.slice(0, 20).map((record, index) => {
      const time = new Date(record.time * 1000).toLocaleString('zh-CN', { hour12: false });
      const text = record.message || '[仅@]';
      return `${index + 1}. ${record.senderName}(${record.userId}) ${time}\n${text}`;
    })
  ].join('\n');
};
