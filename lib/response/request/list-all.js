import { useMessage, Format } from 'alemonjs';
import { listRequests, formatRequestList } from '../../model/admin/requests.js';

var listAll = async () => {
    const [message] = useMessage();
    const friendRecords = await listRequests('friend');
    const groupRecords = await listRequests('group');
    const text = [formatRequestList('friend', friendRecords), formatRequestList('group', groupRecords)].join('\n\n');
    await message.send({ format: Format.create().addText(text) });
};

export { listAll as default };
