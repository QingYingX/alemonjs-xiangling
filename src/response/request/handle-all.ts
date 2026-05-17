import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { listRequests, removeRequest } from '../../model/admin/requests';
import { getEventGroupId } from '../../model/group/admin';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const approve = /同意/.test(event.current.MessageText || '');
  const isFriend = /好友/.test(event.current.MessageText || '');
  const groupId = getEventGroupId(event.current);
  const kind = isFriend ? 'friend' : 'group';
  const records = (await listRequests(kind))
    .filter(record => kind === 'friend' || event.current.IsMaster || !groupId || record.groupId === String(groupId));

  if (!records.length) {
    await message.send({ format: Format.create().addText(isFriend ? '暂无好友申请记录。' : '暂无群申请/邀请记录。') });
    return;
  }

  let success = 0;
  let failed = 0;
  const [client] = useClient(event.current);
  for (const record of records) {
    try {
      if (kind === 'friend') {
        await client.setFriendAddRequest({ flag: record.flag, approve });
      } else {
        await client.setGroupAddRequest({ flag: record.flag, sub_type: record.subType || 'add', approve });
      }
      await removeRequest(kind, record.flag);
      success++;
    } catch (error) {
      logger.warn(`request handle failed: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }

  await message.send({ format: Format.create().addText(`已处理 ${records.length} 条${isFriend ? '好友申请' : '群申请/邀请'}：成功 ${success}，失败 ${failed}。`) });
};
