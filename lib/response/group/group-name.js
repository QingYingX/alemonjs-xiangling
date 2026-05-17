import { useEvent, useMessage, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { parseGroupTextArgs } from '../../model/group/admin.js';
import { hasBotGroupAdminPermission } from '../../model/group/permissions.js';

var groupName = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const target = parseGroupTextArgs(event.current);
    if (!target) {
        await message.send({ format: Format.create().addText('请在群内使用：#改群名称 <名称>，或私聊使用：#改群名称 <群号> <名称>') });
        return;
    }
    if (!await hasBotGroupAdminPermission(event.current, target.groupId)) {
        await message.send({ format: Format.create().addText('Bot 权限不足，需要管理员权限。') });
        return;
    }
    const [client] = useClient(event.current);
    await client.setGroupName({ group_id: target.groupId, group_name: target.text });
    await message.send({ format: Format.create().addText(`已将群 ${target.groupId} 名称修改为「${target.text}」。`) });
};

export { groupName as default };
