import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getRawArgs } from '../../model/group/admin';
import { parseIdAndText } from '../../model/group/tools';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const target = parseIdAndText(getRawArgs(event.current));

  if (!target) {
    await message.send({ format: Format.create().addText('请使用：#发群聊 <群号> <消息>') });
    return;
  }

  const [client] = useClient(event.current);
  await client.sendGroupMessage({ group_id: target.id, message: [{ type: 'text', data: { text: target.text } }] });
  await message.send({ format: Format.create().addText(`已向群 ${target.id} 发送消息。`) });
};
