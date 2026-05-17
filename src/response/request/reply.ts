import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getRawArgs, toSafeInteger } from '../../model/group/admin';

export default async () => {
  const [event] = useEvent<'message.create' | 'private.message.create'>();
  const [message] = useMessage();
  const args = getRawArgs(event.current);
  const userId = toSafeInteger(args[0]);
  const text = args.slice(1).join(' ').trim();

  if (!userId || !text) {
    await message.send({ format: Format.create().addText('请使用：#回复 <QQ> <消息>') });
    return false;
  }

  const [client] = useClient(event.current);
  await client.sendPrivateMessage({ user_id: userId, message: [{ type: 'text', data: { text } }] });
  await message.send({ format: Format.create().addText('已回复 ' + userId + '。') });
  return false;
};
