import { Format, useEvent, useMessage } from 'alemonjs';
import { getEventGroupId } from '../../model/group/admin';
import { formatGroupAddNotice, getGroupAddNoticeConfig, setGroupAddNoticeOpen } from '../../model/group/group-add-notice';

export default async () => {
  const [event] = useEvent<'message.create'>();
  const [message] = useMessage();
  const groupId = getEventGroupId(event.current);
  const text = event.current.MessageText || '';

  if (!groupId) {
    await message.send({ format: Format.create().addText('请在群内使用加群通知设置。') });
    return false;
  }

  if (/查看加群通知/.test(text)) {
    const config = await getGroupAddNoticeConfig();
    await message.send({ format: Format.create().addText(formatGroupAddNotice(config)) });
    return false;
  }

  const open = /开启/.test(text);
  const result = await setGroupAddNoticeOpen(groupId, open);
  if (!result.changed) {
    await message.send({ format: Format.create().addText(open ? '本群加群通知已处于开启状态。' : '本群暂未开启加群通知。') });
    return false;
  }

  await message.send({ format: Format.create().addText(`已${open ? '开启' : '关闭'}本群加群通知。`) });
  return false;
};
