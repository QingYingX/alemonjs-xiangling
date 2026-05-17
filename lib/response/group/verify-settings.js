import { useEvent, useMessage, Format, useMention } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberList, normalizeGroupMemberInfo } from '../../adapter/onebot.js';
import { getEventGroupId, toSafeInteger } from '../../model/group/admin.js';
import { getGroupUserActivity } from '../../model/admin/stats.js';
import { applyLocalActivity, getNeverSpeakMembers } from '../../model/group/activity.js';
import { getVerifyConfig, getVerifyMode, isVerifyGroup, setVerifyGroup, setVerifyMode, setVerifyTimeout, getVerifyState, deleteVerifyState, buildVerifyState, saveVerifyState } from '../../model/group/verify.js';
import { recallVerifyMsgs, sendVerifySuccess, sendVerifyPrompt, finishVerifyWithKick, sendGroupAtText, getMessageId } from './verify-message.js';

const verifyTimers = new Map();
const verifyTimerKey = (groupId, userId) => `${groupId}:${userId}`;
const clearVerifyTimer = (groupId, userId) => {
    const key = verifyTimerKey(groupId, userId);
    const timers = verifyTimers.get(key);
    if (!timers)
        return;
    if (timers.kick)
        clearTimeout(timers.kick);
    if (timers.remind)
        clearTimeout(timers.remind);
    verifyTimers.delete(key);
};
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const send = async (text) => {
    const [message] = useMessage();
    await message.send({ format: Format.create().addText(text) });
};
const startVerify = async (event, groupId, userId) => {
    const config = await getVerifyConfig();
    clearVerifyTimer(groupId, userId);
    if (config.delayTime > 0) {
        await sleep(config.delayTime * 1000);
    }
    let state = await buildVerifyState(groupId, userId);
    const verifyMsgId = await sendVerifyPrompt(event, state, config.time);
    state = await saveVerifyState({ ...state, verifyMsgId });
    const key = verifyTimerKey(groupId, userId);
    const timers = {};
    timers.kick = setTimeout(async () => {
        verifyTimers.delete(key);
        const current = await getVerifyState(groupId, userId);
        if (!current)
            return;
        await recallVerifyMsgs(event, current);
        await finishVerifyWithKick(event, current.groupId, current.userId, '验证超时，移出群聊，请重新申请');
    }, config.time * 1000);
    if (config.remindAtLastMinute && config.time >= 120) {
        timers.remind = setTimeout(async () => {
            const current = await getVerifyState(groupId, userId);
            if (!current)
                return;
            const recentlyFailed = current.lastFailAt && Date.now() - current.lastFailAt <= 60 * 1000;
            if (recentlyFailed)
                return;
            await recallVerifyMsgs(event, current);
            const result = await sendGroupAtText(event, groupId, userId, `验证仅剩最后一分钟\n请发送${current.questionText}\n否则将会被移出群聊`);
            await saveVerifyState({ ...current, verifyMsgId: null, failMsgId: null, remindMsgId: getMessageId(result) });
        }, Math.max(0, config.time * 1000 - 60 * 1000));
    }
    verifyTimers.set(key, timers);
    return state;
};
const parseTarget = async () => {
    const [event] = useEvent();
    const [mention] = useMention();
    const mentioned = await mention.findOne();
    return toSafeInteger(mentioned.data?.UserId) ?? toSafeInteger((event.current.MessageText || '').match(/\d{5,}/)?.[0]);
};
var verifySettings = async () => {
    const [event] = useEvent();
    const groupId = getEventGroupId(event.current);
    const text = event.current.MessageText || '';
    if (!groupId) {
        await send('入群验证只能在群聊中设置。');
        return false;
    }
    if (/^\s*[#＃!！]?(查看验证|验证状态)$/.test(text)) {
        const config = await getVerifyConfig();
        const mode = await getVerifyMode(groupId);
        const enabled = await isVerifyGroup(groupId);
        const enabledGroups = Object.keys(config.enabledGroups);
        await send([
            `本群验证：${enabled ? '已开启' : '未开启'}`,
            `本群模式：${mode}`,
            `超时时间：${config.time} 秒`,
            `尝试次数：${config.times} 次`,
            `计算范围：${config.range.min} - ${config.range.max}`,
            `已开启群数：${enabledGroups.length}`,
            enabledGroups.length ? `已开启群：${enabledGroups.join('、')}` : ''
        ].filter(Boolean).join('\n'));
        return false;
    }
    if (/^\s*[#＃!！]?(开启|关闭)验证$/.test(text)) {
        const enabled = /开启/.test(text);
        const result = await setVerifyGroup(groupId, enabled);
        await send(result.changed ? `已${enabled ? '开启' : '关闭'}本群验证。` : `本群验证已处于${enabled ? '开启' : '关闭'}状态。`);
        return false;
    }
    if (/^\s*[#＃!！]?(切换验证模式|设置验证模式)/.test(text)) {
        if (!await isVerifyGroup(groupId)) {
            await send('当前群未开启验证，请先发送 #开启验证。');
            return false;
        }
        const explicit = text.match(/设置验证模式(计算|提交)/)?.[1];
        const mode = explicit ?? (await getVerifyMode(groupId) === '提交' ? '计算' : '提交');
        await setVerifyMode(groupId, mode);
        await send(`已将本群验证模式切换为${mode}验证。`);
        return false;
    }
    if (/^\s*[#＃!！]?设置验证超时时间/.test(text)) {
        const seconds = toSafeInteger(text.match(/\d+/)?.[0]);
        if (!seconds) {
            await send('请使用：#设置验证超时时间 <秒>');
            return false;
        }
        await setVerifyTimeout(seconds);
        await send(`已将验证超时时间设置为${seconds}秒。`);
        return false;
    }
    if (/^\s*[#＃!！]?绕过验证/.test(text)) {
        const userId = await parseTarget();
        if (!userId) {
            await send('请艾特或输入需要绕过验证的 QQ。');
            return false;
        }
        const state = await getVerifyState(groupId, userId);
        if (!state) {
            await send('目标群成员当前无需验证。');
            return false;
        }
        clearVerifyTimer(groupId, userId);
        await recallVerifyMsgs(event.current, state);
        await deleteVerifyState(groupId, userId);
        await sendVerifySuccess(event.current, groupId, userId);
        return false;
    }
    if (/^\s*[#＃!！]?重新验证从未发言的人/.test(text)) {
        if (!await isVerifyGroup(groupId)) {
            await send('当前群未开启验证。');
            return false;
        }
        const [client] = useClient(event.current);
        const rawMembers = await client.getGroupMemberList({ group_id: groupId });
        const localActivity = await getGroupUserActivity(groupId);
        const members = applyLocalActivity(normalizeGroupMemberList(rawMembers), localActivity);
        const targets = getNeverSpeakMembers(members).slice(0, 30);
        if (!targets.length) {
            await send('本群暂无可重新验证的从未发言成员。');
            return false;
        }
        let success = 0;
        const failed = [];
        for (const member of targets) {
            try {
                await startVerify(event.current, groupId, Number(member.user_id));
                success += 1;
            }
            catch (error) {
                failed.push(`${member.user_id}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        await send([
            `已对从未发言成员发起重新验证。`,
            `成功：${success}`,
            `本次最多处理：30 人`,
            failed.length ? `失败：\n${failed.join('\n')}` : ''
        ].filter(Boolean).join('\n'));
        return false;
    }
    if (/^\s*[#＃!！]?重新验证/.test(text)) {
        if (!await isVerifyGroup(groupId)) {
            await send('当前群未开启验证。');
            return false;
        }
        const userId = await parseTarget();
        if (!userId) {
            await send('请艾特或输入需要重新验证的 QQ。');
            return false;
        }
        const [client] = useClient(event.current);
        const info = normalizeGroupMemberInfo(await client.getGroupMemberInfo({ group_id: groupId, user_id: userId, no_cache: false }));
        if (!info) {
            await send('目标群成员不存在，或 OneBot 未返回成员信息。');
            return false;
        }
        if (info.role === 'owner' || info.role === 'admin') {
            await send('该命令对群主或管理员无效。');
            return false;
        }
        await startVerify(event.current, groupId, userId);
        return false;
    }
    await send('入群验证命令：#查看验证 / #开启验证 / #关闭验证 / #重新验证 @QQ / #绕过验证 @QQ / #设置验证超时时间 <秒>');
    return false;
};

export { clearVerifyTimer, verifySettings as default, startVerify };
