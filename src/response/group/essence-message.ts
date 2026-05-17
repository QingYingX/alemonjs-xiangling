import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getEventGroupId, parseMessageIdArg } from '../../model/group/admin';
import { hasBotGroupAdminPermission } from '../../model/group/permissions';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const messageId = parseMessageIdArg(event.current);
  const isAdd = /加精|设精/.test(event.current.MessageText || '');

  if (!messageId) {
    await message.send({ format: Format.create().addText('请引用目标消息后发送：#加精 / #移精，或使用：#加精 <消息ID>') });
    return;
  }

  const groupId = getEventGroupId(event.current);
  if (groupId && !await hasBotGroupAdminPermission(event.current, groupId)) {
    await message.send({ format: Format.create().addText('Bot 权限不足，需要管理员权限。') });
    return;
  }

  const [client] = useClient(event.current);
  if (isAdd) {
    await client.setEssenceMsg({ message_id: messageId });
  } else {
    await client.deleteEssenceMsg({ message_id: messageId });
  }

  await message.send({ format: Format.create().addText(`已${isAdd ? '设置' : '移除'}精华消息 ${messageId}。`) });
};
