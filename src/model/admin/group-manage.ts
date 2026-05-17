import { createStoreKey, getRedis } from '../../adapter/storage';
import { getXianglingConfig } from '../../config/xiangling';

export type GroupManageConfig = {
  autoApproveGroupInvite: boolean;
};

const key = (): string => createStoreKey('admin', 'group-manage.json');

const getDefaultConfig = (): GroupManageConfig => ({
  autoApproveGroupInvite: getXianglingConfig().group_manage.auto_approve_group_invite
});

const normalize = (value: Partial<GroupManageConfig> = {}, fallback = getDefaultConfig()): GroupManageConfig => ({
  autoApproveGroupInvite: value.autoApproveGroupInvite ?? fallback.autoApproveGroupInvite
});

export const getGroupManageConfig = async (): Promise<GroupManageConfig> => {
  const raw = await getRedis().get(key());
  if (!raw) return getDefaultConfig();
  try {
    return normalize(JSON.parse(raw) as Partial<GroupManageConfig>);
  } catch {
    return getDefaultConfig();
  }
};

export const setGroupManageConfig = async (value: Partial<GroupManageConfig>): Promise<GroupManageConfig> => {
  const config = normalize(value, await getGroupManageConfig());
  await getRedis().set(key(), JSON.stringify(config));
  return config;
};
