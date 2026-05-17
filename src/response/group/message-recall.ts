import { Format, logger, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { parseMessageIdArg } from '../../model/group/admin';
import { getRecallPermissionConfig, hasRecallPermission } from '../../model/group/recall-permission';

export default async () => {
  const [event] = useEvent<'message.create' | 'private.message.create'>();
  const [message] = useMessage();
  const messageId = parseMessageIdArg(event.current);

  if (!messageId) {
    await message.send({ format: Format.create().addText('请引用要撤回的消息后发送：#撤回，或使用：#撤回 <消息ID>') });
    return;
  }

  const [client] = useClient(event.current);
  const settings = await getRecallPermissionConfig();
  let isBotMessage = false;

  try {
    const raw = await client.getMsg({ message_id: messageId });
    const senderId = String(raw?.sender?.user_id ?? raw?.data?.sender?.user_id ?? '').trim();
    isBotMessage = Boolean(event.current.BotId && senderId && senderId === String(event.current.BotId));
  } catch (error) {
    logger.warn(`get recall target message failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  const level = isBotMessage ? settings.bot : settings.member;
  if (!await hasRecallPermission(event.current, level)) {
    await message.send({ format: Format.create().addText(`撤回${isBotMessage ? '机器人' : '群员'}消息需要 ${level} 权限。`) });
    return;
  }

  await client.deleteMsg({ message_id: messageId });
  await message.send({ format: Format.create().addText(`已请求撤回消息 ${messageId}。`) });
};
