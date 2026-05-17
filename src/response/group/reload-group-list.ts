import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupList } from '../../adapter/onebot';
import { formatGroupMemberStats } from '../../model/group/tools';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const [client] = useClient(event.current);
  const groups = normalizeGroupList(await client.getGroupList());

  await message.send({
    format: Format.create().addText(`已重新从 OneBot 获取群列表。\n\n${formatGroupMemberStats(groups)}`)
  });
};
