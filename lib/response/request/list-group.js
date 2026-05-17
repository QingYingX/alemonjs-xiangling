import { useEvent, useMessage, Format } from 'alemonjs';
import { listRequests, formatRequestList } from '../../model/admin/requests.js';
import { getEventGroupId } from '../../model/group/admin.js';

var listGroup = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const groupId = getEventGroupId(event.current);
    const records = (await listRequests('group'))
        .filter(record => event.current.IsMaster || !groupId || record.groupId === String(groupId));
    await message.send({ format: Format.create().addText(formatRequestList('group', records)) });
};

export { listGroup as default };
