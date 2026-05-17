import { useEvent, useMessage, logger, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getBannedWordsConfig, findTriggeredBannedWord, penaltyTypeLabels, maskWord } from '../../model/group/banned-words.js';
import { getEventGroupId, toSafeInteger } from '../../model/group/admin.js';
import { isInList, updateList } from '../../model/group/lists.js';

const isCommandLike = (text) => /^[#＃!！/]/.test(text.trim());
const shouldMute = (penalty) => penalty === 'mute' || penalty === 'muteRecall';
const shouldKick = (penalty) => penalty === 'kick' || penalty === 'kickRecall' || penalty === 'kickBlack';
const shouldRecall = (penalty) => penalty === 'recall' || penalty === 'muteRecall' || penalty === 'kickRecall';
var bannedWordsGuard = async (_event, next) => {
    const [event] = useEvent();
    const groupId = getEventGroupId(event.current);
    const userId = toSafeInteger(event.current.UserId);
    const text = event.current.MessageText || '';
    if (!groupId || !userId || !text || isCommandLike(text) || event.current.IsMaster) {
        await next?.();
        return;
    }
    if (await isInList('white', userId)) {
        await next?.();
        return;
    }
    const config = await getBannedWordsConfig(groupId);
    const matched = findTriggeredBannedWord(config, text.trim());
    if (!matched) {
        await next?.();
        return;
    }
    const [message] = useMessage();
    const [client] = useClient(event.current);
    const actions = [];
    try {
        if (shouldRecall(matched.penaltyType) && event.current.MessageId) {
            await client.deleteMsg({ message_id: Number(event.current.MessageId) });
            actions.push('撤回消息');
        }
        if (shouldMute(matched.penaltyType)) {
            await client.setGroupBan({ group_id: groupId, user_id: userId, duration: config.muteTime });
            actions.push(`禁言${config.muteTime}秒`);
        }
        if (matched.penaltyType === 'kickBlack') {
            await updateList('black', userId, 'add');
            actions.push('加入黑名单');
        }
        if (shouldKick(matched.penaltyType)) {
            await client.setGroupKick({ group_id: groupId, user_id: userId, reject_add_request: matched.penaltyType === 'kickBlack' });
            actions.push('踢出群聊');
        }
    }
    catch (error) {
        logger.warn(`banned word punishment failed: ${error instanceof Error ? error.message : String(error)}`);
        actions.push('部分处罚失败，请检查 Bot 权限');
    }
    await message.send({
        format: Format.create().addText([
            `触发违禁词：${maskWord(matched.word)}`,
            `触发者：${event.current.UserName || userId}(${userId})`,
            `处理方式：${penaltyTypeLabels[matched.penaltyType]}`,
            `执行：${actions.join('，') || '无'}`
        ].join('\n'))
    });
    return false;
};

export { bannedWordsGuard as default };
