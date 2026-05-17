import { useEvent, useMessage, useMention, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberInfo } from '../../adapter/onebot.js';
import { parseTargetArgs } from '../../model/group/admin.js';
import { hasBotGroupAdminPermission, hasBotGroupOwnerPermission } from '../../model/group/permissions.js';

var adminUnmute = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const [mention] = useMention();
    const mentioned = await mention.findOne();
    const mentionedList = await mention.find();
    const target = parseTargetArgs(event.current, mentioned.data?.UserId);
    if (!target) {
        await message.send({ format: Format.create().addText('请在群内使用：#解禁 @用户，或私聊使用：#解禁 <群号> <QQ>') });
        return;
    }
    if (!await hasBotGroupAdminPermission(event.current, target.groupId)) {
        await message.send({ format: Format.create().addText('Bot 权限不足，需要管理员权限。') });
        return;
    }
    const [client] = useClient(event.current);
    const targetIds = mentionedList.data?.length
        ? mentionedList.data.map(item => Number(item.UserId)).filter(Number.isSafeInteger)
        : [target.userId];
    const botIsOwner = await hasBotGroupOwnerPermission(event.current, target.groupId);
    const names = [];
    for (const userId of [...new Set(targetIds)]) {
        const member = normalizeGroupMemberInfo(await client.getGroupMemberInfo({ group_id: target.groupId, user_id: userId, no_cache: false }));
        if (!member) {
            await message.send({ format: Format.create().addText(`❎ 该群没有${targetIds.length > 1 ? userId : '这个人'}哦~`) });
            return;
        }
        if (member.role === 'owner') {
            await message.send({ format: Format.create().addText('❎ 权限不足，该命令对群主无效') });
            return;
        }
        if (member.role === 'admin') {
            if (!botIsOwner) {
                await message.send({ format: Format.create().addText('❎ 权限不足，需要群主权限') });
                return;
            }
            if (!event.current.IsMaster) {
                await message.send({ format: Format.create().addText('❎ 只有主人才能对管理执行该命令') });
                return;
            }
        }
        await client.setGroupBan({ group_id: target.groupId, user_id: userId, duration: 0 });
        names.push(member.card || member.nickname || String(userId));
    }
    await message.send({ format: Format.create().addText(`✅ 已将「${names.join('，')}」解除禁言`) });
};

export { adminUnmute as default };
