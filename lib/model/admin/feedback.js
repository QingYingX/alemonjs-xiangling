import { getRedis, createStoreKey } from '../../adapter/storage.js';
import { getEventGroupId } from '../group/admin.js';

const FEEDBACK_TTL_SECONDS = 7 * 24 * 60 * 60;
const FEEDBACK_INDEX_LIMIT = 200;
const recordKey = (code) => createStoreKey('feedback', `${code}.json`);
const indexKey = () => createStoreKey('feedback', 'index.json');
const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));
const readIndex = async () => {
    const raw = await getRedis().get(indexKey());
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    }
    catch {
        return [];
    }
};
const writeIndex = async (codes) => {
    await getRedis().set(indexKey(), JSON.stringify(codes.slice(0, FEEDBACK_INDEX_LIMIT)), 'EX', FEEDBACK_TTL_SECONDS);
};
const createFeedback = async (event, content) => {
    const redis = getRedis();
    let code = generateCode();
    for (let retry = 0; retry < 10; retry++) {
        if (!(await redis.exists(recordKey(code))))
            break;
        code = generateCode();
    }
    const groupId = getEventGroupId(event);
    const record = {
        code,
        userId: String(event.UserId || ''),
        userName: event.UserName || '未知用户',
        groupId: groupId ? String(groupId) : undefined,
        content,
        createdAt: new Date().toISOString(),
        isPrivate: Boolean(event.IsPrivate),
        botId: event.BotId
    };
    await redis.set(recordKey(code), JSON.stringify(record), 'EX', FEEDBACK_TTL_SECONDS);
    const index = await readIndex();
    await writeIndex([code, ...index.filter(item => item !== code)]);
    return record;
};
const getFeedback = async (code) => {
    const raw = await getRedis().get(recordKey(code));
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
};
const deleteFeedback = async (code) => {
    const redis = getRedis();
    const index = await readIndex();
    await writeIndex(index.filter(item => item !== code));
    return await redis.del(recordKey(code)) > 0;
};
const clearFeedback = async () => {
    const redis = getRedis();
    const codes = await readIndex();
    const keys = codes.map(recordKey);
    const count = keys.length ? await redis.del(...keys) : 0;
    await redis.del(indexKey());
    return count;
};
const listFeedback = async (page = 1, pageSize = 10) => {
    const codes = await readIndex();
    const records = [];
    for (const code of codes) {
        const record = await getFeedback(code);
        if (record)
            records.push(record);
    }
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const pages = Math.max(1, Math.ceil(records.length / pageSize));
    const start = (Math.max(1, page) - 1) * pageSize;
    return { total: records.length, pages, records: records.slice(start, start + pageSize) };
};
const formatFeedbackRecord = (record) => {
    const source = record.isPrivate ? '私聊' : `群聊 ${record.groupId ?? '未知'}`;
    const time = new Date(record.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    return [`【用户反馈】`, `识别码: ${record.code}`, `发送者: ${record.userName}(${record.userId})`, `来源: ${source}`, `时间: ${time}`, '━━━━━━━━', record.content].join('\n');
};
const formatFeedbackList = (page, totalPages, total, records) => {
    if (!records.length)
        return '暂无反馈记录。';
    const lines = records.map((record, index) => {
        const time = new Date(record.createdAt).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
        const preview = record.content.length > 30 ? `${record.content.slice(0, 30)}...` : record.content;
        return `${index + 1}. [${record.code}] ${time}\n发送者: ${record.userName}(${record.userId})\n内容: ${preview}`;
    });
    return [`反馈列表 第 ${page}/${totalPages} 页，共 ${total} 条`, '━━━━━━━━', ...lines].join('\n\n');
};

export { clearFeedback, createFeedback, deleteFeedback, formatFeedbackList, formatFeedbackRecord, getFeedback, listFeedback };
