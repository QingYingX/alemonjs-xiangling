import { getRedis, createStoreKey } from '../../adapter/storage.js';

const dayText = (time) => {
    const date = new Date(time * 1000);
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}${month}${day}`;
};
const monthText = (time) => dayText(time).slice(0, 6);
const yearText = (time) => dayText(time).slice(0, 4);
const nowSeconds = () => Math.floor(Date.now() / 1000);
const yesterdayTime = () => nowSeconds() - 86400;
const twoDaysAgoTime = () => nowSeconds() - 86400 * 2;
const dateLabel = (scope) => {
    if (scope === 'total')
        return '总计';
    if (/^\d{8}$/.test(scope))
        return `${scope.slice(0, 4)}-${scope.slice(4, 6)}-${scope.slice(6, 8)}`;
    if (/^\d{6}$/.test(scope))
        return `${scope.slice(0, 4)}-${scope.slice(4, 6)}`;
    return scope;
};
const countKey = (direction, scope, dateScope) => {
    return createStoreKey('stats', direction, scope, dateScope);
};
const groupLastActiveKey = (groupId) => createStoreKey('stats', 'group-activity', String(groupId), 'last');
const groupActiveUsersKey = (groupId) => createStoreKey('stats', 'group-activity', String(groupId), 'users');
const scopeParts = (scope) => {
    const parts = ['total'];
    if (scope.botId)
        parts.push(`bot:${scope.botId}`);
    if (scope.userId)
        parts.push(`user:${scope.userId}`);
    if (scope.groupId)
        parts.push(`group:${scope.groupId}`);
    return parts;
};
const scopeTitle = (scope) => {
    if (scope === 'total')
        return '总消息';
    if (scope.startsWith('bot:'))
        return `机器人 ${scope.slice(4)}`;
    if (scope.startsWith('user:'))
        return `用户 ${scope.slice(5)}`;
    if (scope.startsWith('group:'))
        return `群 ${scope.slice(6)}`;
    return scope;
};
const getCount = async (direction, scope, dateScope) => {
    const raw = await getRedis().get(countKey(direction, scope, dateScope));
    const num = Number(raw || 0);
    return Number.isFinite(num) ? num : 0;
};
const recordMessageStats = async (options) => {
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
const getGroupUserActivity = async (groupId) => {
    const raw = await getRedis().hgetall(groupLastActiveKey(groupId));
    const map = new Map();
    for (const [userId, value] of Object.entries(raw)) {
        const time = Number(value);
        if (Number.isFinite(time) && time > 0)
            map.set(userId, time);
    }
    return map;
};
const listGroupUserActivity = async (groupId) => {
    const map = await getGroupUserActivity(groupId);
    return [...map.entries()]
        .map(([userId, lastTime]) => ({ userId, lastTime }))
        .sort((a, b) => a.lastTime - b.lastTime);
};
const getMessageStats = async (scope = {}, direction = 'receive') => {
    const today = dayText(nowSeconds());
    const yesterday = dayText(yesterdayTime());
    const month = monthText(nowSeconds());
    const scopes = scopeParts(scope).map(part => ({ key: part, label: scopeTitle(part) }));
    return Promise.all(scopes.map(async (scopeItem) => ({
        label: scopeItem.label,
        today: await getCount(direction, scopeItem.key, today),
        yesterday: await getCount(direction, scopeItem.key, yesterday),
        month: await getCount(direction, scopeItem.key, month),
        total: await getCount(direction, scopeItem.key, 'total')
    })));
};
const getMessageStatsTables = async (scope = {}) => {
    const dateScopes = [dayText(nowSeconds()), dayText(yesterdayTime()), dayText(twoDaysAgoTime()), monthText(nowSeconds()), yearText(nowSeconds()), 'total'];
    const scopes = scopeParts(scope);
    return Promise.all(scopes.map(async (scope) => ({
        title: scopeTitle(scope),
        rows: await Promise.all(dateScopes.map(async (dateScope) => ({
            label: dateLabel(dateScope),
            receive: await getCount('receive', scope, dateScope),
            send: await getCount('send', scope, dateScope)
        })))
    })));
};
const formatMessageStats = (records) => {
    if (!records.length)
        return '暂无消息统计数据。';
    return records.map(record => [
        `${record.label}:`,
        `今日 ${record.today}`,
        `昨日 ${record.yesterday}`,
        `本月 ${record.month}`,
        `总计 ${record.total}`
    ].join(' / ')).join('\n');
};

export { formatMessageStats, getGroupUserActivity, getMessageStats, getMessageStatsTables, listGroupUserActivity, recordMessageStats };
