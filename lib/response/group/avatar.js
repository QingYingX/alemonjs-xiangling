import { useEvent, useMessage, useMention, Format } from 'alemonjs';
import { getRawArgs, toSafeInteger, getEventGroupId } from '../../model/group/admin.js';
import { getGroupAvatarUrl, getUserAvatarUrl } from '../../model/group/tools.js';

var avatar = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const [mention] = useMention();
    const mentioned = await mention.findOne();
    const args = getRawArgs(event.current);
    const isGroupAvatar = /群头像/.test(event.current.MessageText || '');
    const id = toSafeInteger(args[0]) ?? toSafeInteger(mentioned.data?.UserId) ?? (isGroupAvatar ? getEventGroupId(event.current) : toSafeInteger(event.current.UserId));
    if (!id) {
        await message.send({ format: Format.create().addText(isGroupAvatar ? '请使用：#取群头像 <群号>' : '请使用：#取头像 <QQ>') });
        return;
    }
    const url = isGroupAvatar ? getGroupAvatarUrl(id) : getUserAvatarUrl(id);
    await message.send({ format: Format.create().addText(url) });
};

export { avatar as default };
