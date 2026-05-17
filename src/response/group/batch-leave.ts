import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupList } from '../../adapter/onebot';
import { getRawArgText, toSafeInteger } from '../../model/group/admin';

const parseGroupIds = (text: string): number[] => {
  return [...new Set(text.split(/[,，\s]+/).map(toSafeInteger).filter((item): item is number => item !== null))];
};

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const ids = parseGroupIds(getRawArgText(event.current));
  if (!ids.length) {
    await message.send({ format: Format.create().addText('请使用：#批量退群 <群号1,群号2,...>') });
    return;
  }
  if (ids.length > 20) {
    await message.send({ format: Format.create().addText('一次最多只能退出20个群，请分批操作。') });
    return;
  }

  const [client] = useClient(event.current);
  const groups = normalizeGroupList(await client.getGroupList());
  const groupMap = new Map(groups.map(group => [Number(group.group_id), group.group_name || '未知群名']));
  const success: string[] = [];
  const failed: string[] = [];

  for (const id of ids) {
    try {
      await client.setGroupLeave({ group_id: id });
      success.push(`${groupMap.get(id) || '未知群名'}(${id})`);
    } catch (error) {
      failed.push(`${id} - ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  await message.send({
    format: Format.create().addText([
      '批量退群结果',
      `成功：${success.length}个`,
      success.length ? success.join('\n') : '',
      failed.length ? `失败：${failed.length}个\n${failed.join('\n')}` : ''
    ].filter(Boolean).join('\n'))
  });
};
