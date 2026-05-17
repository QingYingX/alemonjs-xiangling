import { useEvent, useMessage, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { parseGroupOnlyArgs } from '../../model/group/admin.js';
import { hasBotGroupAdminPermission } from '../../model/group/permissions.js';

var adminWholeBan = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const target = parseGroupOnlyArgs(event.current);
    const enable = /禁言/.test(event.current.MessageText || '');
    if (!target) {
        await message.send({ format: Format.create().addText('请在群内使用，或私聊使用：#全体禁言 <群号> / #全体解禁 <群号>') });
        return;
    }
    if (!await hasBotGroupAdminPermission(event.current, target.groupId)) {
        await message.send({ format: Format.create().addText('Bot 权限不足，需要管理员权限。') });
        return;
    }
    const [client] = useClient(event.current);
    await client.setGroupWholeBan({ group_id: target.groupId, enable });
    await message.send({ format: Format.create().addText(`已${enable ? '开启' : '关闭'}全体禁言。`) });
};

export { adminWholeBan as default };
