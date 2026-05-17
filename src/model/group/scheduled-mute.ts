import { clearTimeout as cancelSchedule, setCron } from 'alemonjs';
import type { Events } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { createStoreKey, getRedis } from '../../adapter/storage';

export type ScheduledMuteTask = {
  groupId: number;
  cron: string;
  type: 'mute' | 'unmute';
  scheduleId?: string;
  createdAt: string;
};

const key = (): string => createStoreKey('group-scheduled-mute.json');
const runtimeTasks = new Map<string, string>();

const taskKey = (groupId: number, type: 'mute' | 'unmute'): string => `${groupId}:${type}`;

const normalizeTasks = (value: unknown): ScheduledMuteTask[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map(item => item && typeof item === 'object' ? item as Partial<ScheduledMuteTask> : null)
    .filter((item): item is Partial<ScheduledMuteTask> => item !== null)
    .map((item): ScheduledMuteTask => ({
      groupId: Number(item.groupId),
      cron: String(item.cron || '').trim(),
      type: item.type === 'unmute' ? 'unmute' : 'mute',
      scheduleId: item.scheduleId,
      createdAt: item.createdAt || new Date().toISOString()
    }))
    .filter(item => Number.isSafeInteger(item.groupId) && Boolean(item.cron));
};

export const getScheduledMuteTasks = async (): Promise<ScheduledMuteTask[]> => {
  const raw = await getRedis().get(key());
  if (!raw) return [];
  try {
    return normalizeTasks(JSON.parse(raw));
  } catch {
    return [];
  }
};

const saveScheduledMuteTasks = async (tasks: ScheduledMuteTask[]) => {
  await getRedis().set(key(), JSON.stringify(normalizeTasks(tasks)));
};

export const toCronExpression = (input: string): string | null => {
  const text = input.trim();
  const time = text.match(/^(\d{1,2})[:：](\d{1,2})$/);
  if (time) {
    const hour = Number(time[1]);
    const minute = Number(time[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) return `0 ${minute} ${hour} * * *`;
    return null;
  }
  return text.split(/\s+/).length >= 5 ? text : null;
};

export const scheduleMuteTask = (event: Events['message.create'], task: ScheduledMuteTask): string => {
  const keyText = taskKey(task.groupId, task.type);
  const oldId = runtimeTasks.get(keyText);
  if (oldId) cancelSchedule(oldId);
  const scheduleId = setCron(task.cron, async () => {
    const [client] = useClient(event);
    await client.setGroupWholeBan({ group_id: task.groupId, enable: task.type === 'mute' });
  });
  runtimeTasks.set(keyText, scheduleId);
  return scheduleId;
};

export const addScheduledMuteTask = async (event: Events['message.create'], groupId: number, type: 'mute' | 'unmute', cron: string): Promise<{ changed: boolean; task: ScheduledMuteTask }> => {
  const tasks = await getScheduledMuteTasks();
  const exists = tasks.find(item => item.groupId === groupId && item.type === type);
  if (exists) return { changed: false, task: exists };
  const task: ScheduledMuteTask = { groupId, type, cron, createdAt: new Date().toISOString() };
  task.scheduleId = scheduleMuteTask(event, task);
  tasks.push(task);
  await saveScheduledMuteTasks(tasks);
  return { changed: true, task };
};

export const removeScheduledMuteTask = async (groupId: number, type: 'mute' | 'unmute'): Promise<boolean> => {
  const tasks = await getScheduledMuteTasks();
  const keyText = taskKey(groupId, type);
  const oldId = runtimeTasks.get(keyText);
  if (oldId) {
    cancelSchedule(oldId);
    runtimeTasks.delete(keyText);
  }
  const next = tasks.filter(item => !(item.groupId === groupId && item.type === type));
  await saveScheduledMuteTasks(next);
  return next.length !== tasks.length;
};

export const formatScheduledMuteTasks = (tasks: ScheduledMuteTask[]): string => {
  if (!tasks.length) return '目前还没有定时禁言任务。';
  return ['定时禁言任务：', ...tasks.map((item, index) => `${index + 1}. 群号：${item.groupId} ${item.type === 'mute' ? '禁言' : '解禁'} ${item.cron}`)].join('\n');
};
