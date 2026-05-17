import { logger, useEvent } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getEventGroupId, toSafeInteger } from '../../model/group/admin';
import { getGroupLists } from '../../model/group/lists';

const sendGroupText = async (
  event: ReturnType<typeof useEvent<'member.add' | 'member.ban'>>[0]['current'],
  groupId: number,
  text: string
) => {
  const [client] = useClient(event);
  const result = await client.sendGroupMessage({
    group_id: groupId,
    message: [{ type: 'text', data: { text } }]
  });
  if (!result) {
    logger.warn(`list event send returned empty result: group=${groupId}`);
  }
};

export default async (_event?: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent<'member.add' | 'member.ban'>();
  const groupId = getEventGroupId(event.current);
  const userId = toSafeInteger(event.current.UserId);
  if (!groupId || !userId) {
    await next?.();
    return;
  }

  const lists = await getGroupLists();
  const userIdText = String(userId);

  if (event.current.name === 'member.add' && lists.black.includes(userIdText)) {
    const [client] = useClient(event.current);
    try {
      await client.setGroupKick({ group_id: groupId, user_id: userId, reject_add_request: true });
      await sendGroupText(event.current, groupId, `检测到黑名单 QQ(${userId}) 入群，已自动踢出。`);
    } catch (error) {
      logger.warn(`auto kick blacklisted member failed: ${error instanceof Error ? error.message : String(error)}`);
      await sendGroupText(event.current, groupId, `检测到黑名单 QQ(${userId}) 入群，但踢出失败，请手动处理。`);
    }
    return false;
  }

  if (event.current.name === 'member.ban' && lists.whiteAutoUnban && lists.white.includes(userIdText)) {
    const [client] = useClient(event.current);
    try {
      await client.setGroupBan({ group_id: groupId, user_id: userId, duration: 0 });
      await sendGroupText(event.current, groupId, `已解除白名单用户 QQ(${userId}) 的禁言。`);
    } catch (error) {
      logger.warn(`auto unban whitelisted member failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await next?.();
};
