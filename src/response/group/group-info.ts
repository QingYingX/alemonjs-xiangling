import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupInfo, normalizeGroupList } from '../../adapter/onebot';
import { formatGroupInfo, searchGroups, toNumberId } from '../../model/group/tools';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const route = event.current.__route;
  const rawTarget = route?.rawArgs?.join(' ').trim();
  const fallbackGroupId = event.current.GuildId || event.current.SpaceId || event.current.ChannelId;
  const target = rawTarget || fallbackGroupId;
  const numericId = toNumberId(target);
  const [client] = useClient(event.current);

  if (!target) {
    await message.send({
      format: Format.create().addText('请在群内使用，或指定群号：#群信息 <群号>')
    });
    return;
  }

  let group = numericId ? normalizeGroupInfo(await client.getGroupInfo({ group_id: numericId, no_cache: false })) : null;
  if (!group && rawTarget) {
    const groups = normalizeGroupList(await client.getGroupList());
    group = searchGroups(groups, rawTarget)[0] ?? null;
  }

  if (!group) {
    await message.send({
      format: Format.create().addText(`未找到匹配群组：${target}`)
    });
    return;
  }

  await message.send({
    format: Format.create().addText(formatGroupInfo(group))
  });
};
