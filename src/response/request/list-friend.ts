import { Format, useMessage } from 'alemonjs';
import { formatRequestList, listRequests } from '../../model/admin/requests';

export default async () => {
  const [message] = useMessage();
  const records = await listRequests('friend');

  await message.send({ format: Format.create().addText(formatRequestList('friend', records)) });
};
