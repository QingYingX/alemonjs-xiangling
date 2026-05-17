import { useEvent, logger } from 'alemonjs';
import { buildSnapshotFromEvent, saveMessageSnapshot, recordRecall } from '../model/admin/recall.js';

var recallRecorder = async (_event, next) => {
    const [event] = useEvent();
    const current = event.current;
    try {
        if (current.name === 'message.create' || current.name === 'private.message.create') {
            const snapshot = buildSnapshotFromEvent(current);
            if (snapshot)
                await saveMessageSnapshot(snapshot);
        }
        else if (current.name === 'message.delete' || current.name === 'private.message.delete') {
            const rawValue = current.value;
            await recordRecall({
                messageId: current.MessageId,
                scope: current.name === 'message.delete' ? 'group' : 'private',
                groupId: 'GuildId' in current ? current.GuildId : rawValue?.group_id,
                operatorId: rawValue?.operator_id,
                fallbackUserId: rawValue?.user_id
            });
        }
    }
    catch (error) {
        logger.warn(`xiangling record recall failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    await next?.();
};

export { recallRecorder as default };
