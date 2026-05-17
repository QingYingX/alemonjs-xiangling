import { createStoreKey, getRedis } from '../../adapter/storage';
import { extractRawMessageText } from '../group/who-at';

export type RecallMessageSnapshot = {
  messageId: string;
  userId?: string | number;
  userName?: string;
  groupId?: string | number;
  groupName?: string;
  text: string;
  mediaText?: string;
  time: number;
};

export type RecallRecord = RecallMessageSnapshot & {
  operatorId?: string | number;
  recallTime: number;
};

const snapshotKey = (messageId: string | number): string => createStoreKey('recall', 'snapshot', `${messageId}.json`);
const recordsKey = (scope: 'group' | 'private', id?: string | number): string => createStoreKey('recall', scope, `${id || 'global'}.json`);
const snapshotTtl = 2 * 60 * 60;
const recordsTtl = 7 * 24 * 60 * 60;
const maxRecords = 50;

const mediaSummary = (media: unknown): string => {
  if (!Array.isArray(media) || !media.length) return '';
  return media.map(item => {
    const type = item && typeof item === 'object' ? (item as { Type?: string; type?: string }).Type || (item as { type?: string }).type : '';
    if (type === 'image') return '[图片]';
    if (type === 'audio') return '[语音]';
    if (type === 'video') return '[视频]';
    if (type === 'file') return '[文件]';
    return type ? `[${type}]` : '';
  }).join('');
};

export const saveMessageSnapshot = async (snapshot: RecallMessageSnapshot): Promise<void> => {
  if (!snapshot.messageId) return;
  await getRedis().set(snapshotKey(snapshot.messageId), JSON.stringify(snapshot), 'EX', snapshotTtl);
};

export const buildSnapshotFromEvent = (event: {
  MessageId?: string;
  MessageText?: string;
  MessageMedia?: unknown;
  UserId?: string | number;
  UserName?: string;
  GuildId?: string | number;
  GuildName?: string;
  value?: unknown;
}): RecallMessageSnapshot | null => {
  if (!event.MessageId) return null;
  const rawValue = event.value as { message?: unknown; time?: number; sender?: { nickname?: string; card?: string } } | undefined;
  const rawText = extractRawMessageText(rawValue?.message);
  const mediaText = mediaSummary(event.MessageMedia);
  return {
    messageId: String(event.MessageId),
    userId: event.UserId,
    userName: event.UserName || rawValue?.sender?.card || rawValue?.sender?.nickname,
    groupId: event.GuildId,
    groupName: event.GuildName,
    text: event.MessageText || rawText || mediaText || '[暂不支持的消息类型]',
    mediaText,
    time: Number(rawValue?.time) || Math.floor(Date.now() / 1000)
  };
};

const getSnapshot = async (messageId: string | number): Promise<RecallMessageSnapshot | null> => {
  const raw = await getRedis().get(snapshotKey(messageId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RecallMessageSnapshot;
  } catch {
    return null;
  }
};

export const recordRecall = async (params: {
  messageId?: string | number;
  scope: 'group' | 'private';
  groupId?: string | number;
  operatorId?: string | number;
  fallbackUserId?: string | number;
}): Promise<RecallRecord | null> => {
  if (!params.messageId) return null;
  const snapshot = await getSnapshot(params.messageId);
  if (!snapshot) return null;
  const record: RecallRecord = {
    ...snapshot,
    groupId: snapshot.groupId || params.groupId,
    userId: snapshot.userId || params.fallbackUserId,
    operatorId: params.operatorId,
    recallTime: Math.floor(Date.now() / 1000)
  };
  const redis = getRedis();
  const redisKey = recordsKey(params.scope, params.scope === 'group' ? record.groupId : record.userId);
  const globalKey = recordsKey(params.scope);
  for (const key of [redisKey, globalKey]) {
    const raw = await redis.get(key);
    let list: RecallRecord[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as RecallRecord[];
        list = Array.isArray(parsed) ? parsed : [];
      } catch {
        list = [];
      }
    }
    list.unshift(record);
    await redis.set(key, JSON.stringify(list.slice(0, maxRecords)), 'EX', recordsTtl);
  }
  return record;
};

export const listRecallRecords = async (scope: 'group' | 'private', id?: string | number): Promise<RecallRecord[]> => {
  const raw = await getRedis().get(recordsKey(scope, id));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as RecallRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const formatRecallRecords = (records: RecallRecord[], title: string): string => {
  if (!records.length) return `${title}\n暂无撤回记录。`;
  return [
    title,
    ...records.slice(0, 20).map((record, index) => {
      const time = new Date(record.recallTime * 1000).toLocaleString('zh-CN', { hour12: false });
      const sender = record.userName ? `${record.userName}(${record.userId || '未知'})` : String(record.userId || '未知');
      const operator = record.operatorId && String(record.operatorId) !== String(record.userId || '') ? ` 操作人:${record.operatorId}` : '';
      return `${index + 1}. ${time} ${sender}${operator}\n${record.text}`;
    })
  ].join('\n');
};
