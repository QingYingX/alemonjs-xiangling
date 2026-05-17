import { getRedis, createStoreKey } from '../../adapter/storage.js';
import { getXianglingConfig } from '../../config/xiangling.js';
import { getGroupRole } from './permissions.js';

const key = () => createStoreKey('group-recall-permission.json');
const normalizeLevel = (value, fallback) => {
    return value === 'all' || value === 'admin' || value === 'owner' || value === 'master' ? value : fallback;
};
const getDefaultConfig = () => {
    const config = getXianglingConfig().group_recall;
    return {
        bot: normalizeLevel(config.bot, 'all'),
        member: normalizeLevel(config.member, 'admin')
    };
};
const normalize = (value = {}, fallback = getDefaultConfig()) => ({
    bot: normalizeLevel(value.bot, fallback.bot),
    member: normalizeLevel(value.member, fallback.member)
});
const getRecallPermissionConfig = async () => {
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
const setRecallPermissionConfig = async (value) => {
    const config = normalize(value, await getRecallPermissionConfig());
    await getRedis().set(key(), JSON.stringify(config));
    return config;
};
const roleRank = {
    '': 0,
    member: 1,
    admin: 2,
    owner: 3,
    master: 4
};
const requiredRank = {
    all: 0,
    admin: 2,
    owner: 3,
    master: 4
};
const hasRecallPermission = async (event, level) => {
    if (level === 'all')
        return true;
    if (event.IsMaster)
        return true;
    const role = await getGroupRole(event);
    return roleRank[role] >= requiredRank[level];
};

export { getRecallPermissionConfig, hasRecallPermission, setRecallPermissionConfig };
