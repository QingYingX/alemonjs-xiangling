import { Format, useEvent, useMention, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getBannedWordsConfig } from '../../model/group/banned-words';
import { parseSelfTitleArgs, parseTitleArgs, toSafeInteger } from '../../model/group/admin';
import { getGroupMemberRole } from '../../model/group/permissions';

const sendText = async (text: string) => {
  const [message] = useMessage();
  await message.send({ format: Format.create().addText(text) });
};

const isTitleBlocked = async (groupId: number, title: string): Promise<boolean> => {
  const config = await getBannedWordsConfig(groupId);
  if (!config.titleWords.length) return false;

  if (!config.titleExactMode) {
    return config.titleWords.includes(title);
  }

  return config.titleWords.some(word => {
    try {
      return new RegExp(word).test(title);
    } catch {
      return false;
    }
  });
};

const resolveBotId = async (client: ReturnType<typeof useClient>[0], event: ReturnType<typeof useEvent>[0]['current']): Promise<number | null> => {
  const eventBotId = toSafeInteger(event.BotId);
  if (eventBotId) return eventBotId;
  try {
    const login = await client.getLoginInfo();
    return toSafeInteger(login?.user_id ?? login?.userId ?? login?.self_id ?? login?.selfId);
  } catch {
    return null;
  }
};

export default async () => {
  const [event] = useEvent();
  const [mention] = useMention();
  const mentioned = await mention.findOne();
  const isSelfApply = /(申请|我要)头衔/.test(event.current.MessageText || '');
  const target = isSelfApply ? parseSelfTitleArgs(event.current) : parseTitleArgs(event.current, mentioned.data?.UserId);

  if (!target) {
    const usage = isSelfApply
      ? '请在群内使用：#申请头衔 <头衔>'
      : '请在群内使用：#设置头衔 @用户 <头衔>，或私聊使用：#设置头衔 <群号> <QQ> <头衔>';
    await sendText(usage);
    return;
  }

  const [client] = useClient(event.current);
  const botId = await resolveBotId(client, event.current);
  if (botId) {
    const botRole = await getGroupMemberRole(event.current, target.groupId, botId);
    if (botRole && botRole !== 'owner') {
      await sendText('Bot 权限不足，需要群主权限才能设置专属头衔。');
      return;
    }
  }

  if (isSelfApply && !event.current.IsMaster && await isTitleBlocked(target.groupId, target.text)) {
    await sendText('包含头衔屏蔽词。');
    return;
  }

  try {
    await client.setGroupSpecialTitle({ group_id: target.groupId, user_id: target.userId, special_title: target.text, duration: -1 });
    await sendText(isSelfApply ? `已将你的头衔更换为「${target.text}」。` : `已将 ${target.userId} 的头衔修改为「${target.text}」。`);
  } catch (error) {
    await sendText(`设置头衔失败：${error instanceof Error ? error.message : String(error)}`);
  }
};
