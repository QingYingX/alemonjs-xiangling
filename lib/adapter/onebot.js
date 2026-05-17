import { logger } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';

const toNumber = (value) => {
    const text = String(value ?? '').trim();
    if (!/^\d+$/.test(text))
        return undefined;
    const num = Number(text);
    return Number.isSafeInteger(num) ? num : undefined;
};
const toText = (value) => {
    const text = String(value ?? '').trim();
    return text ? text : undefined;
};
const getNested = (value, ...keys) => {
    for (const key of keys) {
        if (value[key] !== undefined && value[key] !== null)
            return value[key];
    }
    return undefined;
};
const pickObject = (value) => {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
};
const pickList = (value) => {
    if (Array.isArray(value)) {
        if (value.length === 1 && value[0] && typeof value[0] === 'object') {
            const first = value[0];
            const nested = getNested(first, 'data', 'result', 'rows', 'items', 'list', 'groups', 'group_list', 'groupList', 'groupInfo');
            if (Array.isArray(nested))
                return nested;
        }
        return value;
    }
    if (value && typeof value === 'object') {
        const object = value;
        const nested = getNested(object, 'data', 'result', 'rows', 'items', 'list', 'groups', 'group_list', 'groupList', 'groupInfo');
        if (Array.isArray(nested))
            return nested;
        if (nested && typeof nested === 'object')
            return pickList(nested);
    }
    return [];
};
const normalizeGroupInfo = (value) => {
    if (!value || typeof value !== 'object')
        return null;
    const item = value;
    const nested = item.group && typeof item.group === 'object' ? item.group : {};
    const groupId = toNumber(getNested(item, 'group_id', 'groupId', 'id', 'gid', 'uin', 'guild_id', 'guildId', 'group_uin', 'groupUin')) ?? toNumber(getNested(nested, 'group_id', 'groupId', 'id', 'gid', 'uin'));
    if (!groupId) {
        for (const key of ['data', 'result', 'info', 'group_info', 'groupInfo']) {
            const record = pickObject(item[key]);
            if (!record)
                continue;
            const info = normalizeGroupInfo(record);
            if (info)
                return info;
        }
    }
    if (!groupId)
        return null;
    const name = toText(getNested(item, 'group_name', 'groupName', 'name', 'group_remark', 'groupRemark', 'guild_name', 'guildName', 'remark')) ?? toText(getNested(nested, 'group_name', 'groupName', 'name', 'remark'));
    const memberCount = toNumber(getNested(item, 'member_count', 'memberCount', 'member_num', 'memberNum', 'member_count_current', 'memberCountCurrent', 'member_total', 'memberTotal')) ?? toNumber(getNested(nested, 'member_count', 'memberCount', 'member_num', 'memberNum'));
    const maxMemberCount = toNumber(getNested(item, 'max_member_count', 'maxMemberCount', 'max_member_num', 'maxMemberNum', 'max_member', 'maxMember')) ?? toNumber(getNested(nested, 'max_member_count', 'maxMemberCount', 'max_member_num', 'maxMemberNum'));
    return {
        group_id: groupId,
        group_name: name,
        member_count: memberCount,
        max_member_count: maxMemberCount
    };
};
const normalizeGroupList = (value) => {
    const direct = pickList(value).map(normalizeGroupInfo).filter((item) => item !== null);
    if (direct.length || !value || typeof value !== 'object' || Array.isArray(value))
        return direct;
    for (const item of Object.values(value)) {
        const nested = normalizeGroupList(item);
        if (nested.length)
            return nested;
    }
    return [];
};
const normalizeFriendList = (value) => {
    return pickList(value).filter((item) => Boolean(item && typeof item === 'object' && toNumber(item.user_id)));
};
const normalizeGroupMemberInfo = (value) => {
    if (!value || typeof value !== 'object')
        return null;
    const item = value;
    const nested = item.member && typeof item.member === 'object' ? item.member : {};
    const userId = toNumber(getNested(item, 'user_id', 'userId', 'id', 'uid', 'uin', 'qq')) ?? toNumber(getNested(nested, 'user_id', 'userId', 'id', 'uid', 'uin', 'qq'));
    if (!userId) {
        for (const key of ['data', 'result', 'info', 'member_info', 'memberInfo']) {
            const record = pickObject(item[key]);
            if (!record)
                continue;
            const info = normalizeGroupMemberInfo(record);
            if (info)
                return info;
        }
    }
    if (!userId)
        return null;
    const nickname = toText(getNested(item, 'nickname', 'nick', 'name', 'user_name', 'userName')) ?? toText(getNested(nested, 'nickname', 'nick', 'name', 'user_name', 'userName'));
    const card = toText(getNested(item, 'card', 'cardName', 'group_card', 'groupCard', 'remark')) ?? toText(getNested(nested, 'card', 'cardName', 'group_card', 'groupCard', 'remark'));
    const role = toText(getNested(item, 'role', 'member_role', 'memberRole', 'permission')) ?? toText(getNested(nested, 'role', 'member_role', 'memberRole', 'permission'));
    const shutUpTimestamp = toNumber(getNested(item, 'shut_up_timestamp', 'shutUpTimestamp', 'shutup_time', 'shutupTime', 'mute_end_time', 'muteEndTime')) ?? toNumber(getNested(nested, 'shut_up_timestamp', 'shutUpTimestamp', 'shutup_time', 'shutupTime', 'mute_end_time', 'muteEndTime'));
    const joinTime = toNumber(getNested(item, 'join_time', 'joinTime', 'joined_at', 'joinedAt', 'add_time', 'addTime')) ?? toNumber(getNested(nested, 'join_time', 'joinTime', 'joined_at', 'joinedAt', 'add_time', 'addTime'));
    const lastSentTime = toNumber(getNested(item, 'last_sent_time', 'lastSentTime', 'last_speak_time', 'lastSpeakTime', 'last_msg_time', 'lastMsgTime', 'last_active_time', 'lastActiveTime')) ?? toNumber(getNested(nested, 'last_sent_time', 'lastSentTime', 'last_speak_time', 'lastSpeakTime', 'last_msg_time', 'lastMsgTime', 'last_active_time', 'lastActiveTime'));
    return {
        user_id: userId,
        nickname,
        card,
        role,
        shut_up_timestamp: shutUpTimestamp,
        join_time: joinTime,
        last_sent_time: lastSentTime
    };
};
const normalizeGroupMemberList = (value) => {
    const direct = pickList(value).map(normalizeGroupMemberInfo).filter((item) => item !== null);
    if (direct.length || !value || typeof value !== 'object' || Array.isArray(value))
        return direct;
    for (const item of Object.values(value)) {
        const nested = normalizeGroupMemberList(item);
        if (nested.length)
            return nested;
    }
    return [];
};
const warnUnsupportedShape = (name, data) => {
    logger.warn(`xiangling ${name} returned empty or unsupported shape: ${JSON.stringify(data)?.slice(0, 500)}`);
};
const sendOneBotAction = async (event, action, params = {}) => {
    const [client] = useClient(event);
    return client.send({ action, params });
};
const setGroupPortrait = async (event, groupId, file) => {
    return sendOneBotAction(event, 'set_group_portrait', { group_id: groupId, file, cache: 0 });
};
const deleteFriend = async (event, userId) => {
    return sendOneBotAction(event, 'delete_friend', { user_id: userId });
};
const ocrImage = async (event, image) => {
    return sendOneBotAction(event, 'ocr_image', { image });
};

export { deleteFriend, normalizeFriendList, normalizeGroupInfo, normalizeGroupList, normalizeGroupMemberInfo, normalizeGroupMemberList, ocrImage, sendOneBotAction, setGroupPortrait, warnUnsupportedShape };
