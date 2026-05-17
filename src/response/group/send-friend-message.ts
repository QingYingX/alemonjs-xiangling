import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getRawArgs } from '../../model/group/admin';
import { parseIdAndText } from '../../model/group/tools';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const target = parseIdAndText(getRawArgs(event.current));

  if (!target) {
    await message.send({ format: Format.create().addText('请使用：#发好友 <QQ> <消息>') });
    return;
  }

  const [client] = useClient(event.current);
  await client.sendPrivateMessage({ user_id: target.id, message: [{ type: 'text', data: { text: target.text } }] });
  await message.send({ format: Format.create().addText(`已向好友 ${target.id} 发送消息。`) });
};
