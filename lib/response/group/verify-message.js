import { logger } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberInfo } from '../../adapter/onebot.js';
import { deleteVerifyState, markVerifyKick } from '../../model/group/verify.js';
import { getWelcomeConfig, getWelcomeLines } from '../../model/group/welcome.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const getMessageId = (result) => {
    if (typeof result === 'number' || typeof result === 'string') {
        const number = Number(result);
        return Number.isSafeInteger(number) ? number : null;
    }
    if (!result || typeof result !== 'object')
        return null;
    if (Array.isArray(result)) {
        for (const item of result) {
            const id = getMessageId(item);
            if (id !== null)
                return id;
        }
        return null;
    }
    const value = result;
    for (const key of ['message_id', 'messageId', 'messageID', 'MessageId']) {
        const id = getMessageId(value[key]);
        if (id !== null)
            return id;
    }
    for (const key of ['data', 'result', 'value', 'raw']) {
        const id = getMessageId(value[key]);
        if (id !== null)
            return id;
    }
    return null;
};
const sendGroupMessage = async (event, groupId, message) => {
    const [client] = useClient(event);
    return client.sendGroupMessage({ group_id: groupId, message });
};
const sendGroupAtText = async (event, groupId, userId, text) => {
    return sendGroupMessage(event, groupId, [
        { type: 'at', data: { qq: userId } },
        { type: 'text', data: { text: `\n${text}` } }
    ]);
};
const sendVerifyPrompt = async (event, state, seconds) => {
    const result = await sendGroupAtText(event, state.groupId, state.userId, `欢迎！\n请在「${seconds}」秒内发送\n${state.questionText}\n否则将会被移出群聊`);
    const messageId = getMessageId(result);
    if (!messageId) {
        logger.warn(`xiangling verify prompt missing message id: ${JSON.stringify(result)?.slice(0, 500)}`);
    }
    return messageId;
};
const sendVerifyFailPrompt = async (event, state) => {
    const result = await sendGroupAtText(event, state.groupId, state.userId, `❎ 验证失败\n你还有「${state.remainTimes}」次机会\n请发送${state.questionText}`);
    const messageId = getMessageId(result);
    if (!messageId) {
        logger.warn(`xiangling verify fail prompt missing message id: ${JSON.stringify(result)?.slice(0, 500)}`);
    }
    return messageId;
};
const sendVerifySuccess = async (event, groupId, userId) => {
    const successText = '✅ 验证成功，欢迎入群';
    const welcomeConfig = await getWelcomeConfig(groupId);
    const text = welcomeConfig.enabled
        ? `${successText}\n${getWelcomeLines(welcomeConfig, 'welcome').join('\n')}`
        : successText;
    return sendGroupAtText(event, groupId, userId, text);
};
const recallMsg = async (event, messageId) => {
    if (!messageId)
        return false;
    try {
        const [client] = useClient(event);
        await client.deleteMsg({ message_id: messageId });
        return true;
    }
    catch (error) {
        logger.warn(`xiangling verify recall failed: message=${messageId} error=${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
};
const recallVerifyMsgs = async (event, state) => {
    await recallMsg(event, state?.failMsgId);
    await recallMsg(event, state?.remindMsgId);
    await recallMsg(event, state?.verifyMsgId);
};
const recallLastVerifyPrompt = async (event, state) => {
    if (state.failMsgId) {
        await recallMsg(event, state.failMsgId);
        return { ...state, failMsgId: null };
    }
    if (state.remindMsgId) {
        await recallMsg(event, state.remindMsgId);
        return { ...state, remindMsgId: null };
    }
    if (state.verifyMsgId) {
        await recallMsg(event, state.verifyMsgId);
        return { ...state, verifyMsgId: null };
    }
    return state;
};
const isGroupMember = async (event, groupId, userId) => {
    try {
        const [client] = useClient(event);
        const info = normalizeGroupMemberInfo(await client.getGroupMemberInfo({ group_id: groupId, user_id: userId, no_cache: false }));
        return Boolean(info);
    }
    catch {
        return false;
    }
};
const finishVerifyWithKick = async (event, groupId, userId, text) => {
    if (!await isGroupMember(event, groupId, userId)) {
        await deleteVerifyState(groupId, userId);
        return false;
    }
    await sendGroupAtText(event, groupId, userId, text);
    await markVerifyKick(groupId, userId);
    await deleteVerifyState(groupId, userId);
    await sleep(5000);
    if (!await isGroupMember(event, groupId, userId))
        return false;
    const [client] = useClient(event);
    await client.setGroupKick({ group_id: groupId, user_id: userId, reject_add_request: false });
    return true;
};

export { finishVerifyWithKick, getMessageId, isGroupMember, recallLastVerifyPrompt, recallMsg, recallVerifyMsgs, sendGroupAtText, sendVerifyFailPrompt, sendVerifyPrompt, sendVerifySuccess };
