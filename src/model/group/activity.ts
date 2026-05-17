import type { OneBotGroupMemberInfo } from '../../adapter/onebot';
import { createStoreKey, getRedis } from '../../adapter/storage';

export type ActivityUnit = '分钟' | '小时' | '天' | '月';

export type PendingActivityCleanup = {
  groupId: number;
  operatorId: number;
  label: string;
  userIds: number[];
  createdAt: number;
  expireAt: number;
};

const unitSeconds: Record<ActivityUnit, number> = {
  分钟: 60,
  小时: 3600,
  天: 86400,
  月: 2592000
};

export const parseActivityDuration = (text: string): { count: number; unit: ActivityUnit } | null => {
  const match = text.match(/([0-9]+|[零〇一二两三四五六七八九十百千万]+)\s*(分钟|小时|天|月)/);
  if (!match) return null;
  const count = parsePositiveInteger(match[1]);
  const unit = match[2] as ActivityUnit;
  return count ? { count, unit } : null;
};

export const parseTrailingNumber = (text: string, fallback = 10): number => {
  const match = text.match(/([0-9]+|[零〇一二两三四五六七八九十百千万]+)\s*$/);
  const num = parsePositiveInteger(match?.[1]);
  return num ? Math.min(num, 100) : fallback;
};

const chineseDigits: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9
};

const parseChineseInteger = (text: string): number | null => {
  let section = 0;
  let number = 0;
  let result = 0;
  const units: Record<string, number> = { 十: 10, 百: 100, 千: 1000 };

  for (const char of text) {
    if (chineseDigits[char] !== undefined) {
      number = chineseDigits[char];
      continue;
    }
    if (char === '万') {
      section = (section + number) * 10000;
      result += section;
      section = 0;
      number = 0;
      continue;
    }
    const unit = units[char];
    if (!unit) return null;
    section += (number || 1) * unit;
    number = 0;
  }

  return result + section + number;
};

const parsePositiveInteger = (value: unknown): number | null => {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) {
    const num = Number(text);
    return Number.isSafeInteger(num) && num > 0 ? num : null;
  }
  const num = parseChineseInteger(text);
  return num && Number.isSafeInteger(num) && num > 0 ? num : null;
};

const cleanupKey = (groupId: number, operatorId: number): string => createStoreKey('group', String(groupId), 'activity-cleanup', `${operatorId}.json`);

export const savePendingCleanup = async (state: Omit<PendingActivityCleanup, 'createdAt' | 'expireAt'>, ttlSeconds = 120): Promise<PendingActivityCleanup> => {
  const now = Date.now();
  const data: PendingActivityCleanup = {
    ...state,
    createdAt: now,
    expireAt: now + ttlSeconds * 1000
  };
  await getRedis().set(cleanupKey(state.groupId, state.operatorId), JSON.stringify(data), 'EX', ttlSeconds);
  return data;
};

export const takePendingCleanup = async (groupId: number, operatorId: number): Promise<PendingActivityCleanup | null> => {
  const key = cleanupKey(groupId, operatorId);
  const raw = await getRedis().get(key);
  await getRedis().del(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingActivityCleanup;
    if (!Array.isArray(parsed.userIds) || parsed.expireAt < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
};

export const cancelPendingCleanup = async (groupId: number, operatorId: number): Promise<boolean> => {
  return Boolean(await getRedis().del(cleanupKey(groupId, operatorId)));
};

const hasUserId = (member: OneBotGroupMemberInfo): boolean => Number.isSafeInteger(Number(member.user_id)) && Number(member.user_id) > 0;

const isNormalMember = (member: OneBotGroupMemberInfo): boolean => hasUserId(member) && member.role !== 'admin' && member.role !== 'owner';

const formatTime = (seconds?: number): string => {
  if (!seconds) return 'OneBot未返回';
  return new Date(seconds * 1000).toLocaleString('zh-CN', { hour12: false });
};

const displayName = (member: OneBotGroupMemberInfo): string => member.card || member.nickname || String(member.user_id);

export const applyLocalActivity = (members: OneBotGroupMemberInfo[], activity: Map<string, number>): OneBotGroupMemberInfo[] => {
  if (!activity.size) return members;
  return members.map(member => {
    const localTime = activity.get(String(member.user_id));
    if (!localTime) return member;
    const protocolTime = Number(member.last_sent_time || 0);
    if (protocolTime >= localTime) return member;
    return { ...member, last_sent_time: localTime };
  });
};

export const getInactiveMembers = (members: OneBotGroupMemberInfo[], count: number, unit: ActivityUnit, nowSeconds = Math.floor(Date.now() / 1000)): OneBotGroupMemberInfo[] => {
  const threshold = nowSeconds - count * unitSeconds[unit];
  return members
    .filter(member => isNormalMember(member) && Number(member.last_sent_time || 0) > 0 && Number(member.last_sent_time || 0) < threshold)
    .sort((a, b) => Number(a.last_sent_time || 0) - Number(b.last_sent_time || 0));
};

export const getNeverSpeakMembers = (members: OneBotGroupMemberInfo[]): OneBotGroupMemberInfo[] => {
  return members
    .filter(member => isNormalMember(member) && Number(member.join_time || 0) > 0 && Number(member.join_time || 0) === Number(member.last_sent_time || 0))
    .sort((a, b) => Number(a.join_time || 0) - Number(b.join_time || 0));
};

export const formatInactiveMembers = (members: OneBotGroupMemberInfo[], count: number, unit: ActivityUnit, page = 1): string => {
  if (!members.length) return `暂时没有${count}${unit}没发言的人。`;
  const pageSize = 30;
  const pages = Math.max(1, Math.ceil(members.length / pageSize));
  const current = Math.min(Math.max(page, 1), pages);
  const items = members.slice((current - 1) * pageSize, current * pageSize);
  return [
    `以下为${count}${unit}没发言的人`,
    `第${current}/${pages}页，本页${items.length}人，总共${members.length}人`,
    ...items.map((member, index) => `${(current - 1) * pageSize + index + 1}. ${displayName(member)}(${member.user_id}) 最后发言：${formatTime(member.last_sent_time)}`)
  ].join('\n');
};

export const formatNeverSpeakMembers = (members: OneBotGroupMemberInfo[], page = 1): string => {
  if (!members.length) return '本群暂无从未发言的人。';
  const pageSize = 30;
  const pages = Math.max(1, Math.ceil(members.length / pageSize));
  const current = Math.min(Math.max(page, 1), pages);
  const items = members.slice((current - 1) * pageSize, current * pageSize);
  return [
    '以下为进群后从未发言过的人',
    `第${current}/${pages}页，本页${items.length}人，总共${members.length}人`,
    ...items.map((member, index) => `${(current - 1) * pageSize + index + 1}. ${displayName(member)}(${member.user_id}) 进群时间：${formatTime(member.join_time)}`)
  ].join('\n');
};

export const formatInactiveRank = (members: OneBotGroupMemberInfo[], limit: number): string => {
  const list = [...members].filter(isNormalMember).sort((a, b) => Number(a.last_sent_time || 0) - Number(b.last_sent_time || 0)).slice(0, limit);
  if (!list.length) return '暂无不活跃成员数据。';
  return [`不活跃排行榜 top1 - top${list.length}`, ...list.map((member, index) => `${index + 1}. ${displayName(member)}(${member.user_id}) 最后发言：${formatTime(member.last_sent_time)}`)].join('\n');
};

export const formatRecentlyJoined = (members: OneBotGroupMemberInfo[], limit: number): string => {
  const list = [...members].filter(hasUserId).sort((a, b) => Number(b.join_time || 0) - Number(a.join_time || 0)).slice(0, limit);
  if (!list.length) return '暂无最近入群数据。';
  return [`最近的${list.length}条入群记录`, ...list.map((member, index) => `${index + 1}. ${displayName(member)}(${member.user_id}) 入群：${formatTime(member.join_time)} 最后发言：${formatTime(member.last_sent_time)}`)].join('\n');
};
