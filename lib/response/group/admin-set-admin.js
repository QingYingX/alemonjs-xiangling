import { useEvent, useMessage, useMention, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { parseTargetArgs } from '../../model/group/admin.js';
import { hasBotGroupOwnerPermission } from '../../model/group/permissions.js';

var adminSetAdmin = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const [mention] = useMention();
    const mentioned = await mention.findOne();
    const target = parseTargetArgs(event.current, mentioned.data?.UserId);
    const enable = /设置/.test(event.current.MessageText || '');
    if (!target) {
        await message.send({ format: Format.create().addText('请在群内使用：#设置管理 @用户，或私聊使用：#设置管理 <群号> <QQ>') });
        return;
    }
    if (!await hasBotGroupOwnerPermission(event.current, target.groupId)) {
        await message.send({ format: Format.create().addText('Bot 权限不足，需要群主权限。') });
        return;
    }
    const [client] = useClient(event.current);
    await client.setGroupAdmin({ group_id: target.groupId, user_id: target.userId, enable });
    await message.send({ format: Format.create().addText(`已${enable ? '设置' : '取消'} ${target.userId} 的管理员。`) });
};

export { adminSetAdmin as default };
