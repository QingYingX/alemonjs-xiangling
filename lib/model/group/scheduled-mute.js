import { clearTimeout, setCron } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getRedis, createStoreKey } from '../../adapter/storage.js';

const key = () => createStoreKey('group-scheduled-mute.json');
const runtimeTasks = new Map();
const taskKey = (groupId, type) => `${groupId}:${type}`;
const normalizeTasks = (value) => {
    if (!Array.isArray(value))
        return [];
    return value
        .map(item => item && typeof item === 'object' ? item : null)
        .filter((item) => item !== null)
        .map((item) => ({
        groupId: Number(item.groupId),
        cron: String(item.cron || '').trim(),
        type: item.type === 'unmute' ? 'unmute' : 'mute',
        scheduleId: item.scheduleId,
        createdAt: item.createdAt || new Date().toISOString()
    }))
        .filter(item => Number.isSafeInteger(item.groupId) && Boolean(item.cron));
};
const getScheduledMuteTasks = async () => {
    const raw = await getRedis().get(key());
    if (!raw)
        return [];
    try {
        return normalizeTasks(JSON.parse(raw));
    }
    catch {
        return [];
    }
};
const saveScheduledMuteTasks = async (tasks) => {
    await getRedis().set(key(), JSON.stringify(normalizeTasks(tasks)));
};
const toCronExpression = (input) => {
    const text = input.trim();
    const time = text.match(/^(\d{1,2})[:：](\d{1,2})$/);
    if (time) {
        const hour = Number(time[1]);
        const minute = Number(time[2]);
        if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59)
            return `0 ${minute} ${hour} * * *`;
        return null;
    }
    return text.split(/\s+/).length >= 5 ? text : null;
};
const scheduleMuteTask = (event, task) => {
    const keyText = taskKey(task.groupId, task.type);
    const oldId = runtimeTasks.get(keyText);
    if (oldId)
        clearTimeout(oldId);
    const scheduleId = setCron(task.cron, async () => {
        const [client] = useClient(event);
        await client.setGroupWholeBan({ group_id: task.groupId, enable: task.type === 'mute' });
    });
    runtimeTasks.set(keyText, scheduleId);
    return scheduleId;
};
const addScheduledMuteTask = async (event, groupId, type, cron) => {
    const tasks = await getScheduledMuteTasks();
    const exists = tasks.find(item => item.groupId === groupId && item.type === type);
    if (exists)
        return { changed: false, task: exists };
    const task = { groupId, type, cron, createdAt: new Date().toISOString() };
    task.scheduleId = scheduleMuteTask(event, task);
    tasks.push(task);
    await saveScheduledMuteTasks(tasks);
    return { changed: true, task };
};
const removeScheduledMuteTask = async (groupId, type) => {
    const tasks = await getScheduledMuteTasks();
    const keyText = taskKey(groupId, type);
    const oldId = runtimeTasks.get(keyText);
    if (oldId) {
        clearTimeout(oldId);
        runtimeTasks.delete(keyText);
    }
    const next = tasks.filter(item => !(item.groupId === groupId && item.type === type));
    await saveScheduledMuteTasks(next);
    return next.length !== tasks.length;
};
const formatScheduledMuteTasks = (tasks) => {
    if (!tasks.length)
        return '目前还没有定时禁言任务。';
    return ['定时禁言任务：', ...tasks.map((item, index) => `${index + 1}. 群号：${item.groupId} ${item.type === 'mute' ? '禁言' : '解禁'} ${item.cron}`)].join('\n');
};

export { addScheduledMuteTask, formatScheduledMuteTasks, getScheduledMuteTasks, removeScheduledMuteTask, scheduleMuteTask, toCronExpression };
