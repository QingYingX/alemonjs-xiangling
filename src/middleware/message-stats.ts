import { logger, useEvent } from 'alemonjs';
import { recordMessageStats } from '../model/admin/stats';

export default async (_event: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent<'message.create' | 'private.message.create'>();
  const current = event.current;

  try {
    const userId = current.UserId;
    const groupId = 'GuildId' in current ? current.GuildId : undefined;
    const botId = (current.value as { self_id?: string | number } | undefined)?.self_id;
    const time = Number((current.value as { time?: number } | undefined)?.time) || Math.floor(Date.now() / 1000);

    await recordMessageStats({ userId, groupId, botId, time });
  } catch (error) {
    logger.warn(`xiangling record message stats failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  await next?.();
};
