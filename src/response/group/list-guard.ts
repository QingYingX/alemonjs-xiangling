import { useEvent } from 'alemonjs';
import { isInList } from '../../model/group/lists';

export default async (_event: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent<'message.create'>();
  const userId = event.current.UserId;

  if (userId && await isInList('black', userId)) {
    logger.debug(`xiangling blocked blacklisted user ${userId}`);
    return false;
  }

  await next?.();
};
