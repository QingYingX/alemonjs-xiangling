import { useEvent, useMessage, useMention, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { parseCardArgs } from '../../model/group/admin.js';
import { hasBotGroupAdminPermission } from '../../model/group/permissions.js';

var adminCard = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const [mention] = useMention();
    const mentioned = await mention.findOne();
    const target = parseCardArgs(event.current, mentioned.data?.UserId);
    if (!target) {
        await message.send({ format: Format.create().addText('请在群内使用：#改群名片 [@用户] <名片>，或私聊使用：#改群名片 <群号> <名片>') });
        return;
    }
    if (mentioned.data?.UserId && !await hasBotGroupAdminPermission(event.current, target.groupId)) {
        await message.send({ format: Format.create().addText('Bot 权限不足，需要管理员权限才能修改其他成员名片。') });
        return;
    }
    const [client] = useClient(event.current);
    await client.setGroupCard({ group_id: target.groupId, user_id: target.userId, card: target.text });
    await message.send({ format: Format.create().addText(`已将 ${target.userId} 的群名片修改为「${target.text}」。`) });
};

export { adminCard as default };
