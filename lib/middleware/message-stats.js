import { useEvent, logger } from 'alemonjs';
import { recordMessageStats } from '../model/admin/stats.js';

var messageStats = async (_event, next) => {
    const [event] = useEvent();
    const current = event.current;
    try {
        const userId = current.UserId;
        const groupId = 'GuildId' in current ? current.GuildId : undefined;
        const botId = current.value?.self_id;
        const time = Number(current.value?.time) || Math.floor(Date.now() / 1000);
        await recordMessageStats({ userId, groupId, botId, time });
    }
    catch (error) {
        logger.warn(`xiangling record message stats failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    await next?.();
};

export { messageStats as default };
