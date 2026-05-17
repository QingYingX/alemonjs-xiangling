import { logger, useEvent } from 'alemonjs';
import { buildSnapshotFromEvent, recordRecall, saveMessageSnapshot } from '../model/admin/recall';

export default async (_event: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent<'message.create' | 'private.message.create' | 'message.delete' | 'private.message.delete'>();
  const current = event.current;

  try {
    if (current.name === 'message.create' || current.name === 'private.message.create') {
      const snapshot = buildSnapshotFromEvent(current);
      if (snapshot) await saveMessageSnapshot(snapshot);
    } else if (current.name === 'message.delete' || current.name === 'private.message.delete') {
      const rawValue = current.value as { operator_id?: string | number; user_id?: string | number; group_id?: string | number } | undefined;
      await recordRecall({
        messageId: current.MessageId,
        scope: current.name === 'message.delete' ? 'group' : 'private',
        groupId: 'GuildId' in current ? current.GuildId : rawValue?.group_id,
        operatorId: rawValue?.operator_id,
        fallbackUserId: rawValue?.user_id
      });
    }
  } catch (error) {
    logger.warn(`xiangling record recall failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  await next?.();
};
