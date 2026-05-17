import { useEvent, logger } from 'alemonjs';
import { extractAtUserIds, extractRawMessageText, recordWhoAt } from '../model/group/who-at.js';

var whoAtRecorder = async (_event, next) => {
    const [event] = useEvent();
    try {
        const current = event.current;
        const rawMessage = current.value?.message;
        const atUserIds = extractAtUserIds(rawMessage);
        if (atUserIds.length && current.GuildId && current.UserId) {
            const text = extractRawMessageText(rawMessage);
            const record = {
                userId: String(current.UserId),
                senderName: current.UserName || String(current.UserId),
                message: text,
                messageId: String(current.MessageId || ''),
                time: Number(current.value?.time) || Math.floor(Date.now() / 1000)
            };
            await Promise.all(atUserIds.map(userId => recordWhoAt(current.GuildId, userId, record)));
        }
    }
    catch (error) {
        logger.warn(`xiangling record who-at failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    await next?.();
};

export { whoAtRecorder as default };
