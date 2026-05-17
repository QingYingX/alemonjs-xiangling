import { useEvent, useMessage, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getEventGroupId, getRawArgText } from '../../model/group/admin.js';
import { hasBotGroupAdminPermission } from '../../model/group/permissions.js';

var sendNotice = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const groupId = getEventGroupId(event.current);
    const text = getRawArgText(event.current);
    if (!groupId || !text) {
        await message.send({ format: Format.create().addText('请在群内使用：#发通知 <消息>') });
        return;
    }
    if (!await hasBotGroupAdminPermission(event.current, groupId)) {
        await message.send({ format: Format.create().addText('Bot 权限不足，需要管理员权限。') });
        return;
    }
    const [client] = useClient(event.current);
    await client.sendGroupMessage({
        group_id: groupId,
        message: [
            { type: 'at', data: { qq: 'all' } },
            { type: 'text', data: { text: `\n[通知]\n${text}` } }
        ]
    });
    await message.send({ format: Format.create().addText('通知已发送。') });
};

export { sendNotice as default };
