import type { EventKeys, Events } from 'alemonjs';
import { createStoreKey, getRedis } from '../../adapter/storage';

export type RequestKind = 'friend' | 'group';

export type RequestRecord = {
  kind: RequestKind;
  flag: string;
  userId: string;
  groupId?: string;
  subType?: string;
  comment?: string;
  createdAt: string;
  botId?: string;
};

const REQUEST_TTL_SECONDS = 3 * 24 * 60 * 60;
const REQUEST_INDEX_LIMIT = 200;

const indexKey = (kind: RequestKind): string => createStoreKey('requests', kind, 'index.json');
const recordKey = (kind: RequestKind, flag: string): string => createStoreKey('requests', kind, `${encodeURIComponent(flag)}.json`);

const readIndex = async (kind: RequestKind): Promise<string[]> => {
  const raw = await getRedis().get(indexKey(kind));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const writeIndex = async (kind: RequestKind, flags: string[]) => {
  await getRedis().set(indexKey(kind), JSON.stringify(flags.slice(0, REQUEST_INDEX_LIMIT)), 'EX', REQUEST_TTL_SECONDS);
};

export const saveRequest = async <T extends EventKeys>(event: Events[T], kind: RequestKind): Promise<RequestRecord | null> => {
  const raw = event.value ?? {};
  const flag = String(raw.flag ?? event.MessageId ?? '').trim();
  if (!flag) return null;

  const record: RequestRecord = {
    kind,
    flag,
    userId: String(raw.user_id ?? event.UserId ?? ''),
    groupId: raw.group_id ? String(raw.group_id) : undefined,
    subType: raw.sub_type ? String(raw.sub_type) : undefined,
    comment: raw.comment ? String(raw.comment) : undefined,
    createdAt: new Date(Number(raw.time ? raw.time * 1000 : Date.now())).toISOString(),
    botId: event.BotId
  };

  await getRedis().set(recordKey(kind, flag), JSON.stringify(record), 'EX', REQUEST_TTL_SECONDS);
  const index = await readIndex(kind);
  await writeIndex(kind, [flag, ...index.filter(item => item !== flag)]);

  return record;
};

export const getRequest = async (kind: RequestKind, flag: string): Promise<RequestRecord | null> => {
  const raw = await getRedis().get(recordKey(kind, flag));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RequestRecord;
  } catch {
    return null;
  }
};

export const removeRequest = async (kind: RequestKind, flag: string) => {
  await getRedis().del(recordKey(kind, flag));
  const index = await readIndex(kind);
  await writeIndex(kind, index.filter(item => item !== flag));
};

export const findRequest = async (kind: RequestKind, keyword: string): Promise<RequestRecord | null> => {
  const direct = await getRequest(kind, keyword);
  if (direct) return direct;

  const records = await listRequests(kind);
  return records.find(item => item.userId === keyword || item.groupId === keyword || item.flag.includes(keyword)) ?? null;
};

export const listRequests = async (kind: RequestKind): Promise<RequestRecord[]> => {
  const flags = await readIndex(kind);
  const records: RequestRecord[] = [];
  for (const flag of flags) {
    const record = await getRequest(kind, flag);
    if (record) records.push(record);
  }
  return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const formatRequestList = (kind: RequestKind, records: RequestRecord[]): string => {
  if (!records.length) return kind === 'friend' ? '暂无好友申请记录。' : '暂无群申请/邀请记录。';
  const title = kind === 'friend' ? '好友申请' : '群申请/邀请';
  const lines = records.slice(0, 20).map((record, index) => {
    const time = new Date(record.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    const group = record.groupId ? `\n群号: ${record.groupId}` : '';
    const subtype = record.subType ? `\n类型: ${record.subType}` : '';
    const comment = record.comment ? `\n附加信息: ${record.comment}` : '';
    return `${index + 1}. 用户: ${record.userId}${group}${subtype}\nflag: ${record.flag}\n时间: ${time}${comment}`;
  });
  return [`${title}，共 ${records.length} 条`, '━━━━━━━━', ...lines].join('\n\n');
};
