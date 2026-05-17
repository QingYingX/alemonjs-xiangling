import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { findRequest, removeRequest } from '../../model/admin/requests';
import { getEventGroupId, getRawArgs } from '../../model/group/admin';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const approve = /同意/.test(event.current.MessageText || '');
  const keyword = getRawArgs(event.current)[0];
  const groupId = getEventGroupId(event.current);

  if (!keyword) {
    await message.send({ format: Format.create().addText('请使用：#同意加群申请 <QQ/群号/flag> / #拒绝群邀请 <QQ/群号/flag>') });
    return;
  }

  const record = await findRequest('group', keyword);
  if (!record) {
    await message.send({ format: Format.create().addText('没有找到对应的群申请或群邀请记录。') });
    return;
  }
  if (!event.current.IsMaster && groupId && record.groupId !== String(groupId)) {
    await message.send({ format: Format.create().addText('只能处理当前群的加群申请。') });
    return;
  }

  const [client] = useClient(event.current);
  await client.setGroupAddRequest({ flag: record.flag, sub_type: record.subType || 'add', approve });
  await removeRequest('group', record.flag);
  await message.send({ format: Format.create().addText(`已${approve ? '同意' : '拒绝'} ${record.userId}${record.groupId ? ` 在群 ${record.groupId}` : ''} 的请求。`) });
};
