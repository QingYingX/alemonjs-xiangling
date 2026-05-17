import { useMessage, Format } from 'alemonjs';
import { listRequests, formatRequestList } from '../../model/admin/requests.js';

var listFriend = async () => {
    const [message] = useMessage();
    const records = await listRequests('friend');
    await message.send({ format: Format.create().addText(formatRequestList('friend', records)) });
};

export { listFriend as default };
