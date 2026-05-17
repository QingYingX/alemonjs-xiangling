import { Format, useMessage } from 'alemonjs';
import { formatRequestList, listRequests } from '../../model/admin/requests';

export default async () => {
  const [message] = useMessage();
  const friendRecords = await listRequests('friend');
  const groupRecords = await listRequests('group');
  const text = [formatRequestList('friend', friendRecords), formatRequestList('group', groupRecords)].join('\n\n');

  await message.send({ format: Format.create().addText(text) });
};
