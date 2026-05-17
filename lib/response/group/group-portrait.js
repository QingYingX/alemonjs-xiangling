import { useEvent, useMessage, Format } from 'alemonjs';
import { setGroupPortrait } from '../../adapter/onebot.js';
import { getRawArgs, getEventGroupId, toSafeInteger } from '../../model/group/admin.js';
import { getFirstImage } from '../../model/tools/media.js';
import { hasBotGroupAdminPermission } from '../../model/group/permissions.js';

var groupPortrait = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const args = getRawArgs(event.current);
    const currentGroupId = getEventGroupId(event.current);
    const explicitGroupId = toSafeInteger(args[0]);
    const groupId = currentGroupId ?? explicitGroupId;
    const file = getFirstImage(event.current) ?? args.find(item => /^(https?:\/\/|base64:\/\/|file:\/\/)/i.test(item));
    if (!groupId || !file) {
        await message.send({ format: Format.create().addText('请使用：#改群头像 <图片>，或 #改群头像 <图片链接>。') });
        return false;
    }
    if (!await hasBotGroupAdminPermission(event.current, groupId)) {
        await message.send({ format: Format.create().addText('Bot 权限不足，需要管理员权限。') });
        return false;
    }
    try {
        await setGroupPortrait(event.current, groupId, file);
        await message.send({ format: Format.create().addText(`已尝试修改群 ${groupId} 的头像。`) });
    }
    catch (error) {
        await message.send({ format: Format.create().addText(`修改群头像失败：${error instanceof Error ? error.message : String(error)}。当前 OneBot 实现可能不支持 set_group_portrait。`) });
    }
    return false;
};

export { groupPortrait as default };
