import { useEvent, logger } from 'alemonjs';
import { saveRequest } from '../../model/admin/requests.js';

var record = async (_event, next) => {
    const [event] = useEvent();
    if (event.current.name !== 'private.friend.add' && event.current.name !== 'private.guild.add') {
        await next?.();
        return;
    }
    const raw = event.current.value ?? {};
    if (raw.post_type !== 'request' || (raw.request_type !== 'friend' && raw.request_type !== 'group')) {
        await next?.();
        return;
    }
    const kind = event.current.name === 'private.friend.add' ? 'friend' : 'group';
    const record = await saveRequest(event.current, kind);
    if (record) {
        logger.info(`xiangling recorded ${kind} request: ${record.userId}${record.groupId ? ` -> ${record.groupId}` : ''}`);
    }
};

export { record as default };
