import { logger, useEvent } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getBotJoinText, getKickText, getWelcomeConfig, getWelcomeLines, isWelcomeCooldown, setWelcomeCooldown } from '../../model/group/welcome';
import { getEventGroupId, toSafeInteger } from '../../model/group/admin';
import { isInList } from '../../model/group/lists';
import { consumeVerifyKick, shouldVerifyJoin } from '../../model/group/verify';

const formatUser = (userId: number, name?: string): string => name ? `${name}(${userId})` : String(userId);

type OneBotMessageSegment = {
  type: string;
  data: Record<string, unknown>;
};

const sendWelcomeMessage = async (
  event: ReturnType<typeof useEvent<'member.add' | 'member.remove'>>[0]['current'],
  groupId: number,
  message: OneBotMessageSegment[]
) => {
  const [client] = useClient(event);
  const result = await client.sendGroupMessage({
    group_id: groupId,
    message
  });
  if (!result) {
    logger.warn(`welcome event send returned empty result: group=${groupId}`);
  }
};

const sendWelcomeText = async (
  event: ReturnType<typeof useEvent<'member.add' | 'member.remove'>>[0]['current'],
  groupId: number,
  content: string
) => {
  await sendWelcomeMessage(event, groupId, [{ type: 'text', data: { text: content } }]);
};

const sendWelcomeWithAt = async (
  event: ReturnType<typeof useEvent<'member.add' | 'member.remove'>>[0]['current'],
  groupId: number,
  userId: number,
  content: string
) => {
  await sendWelcomeMessage(event, groupId, [
    { type: 'at', data: { qq: userId } },
    { type: 'text', data: { text: `\n${content}` } }
  ]);
};

export default async () => {
  const [event] = useEvent<'member.add' | 'member.remove'>();
  const groupId = getEventGroupId(event.current);
  const userId = toSafeInteger(event.current.UserId);
  if (!groupId || !userId) {
    logger.warn(`welcome event missing group/user: ${event.current.name} group=${event.current.GuildId || event.current.ChannelId || ''} user=${event.current.UserId || ''}`);
    return;
  }

  logger.info(`xiangling welcome event: ${event.current.name} group=${groupId} user=${userId}`);

  const config = await getWelcomeConfig(groupId);
  if (!config.enabled) return;

  if (event.current.name === 'member.add') {
    if (event.current.BotId && String(userId) === String(event.current.BotId)) {
      await sendWelcomeText(event.current, groupId, getBotJoinText());
      return;
    }
    if (await isInList('black', userId)) return;
    if ((event.current as typeof event.current & { __xianglingVerifyStarted?: boolean }).__xianglingVerifyStarted) return;
    if (await shouldVerifyJoin(event.current, groupId, userId)) return;
    if (await isWelcomeCooldown(groupId)) return;
    await setWelcomeCooldown(groupId, config.welcomeCooldown);
    const lines = getWelcomeLines(config, 'welcome');
    await sendWelcomeWithAt(event.current, groupId, userId, lines.join('\n'));
    return;
  }

  const raw = event.current.value ?? {};
  const operatorId = toSafeInteger(raw.operator_id);
  const subType = String(raw.sub_type ?? '');
  const isKick = subType === 'kick' || subType === 'kick_me' || Boolean(operatorId && operatorId !== userId);
  if (await consumeVerifyKick(groupId, userId)) return;
  const userText = formatUser(userId, event.current.UserName);
  const lines = isKick ? [getKickText()] : getWelcomeLines(config, 'exit');
  await sendWelcomeText(event.current, groupId, `${userText} ${lines.join('\n')}`);
};
