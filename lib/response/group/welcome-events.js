import { useEvent, logger } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getWelcomeConfig, getBotJoinText, isWelcomeCooldown, setWelcomeCooldown, getWelcomeLines, getKickText } from '../../model/group/welcome.js';
import { getEventGroupId, toSafeInteger } from '../../model/group/admin.js';
import { isInList } from '../../model/group/lists.js';
import { shouldVerifyJoin, consumeVerifyKick } from '../../model/group/verify.js';

const formatUser = (userId, name) => name ? `${name}(${userId})` : String(userId);
const sendWelcomeMessage = async (event, groupId, message) => {
    const [client] = useClient(event);
    const result = await client.sendGroupMessage({
        group_id: groupId,
        message
    });
    if (!result) {
        logger.warn(`welcome event send returned empty result: group=${groupId}`);
    }
};
const sendWelcomeText = async (event, groupId, content) => {
    await sendWelcomeMessage(event, groupId, [{ type: 'text', data: { text: content } }]);
};
const sendWelcomeWithAt = async (event, groupId, userId, content) => {
    await sendWelcomeMessage(event, groupId, [
        { type: 'at', data: { qq: userId } },
        { type: 'text', data: { text: `\n${content}` } }
    ]);
};
var welcomeEvents = async () => {
    const [event] = useEvent();
    const groupId = getEventGroupId(event.current);
    const userId = toSafeInteger(event.current.UserId);
    if (!groupId || !userId) {
        logger.warn(`welcome event missing group/user: ${event.current.name} group=${event.current.GuildId || event.current.ChannelId || ''} user=${event.current.UserId || ''}`);
        return;
    }
    logger.info(`xiangling welcome event: ${event.current.name} group=${groupId} user=${userId}`);
    const config = await getWelcomeConfig(groupId);
    if (!config.enabled)
        return;
    if (event.current.name === 'member.add') {
        if (event.current.BotId && String(userId) === String(event.current.BotId)) {
            await sendWelcomeText(event.current, groupId, getBotJoinText());
            return;
        }
        if (await isInList('black', userId))
            return;
        if (event.current.__xianglingVerifyStarted)
            return;
        if (await shouldVerifyJoin(event.current, groupId, userId))
            return;
        if (await isWelcomeCooldown(groupId))
            return;
        await setWelcomeCooldown(groupId, config.welcomeCooldown);
        const lines = getWelcomeLines(config, 'welcome');
        await sendWelcomeWithAt(event.current, groupId, userId, lines.join('\n'));
        return;
    }
    const raw = event.current.value ?? {};
    const operatorId = toSafeInteger(raw.operator_id);
    const subType = String(raw.sub_type ?? '');
    const isKick = subType === 'kick' || subType === 'kick_me' || Boolean(operatorId && operatorId !== userId);
    if (await consumeVerifyKick(groupId, userId))
        return;
    const userText = formatUser(userId, event.current.UserName);
    const lines = isKick ? [getKickText()] : getWelcomeLines(config, 'exit');
    await sendWelcomeText(event.current, groupId, `${userText} ${lines.join('\n')}`);
};

export { welcomeEvents as default };
