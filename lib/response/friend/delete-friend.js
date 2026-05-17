import { useEvent, useMessage, useMention, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeFriendList, deleteFriend as deleteFriend$1 } from '../../adapter/onebot.js';
import { toSafeInteger, getRawArgs } from '../../model/group/admin.js';

var deleteFriend = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const [mention] = useMention();
    const mentioned = await mention.findOne();
    const userId = toSafeInteger(mentioned.data?.UserId) ?? toSafeInteger(getRawArgs(event.current)[0]);
    if (!userId) {
        await message.send({ format: Format.create().addText('请使用：#删好友 <QQ>') });
        return;
    }
    const [client] = useClient(event.current);
    const friends = normalizeFriendList(await client.getFriendList());
    if (friends.length && !friends.some(friend => Number(friend.user_id) === userId)) {
        await message.send({ format: Format.create().addText('好友列表查无此人。') });
        return;
    }
    await deleteFriend$1(event.current, userId);
    await message.send({ format: Format.create().addText(`已尝试删除好友 ${userId}。`) });
};

export { deleteFriend as default };
