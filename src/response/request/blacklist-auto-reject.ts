import { useEvent } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { isInList } from '../../model/group/lists';

export default async (_event: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent<'private.guild.add'>();
  if (event.current.name !== 'private.guild.add') {
    await next?.();
    return;
  }

  const raw = event.current.value ?? {};
  if (raw.post_type !== 'request' || raw.request_type !== 'group') {
    await next?.();
    return;
  }

  const userId = String(raw.user_id ?? event.current.UserId ?? '').trim();
  const flag = String(raw.flag ?? event.current.MessageId ?? '').trim();
  const subType = String(raw.sub_type ?? 'add');

  if (userId && flag && await isInList('black', userId)) {
    try {
      const [client] = useClient(event.current);
      await client.setGroupAddRequest({ flag, sub_type: subType, approve: false, reason: '黑名单用户' });
      logger.info(`xiangling rejected blacklisted group request: ${userId}`);
    } catch (error) {
      logger.warn(`reject blacklisted group request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    return false;
  }

  await next?.();
};
