import { useEvent, useMessage, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { parseGroupOnlyArgs } from '../../model/group/admin.js';

var groupLeave = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const target = parseGroupOnlyArgs(event.current);
    if (!target) {
        await message.send({ format: Format.create().addText('请在群内使用：#退群，或私聊使用：#退群 <群号>') });
        return;
    }
    const [client] = useClient(event.current);
    await client.setGroupLeave({ group_id: target.groupId });
    await message.send({ format: Format.create().addText(`已请求退出群 ${target.groupId}。`) });
};

export { groupLeave as default };
