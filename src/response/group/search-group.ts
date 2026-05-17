import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupList } from '../../adapter/onebot';
import { formatGroupList, searchGroups } from '../../model/group/tools';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const keyword = event.current.__route?.rawArgs?.join(' ').trim() || '';

  if (!keyword) {
    await message.send({
      format: Format.create().addText('请输入搜索关键词：#搜索群 <关键词>')
    });
    return;
  }

  const [client] = useClient(event.current);
  const groups = searchGroups(normalizeGroupList(await client.getGroupList()), keyword);
  const text = groups.length ? formatGroupList(groups) : `未找到匹配群组：${keyword}`;

  await message.send({
    format: Format.create().addText(text)
  });
};
