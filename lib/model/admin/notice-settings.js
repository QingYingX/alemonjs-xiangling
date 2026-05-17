import { getRedis, createStoreKey } from '../../adapter/storage.js';
import { getXianglingConfig } from '../../config/xiangling.js';

const noticeKeyMap = {
    好友消息: 'privateMessage',
    群消息: 'groupMessage',
    群临时消息: 'groupTemporaryMessage',
    群撤回: 'groupRecall',
    好友撤回: 'privateRecall',
    好友申请: 'friendRequest',
    群邀请: 'groupInviteRequest',
    加群申请: 'addGroupApplication',
    群管理变动: 'groupAdminChange',
    好友列表变动: 'friendNumberChange',
    群聊列表变动: 'groupNumberChange',
    群成员变动: 'groupMemberNumberChange',
    禁言: 'botBeenBanned',
    删除缓存时间: 'msgSaveDeltime',
    全部通知: 'notificationsAll'
};
const getDefaultNoticeSettings = () => {
    const config = getXianglingConfig().notice;
    return {
        privateMessage: config.private_message,
        groupMessage: config.group_message,
        groupTemporaryMessage: config.group_temporary_message,
        groupRecall: config.group_recall,
        privateRecall: config.private_recall,
        friendRequest: config.friend_request,
        groupInviteRequest: config.group_invite_request,
        addGroupApplication: config.add_group_application,
        groupAdminChange: config.group_admin_change,
        friendNumberChange: config.friend_number_change,
        groupNumberChange: config.group_number_change,
        groupMemberNumberChange: config.group_member_number_change,
        botBeenBanned: config.bot_been_banned,
        msgSaveDeltime: config.msg_save_deltime,
        notificationsAll: config.notifications_all
    };
};
const key = (scope = 'default') => createStoreKey('notice-settings', `${scope}.json`);
const read = async (scope = 'default') => {
    const raw = await getRedis().get(key(scope));
    const defaults = getDefaultNoticeSettings();
    if (!raw)
        return defaults;
    try {
        const parsed = JSON.parse(raw);
        return { ...defaults, ...parsed };
    }
    catch {
        return defaults;
    }
};
const write = async (settings, scope = 'default') => {
    await getRedis().set(key(scope), JSON.stringify(settings));
};
const getNoticeSettings = read;
const setNoticeSettings = async (settings, scope = 'default') => {
    const next = { ...(await read(scope)), ...settings };
    await write(next, scope);
    return next;
};
const setNoticeSetting = async (name, value) => {
    const mapped = noticeKeyMap[name];
    if (!mapped)
        return `未知通知项：${name}`;
    const settings = await read();
    if (mapped === 'notificationsAll') {
        const enabled = Boolean(value);
        for (const keyName of Object.keys(getDefaultNoticeSettings())) {
            if (keyName !== 'msgSaveDeltime')
                settings[keyName] = enabled;
        }
        settings.notificationsAll = enabled;
        await write(settings);
        return `已${enabled ? '开启' : '关闭'}全部通知。`;
    }
    if (mapped === 'msgSaveDeltime') {
        const seconds = Number(value);
        if (!Number.isSafeInteger(seconds) || seconds < 120)
            return '删除缓存时间不能小于120秒。';
        settings.msgSaveDeltime = seconds;
        await write(settings);
        return `已设置删除缓存时间为 ${seconds} 秒。`;
    }
    settings[mapped] = Boolean(value);
    await write(settings);
    return `已${value ? '开启' : '关闭'}${name}。`;
};
const formatNoticeSettings = (settings) => {
    const labelByKey = Object.entries(noticeKeyMap)
        .filter(([, value]) => value !== 'notificationsAll' && value !== 'msgSaveDeltime');
    return [
        '管理设置通知',
        ...labelByKey.map(([label, settingKey]) => `${label}: ${settings[settingKey] ? '开启' : '关闭'}`),
        `通知全部主人: ${settings.notificationsAll ? '开启' : '关闭'}`,
        `删除缓存时间: ${settings.msgSaveDeltime}秒`,
        '',
        '用法：#管理设置通知群撤回开启 / #管理设置通知全部关闭 / #管理设置通知删除缓存时间300秒'
    ].join('\n');
};

export { formatNoticeSettings, getDefaultNoticeSettings, getNoticeSettings, noticeKeyMap, setNoticeSetting, setNoticeSettings };
