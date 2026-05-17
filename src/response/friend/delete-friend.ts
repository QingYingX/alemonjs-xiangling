import { Format, useEvent, useMention, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { deleteFriend, normalizeFriendList } from '../../adapter/onebot';
import { getRawArgs, toSafeInteger } from '../../model/group/admin';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const [mention] = useMention();
  const mentioned = await mention.findOne();
  const userId = toSafeInteger(mentioned.data?.UserId) ?? toSafeInteger(getRawArgs(event.current)[0]);

  if (!userId) {
    await message.send({ format: Format.create().addText('请使用：#删好友 <QQ>') });
    return;
  }

  const [client] = useClient(event.current);
  const friends = normalizeFriendList(await client.getFriendList());
  if (friends.length && !friends.some(friend => Number(friend.user_id) === userId)) {
    await message.send({ format: Format.create().addText('好友列表查无此人。') });
    return;
  }

  await deleteFriend(event.current, userId);
  await message.send({ format: Format.create().addText(`已尝试删除好友 ${userId}。`) });
};
