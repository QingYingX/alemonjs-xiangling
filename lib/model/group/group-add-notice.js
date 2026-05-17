import { getRedis, createStoreKey } from '../../adapter/storage.js';
import { getXianglingConfig } from '../../config/xiangling.js';

const key = () => createStoreKey('group-add-notice.json');
const getDefaultConfig = () => {
    const config = getXianglingConfig().group_add_notice;
    return {
        openGroups: [...config.open_groups],
        message: config.message
    };
};
const normalize = (value = {}, fallback = getDefaultConfig()) => ({
    openGroups: Array.isArray(value.openGroups) ? value.openGroups.map(String).filter(Boolean) : fallback.openGroups,
    message: String(value.message || fallback.message)
});
const getGroupAddNoticeConfig = async () => {
    const raw = await getRedis().get(key());
    if (!raw)
        return normalize();
    try {
        return normalize(JSON.parse(raw));
    }
    catch {
        return normalize();
    }
};
const saveGroupAddNoticeConfig = async (config) => {
    await getRedis().set(key(), JSON.stringify(normalize(config)));
};
const setGroupAddNoticeConfig = async (value) => {
    const config = normalize(value);
    await saveGroupAddNoticeConfig(config);
    return config;
};
const isGroupAddNoticeOpen = async (groupId) => {
    const config = await getGroupAddNoticeConfig();
    return config.openGroups.includes(String(groupId));
};
const setGroupAddNoticeOpen = async (groupId, open) => {
    const config = await getGroupAddNoticeConfig();
    const id = String(groupId);
    const exists = config.openGroups.includes(id);
    if (open && exists)
        return { changed: false, config };
    if (!open && !exists)
        return { changed: false, config };
    config.openGroups = open ? [...config.openGroups, id] : config.openGroups.filter(item => item !== id);
    await saveGroupAddNoticeConfig(config);
    return { changed: true, config };
};
const formatGroupAddNotice = (config) => {
    return config.openGroups.length ? `已开启加群通知的群：\n${config.openGroups.join('\n')}` : '当前没有群开启加群通知。';
};

export { formatGroupAddNotice, getGroupAddNoticeConfig, isGroupAddNoticeOpen, setGroupAddNoticeConfig, setGroupAddNoticeOpen };
