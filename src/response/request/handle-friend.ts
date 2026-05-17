import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { findRequest, removeRequest } from '../../model/admin/requests';
import { getRawArgs } from '../../model/group/admin';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const approve = /同意/.test(event.current.MessageText || '');
  const keyword = getRawArgs(event.current)[0];

  if (!keyword) {
    await message.send({ format: Format.create().addText('请使用：#同意好友申请 <QQ或flag> / #拒绝好友申请 <QQ或flag>') });
    return;
  }

  const record = await findRequest('friend', keyword);
  if (!record) {
    await message.send({ format: Format.create().addText('没有找到对应的好友申请记录。') });
    return;
  }

  const [client] = useClient(event.current);
  await client.setFriendAddRequest({ flag: record.flag, approve });
  await removeRequest('friend', record.flag);
  await message.send({ format: Format.create().addText(`已${approve ? '同意' : '拒绝'} ${record.userId} 的好友申请。`) });
};
