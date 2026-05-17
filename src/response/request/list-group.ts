import { Format, useEvent, useMessage } from 'alemonjs';
import { formatRequestList, listRequests } from '../../model/admin/requests';
import { getEventGroupId } from '../../model/group/admin';

export default async () => {
  const [event] = useEvent<'message.create' | 'private.message.create'>();
  const [message] = useMessage();
  const groupId = getEventGroupId(event.current);
  const records = (await listRequests('group'))
    .filter(record => event.current.IsMaster || !groupId || record.groupId === String(groupId));

  await message.send({ format: Format.create().addText(formatRequestList('group', records)) });
};
