import { getRedis, createStoreKey } from '../../adapter/storage.js';
import { getXianglingConfig } from '../../config/xiangling.js';

const key = () => createStoreKey('admin', 'group-manage.json');
const getDefaultConfig = () => ({
    autoApproveGroupInvite: getXianglingConfig().group_manage.auto_approve_group_invite
});
const normalize = (value = {}, fallback = getDefaultConfig()) => ({
    autoApproveGroupInvite: value.autoApproveGroupInvite ?? fallback.autoApproveGroupInvite
});
const getGroupManageConfig = async () => {
    const raw = await getRedis().get(key());
    if (!raw)
        return getDefaultConfig();
    try {
        return normalize(JSON.parse(raw));
    }
    catch {
        return getDefaultConfig();
    }
};
const setGroupManageConfig = async (value) => {
    const config = normalize(value, await getGroupManageConfig());
    await getRedis().set(key(), JSON.stringify(config));
    return config;
};

export { getGroupManageConfig, setGroupManageConfig };
