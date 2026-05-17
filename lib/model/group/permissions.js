import { getConfigValue, logger } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberInfo } from '../../adapter/onebot.js';
import { toSafeInteger, getEventGroupId } from './admin.js';

const normalizeRole = (value) => {
    const role = String(value ?? '').trim().toLowerCase();
    if (role === 'owner' || role === 'admin' || role === 'member')
        return role;
    return '';
};
const getEventSenderRole = (event) => {
    const value = event.value;
    return normalizeRole(value?.sender?.role) || normalizeRole(value?.member?.role) || normalizeRole(value?.role);
};
const getGroupRole = async (event) => {
    const senderRole = getEventSenderRole(event);
    if (senderRole)
        return senderRole;
    const groupId = getEventGroupId(event);
    const userId = toSafeInteger(event.UserId);
    if (!groupId || !userId)
        return '';
    return getGroupMemberRole(event, groupId, userId);
};
const getGroupMemberRole = async (event, groupId, userId) => {
    try {
        const [client] = useClient(event);
        const member = normalizeGroupMemberInfo(await client.getGroupMemberInfo({ group_id: groupId, user_id: userId, no_cache: false }));
        return normalizeRole(member?.role);
    }
    catch (error) {
        logger.warn(`xiangling get group role failed: ${error instanceof Error ? error.message : String(error)}`);
        return '';
    }
};
const getBotGroupRole = async (event, groupId) => {
    const botId = toSafeInteger(event.BotId);
    if (!botId)
        return '';
    return getGroupMemberRole(event, groupId, botId);
};
const hasBotGroupAdminPermission = async (event, groupId) => {
    const role = await getBotGroupRole(event, groupId);
    return role === '' || role === 'owner' || role === 'admin';
};
const hasBotGroupOwnerPermission = async (event, groupId) => {
    const role = await getBotGroupRole(event, groupId);
    return role === '' || role === 'owner';
};
const hasGroupAdminPermission = async (event) => {
    if (event.IsMaster)
        return true;
    const role = await getGroupRole(event);
    return role === 'owner' || role === 'admin';
};
const hasGroupOwnerPermission = async (event) => {
    if (event.IsMaster)
        return true;
    return await getGroupRole(event) === 'owner';
};
const isAdminRole = (role) => role === 'owner' || role === 'admin';
const isMasterUser = (event, userId) => {
    if (String(event.UserId || '') === String(userId || '') && event.IsMaster)
        return true;
    const config = getConfigValue() || {};
    const onebot = config.onebot && typeof config.onebot === 'object' && !Array.isArray(config.onebot)
        ? config.onebot
        : {};
    const masterIds = Array.isArray(onebot.master_id) ? onebot.master_id : [];
    return masterIds.map(String).includes(String(userId || ''));
};

export { getBotGroupRole, getGroupMemberRole, getGroupRole, hasBotGroupAdminPermission, hasBotGroupOwnerPermission, hasGroupAdminPermission, hasGroupOwnerPermission, isAdminRole, isMasterUser };
