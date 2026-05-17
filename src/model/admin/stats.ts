import { createStoreKey, getRedis } from '../../adapter/storage';

type MessageStatsScope = {
  userId?: string | number;
  groupId?: string | number;
  botId?: string | number;
};

type MessageStatsOptions = MessageStatsScope & {
  time?: number;
  direction?: 'receive' | 'send';
};

export type MessageStatsRecord = {
  label: string;
  today: number;
  yesterday: number;
  month: number;
  total: number;
};

export type MessageStatsTableRow = {
  label: string;
  receive: number;
  send: number;
};

export type MessageStatsTable = {
  title: string;
  rows: MessageStatsTableRow[];
};

export type GroupUserActivityRecord = {
  userId: string;
  lastTime: number;
};

const dayText = (time: number): string => {
  const date = new Date(time * 1000);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}${month}${day}`;
};

const monthText = (time: number): string => dayText(time).slice(0, 6);
const yearText = (time: number): string => dayText(time).slice(0, 4);
const nowSeconds = (): number => Math.floor(Date.now() / 1000);
const yesterdayTime = (): number => nowSeconds() - 86400;
const twoDaysAgoTime = (): number => nowSeconds() - 86400 * 2;

const dateLabel = (scope: string): string => {
  if (scope === 'total') return '总计';
  if (/^\d{8}$/.test(scope)) return `${scope.slice(0, 4)}-${scope.slice(4, 6)}-${scope.slice(6, 8)}`;
  if (/^\d{6}$/.test(scope)) return `${scope.slice(0, 4)}-${scope.slice(4, 6)}`;
  return scope;
};

const countKey = (direction: 'receive' | 'send', scope: string, dateScope: string): string => {
  return createStoreKey('stats', direction, scope, dateScope);
};

const groupLastActiveKey = (groupId: string | number): string => createStoreKey('stats', 'group-activity', String(groupId), 'last');
const groupActiveUsersKey = (groupId: string | number): string => createStoreKey('stats', 'group-activity', String(groupId), 'users');

const scopeParts = (scope: MessageStatsScope): string[] => {
  const parts = ['total'];
  if (scope.botId) parts.push(`bot:${scope.botId}`);
  if (scope.userId) parts.push(`user:${scope.userId}`);
  if (scope.groupId) parts.push(`group:${scope.groupId}`);
  return parts;
};

const scopeTitle = (scope: string): string => {
  if (scope === 'total') return '总消息';
  if (scope.startsWith('bot:')) return `机器人 ${scope.slice(4)}`;
  if (scope.startsWith('user:')) return `用户 ${scope.slice(5)}`;
  if (scope.startsWith('group:')) return `群 ${scope.slice(6)}`;
  return scope;
};

const getCount = async (direction: 'receive' | 'send', scope: string, dateScope: string): Promise<number> => {
  const raw = await getRedis().get(countKey(direction, scope, dateScope));
  const num = Number(raw || 0);
  return Number.isFinite(num) ? num : 0;
};

export const recordMessageStats = async (options: MessageStatsOptions): Promise<void> => {
  const time = options.time || nowSeconds();
  const direction = options.direction || 'receive';
  const redis = getRedis();
  const scopes = scopeParts(options);
  const dates = [dayText(time), monthText(time), yearText(time), 'total'];
  const pipeline = redis.pipeline();
  for (const scope of scopes) {
    for (const dateScope of dates) {
      pipeline.incr(countKey(direction, scope, dateScope));
    }
  }
  if (direction === 'receive' && options.groupId && options.userId) {
    pipeline.hset(groupLastActiveKey(options.groupId), String(options.userId), String(time));
    pipeline.sadd(groupActiveUsersKey(options.groupId), String(options.userId));
  }
  await pipeline.exec();
};

export const getGroupUserActivity = async (groupId: string | number): Promise<Map<string, number>> => {
  const raw = await getRedis().hgetall(groupLastActiveKey(groupId));
  const map = new Map<string, number>();
  for (const [userId, value] of Object.entries(raw)) {
    const time = Number(value);
    if (Number.isFinite(time) && time > 0) map.set(userId, time);
  }
  return map;
};

export const listGroupUserActivity = async (groupId: string | number): Promise<GroupUserActivityRecord[]> => {
  const map = await getGroupUserActivity(groupId);
  return [...map.entries()]
    .map(([userId, lastTime]) => ({ userId, lastTime }))
    .sort((a, b) => a.lastTime - b.lastTime);
};

export const getMessageStats = async (scope: MessageStatsScope = {}, direction: 'receive' | 'send' = 'receive'): Promise<MessageStatsRecord[]> => {
  const today = dayText(nowSeconds());
  const yesterday = dayText(yesterdayTime());
  const month = monthText(nowSeconds());
  const scopes = scopeParts(scope).map(part => ({ key: part, label: scopeTitle(part) }));

  return Promise.all(scopes.map(async scopeItem => ({
    label: scopeItem.label,
    today: await getCount(direction, scopeItem.key, today),
    yesterday: await getCount(direction, scopeItem.key, yesterday),
    month: await getCount(direction, scopeItem.key, month),
    total: await getCount(direction, scopeItem.key, 'total')
  })));
};

export const getMessageStatsTables = async (scope: MessageStatsScope = {}): Promise<MessageStatsTable[]> => {
  const dateScopes = [dayText(nowSeconds()), dayText(yesterdayTime()), dayText(twoDaysAgoTime()), monthText(nowSeconds()), yearText(nowSeconds()), 'total'];
  const scopes = scopeParts(scope);

  return Promise.all(scopes.map(async scope => ({
    title: scopeTitle(scope),
    rows: await Promise.all(dateScopes.map(async dateScope => ({
      label: dateLabel(dateScope),
      receive: await getCount('receive', scope, dateScope),
      send: await getCount('send', scope, dateScope)
    })))
  })));
};

export const formatMessageStats = (records: MessageStatsRecord[]): string => {
  if (!records.length) return '暂无消息统计数据。';
  return records.map(record => [
    `${record.label}:`,
    `今日 ${record.today}`,
    `昨日 ${record.yesterday}`,
    `本月 ${record.month}`,
    `总计 ${record.total}`
  ].join(' / ')).join('\n');
};
