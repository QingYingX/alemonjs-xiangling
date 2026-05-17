import { getRedis, createStoreKey } from '../../adapter/storage.js';

const maxRecords = 30;
const ttlSeconds = 24 * 60 * 60;
const key = (groupId, userId) => createStoreKey('group-who-at', String(groupId), `${userId}.json`);
const groupPattern = (groupId) => createStoreKey('group-who-at', groupId ? String(groupId) : '*', '*.json');
const toText = (value) => String(value ?? '').trim();
const extractAtUserIds = (rawMessage) => {
    if (!Array.isArray(rawMessage))
        return [];
    const ids = rawMessage
        .filter(item => item && typeof item === 'object' && item.type === 'at')
        .map(item => toText(item.data?.qq ?? item.qq))
        .filter(item => item && item !== 'all');
    return [...new Set(ids)];
};
const extractRawMessageText = (rawMessage) => {
    if (!Array.isArray(rawMessage))
        return '';
    return rawMessage
        .filter(item => item && typeof item === 'object' && item.type !== 'at')
        .map(item => {
        const seg = item;
        if (seg.type === 'text')
            return toText(seg.data?.text ?? seg.text);
        if (seg.type === 'image')
            return '[图片]';
        if (seg.type === 'face')
            return `[表情${toText(seg.data?.id ?? seg.id)}]`;
        if (seg.type === 'record')
            return '[语音]';
        if (seg.type === 'video')
            return '[视频]';
        return '';
    })
        .join('')
        .trim();
};
const recordWhoAt = async (groupId, targetUserId, record) => {
    const redis = getRedis();
    const redisKey = key(groupId, targetUserId);
    const raw = await redis.get(redisKey);
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
    await redis.set(redisKey, JSON.stringify(list.slice(0, maxRecords)), 'EX', ttlSeconds);
};
const listWhoAt = async (groupId, userId) => {
    const raw = await getRedis().get(key(groupId, userId));
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
const clearWhoAt = async (groupId, userId) => {
    return (await getRedis().del(key(groupId, userId))) > 0;
};
const clearAllWhoAt = async (groupId) => {
    const redis = getRedis();
    const keys = await redis.keys(groupPattern(groupId));
    if (!keys.length)
        return 0;
    return redis.del(...keys);
};
const formatWhoAtRecords = (records, targetUserId, member) => {
    const targetName = member?.card || member?.nickname || String(targetUserId);
    if (!records.length)
        return `目前还没有人艾特过 ${targetName}。`;
    return [
        `最近艾特 ${targetName}(${targetUserId}) 的记录：`,
        ...records.slice(0, 20).map((record, index) => {
            const time = new Date(record.time * 1000).toLocaleString('zh-CN', { hour12: false });
            const text = record.message || '[仅@]';
            return `${index + 1}. ${record.senderName}(${record.userId}) ${time}\n${text}`;
        })
    ].join('\n');
};

export { clearAllWhoAt, clearWhoAt, extractAtUserIds, extractRawMessageText, formatWhoAtRecords, listWhoAt, recordWhoAt };
