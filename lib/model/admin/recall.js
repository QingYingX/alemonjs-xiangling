import { getRedis, createStoreKey } from '../../adapter/storage.js';
import { extractRawMessageText } from '../group/who-at.js';

const snapshotKey = (messageId) => createStoreKey('recall', 'snapshot', `${messageId}.json`);
const recordsKey = (scope, id) => createStoreKey('recall', scope, `${id || 'global'}.json`);
const snapshotTtl = 2 * 60 * 60;
const recordsTtl = 7 * 24 * 60 * 60;
const maxRecords = 50;
const mediaSummary = (media) => {
    if (!Array.isArray(media) || !media.length)
        return '';
    return media.map(item => {
        const type = item && typeof item === 'object' ? item.Type || item.type : '';
        if (type === 'image')
            return '[图片]';
        if (type === 'audio')
            return '[语音]';
        if (type === 'video')
            return '[视频]';
        if (type === 'file')
            return '[文件]';
        return type ? `[${type}]` : '';
    }).join('');
};
const saveMessageSnapshot = async (snapshot) => {
    if (!snapshot.messageId)
        return;
    await getRedis().set(snapshotKey(snapshot.messageId), JSON.stringify(snapshot), 'EX', snapshotTtl);
};
const buildSnapshotFromEvent = (event) => {
    if (!event.MessageId)
        return null;
    const rawValue = event.value;
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
const getSnapshot = async (messageId) => {
    const raw = await getRedis().get(snapshotKey(messageId));
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
};
const recordRecall = async (params) => {
    if (!params.messageId)
        return null;
    const snapshot = await getSnapshot(params.messageId);
    if (!snapshot)
        return null;
    const record = {
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
        let list = [];
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                list = Array.isArray(parsed) ? parsed : [];
            }
            catch {
                list = [];
            }
        }
        list.unshift(record);
        await redis.set(key, JSON.stringify(list.slice(0, maxRecords)), 'EX', recordsTtl);
    }
    return record;
};
const listRecallRecords = async (scope, id) => {
    const raw = await getRedis().get(recordsKey(scope, id));
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
};
const formatRecallRecords = (records, title) => {
    if (!records.length)
        return `${title}\n暂无撤回记录。`;
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

export { buildSnapshotFromEvent, formatRecallRecords, listRecallRecords, recordRecall, saveMessageSnapshot };
