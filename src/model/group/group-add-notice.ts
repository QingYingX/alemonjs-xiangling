import { createStoreKey, getRedis } from '../../adapter/storage';
import { getXianglingConfig } from '../../config/xiangling';

export type GroupAddNoticeConfig = {
  openGroups: string[];
  message: string;
};

const key = (): string => createStoreKey('group-add-notice.json');

const getDefaultConfig = (): GroupAddNoticeConfig => {
  const config = getXianglingConfig().group_add_notice;
  return {
    openGroups: [...config.open_groups],
    message: config.message
  };
};

const normalize = (
  value: Partial<GroupAddNoticeConfig> = {},
  fallback = getDefaultConfig()
): GroupAddNoticeConfig => ({
  openGroups: Array.isArray(value.openGroups) ? value.openGroups.map(String).filter(Boolean) : fallback.openGroups,
  message: String(value.message || fallback.message)
});

export const getGroupAddNoticeConfig = async (): Promise<GroupAddNoticeConfig> => {
  const raw = await getRedis().get(key());
  if (!raw) return normalize();
  try {
    return normalize(JSON.parse(raw) as Partial<GroupAddNoticeConfig>);
  } catch {
    return normalize();
  }
};

const saveGroupAddNoticeConfig = async (config: GroupAddNoticeConfig) => {
  await getRedis().set(key(), JSON.stringify(normalize(config)));
};

export const setGroupAddNoticeConfig = async (value: Partial<GroupAddNoticeConfig>): Promise<GroupAddNoticeConfig> => {
  const config = normalize(value);
  await saveGroupAddNoticeConfig(config);
  return config;
};

export const isGroupAddNoticeOpen = async (groupId: number | string): Promise<boolean> => {
  const config = await getGroupAddNoticeConfig();
  return config.openGroups.includes(String(groupId));
};

export const setGroupAddNoticeOpen = async (groupId: number | string, open: boolean): Promise<{ changed: boolean; config: GroupAddNoticeConfig }> => {
  const config = await getGroupAddNoticeConfig();
  const id = String(groupId);
  const exists = config.openGroups.includes(id);
  if (open && exists) return { changed: false, config };
  if (!open && !exists) return { changed: false, config };
  config.openGroups = open ? [...config.openGroups, id] : config.openGroups.filter(item => item !== id);
  await saveGroupAddNoticeConfig(config);
  return { changed: true, config };
};

export const formatGroupAddNotice = (config: GroupAddNoticeConfig): string => {
  return config.openGroups.length ? `已开启加群通知的群：\n${config.openGroups.join('\n')}` : '当前没有群开启加群通知。';
};
