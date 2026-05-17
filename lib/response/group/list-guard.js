import { useEvent } from 'alemonjs';
import { isInList } from '../../model/group/lists.js';

var listGuard = async (_event, next) => {
    const [event] = useEvent();
    const userId = event.current.UserId;
    if (userId && await isInList('black', userId)) {
        logger.debug(`xiangling blocked blacklisted user ${userId}`);
        return false;
    }
    await next?.();
};

export { listGuard as default };
