import { useEvent, useMessage, Format, logger } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import { normalizeFriendList } from '../../adapter/onebot.js';
import { formatFriendList } from '../../model/group/tools.js';
import ListCardImage from '../../image/component/list-card.js';

const renderListImage = async (data) => {
    try {
        return await renderComponentIsHtmlToBuffer(ListCardImage, { data }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
    }
    catch (error) {
        logger.warn(`friend list image render failed: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
};
var friendList = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const [client] = useClient(event.current);
    const friends = normalizeFriendList(await client.getFriendList());
    const img = await renderListImage({
        title: '好友列表',
        subTitle: `当前账号共 ${friends.length} 个好友`,
        summary: [friends.length > 80 ? '仅显示前 80 个' : '全部显示'],
        emptyText: '好友列表为空，或当前 OneBot 实现未返回好友列表。',
        items: friends.slice(0, 80).map((friend, index) => ({
            title: `${index + 1}. ${friend.remark || friend.nickname || '未知昵称'}`,
            subtitle: `账号：${friend.user_id}`,
            content: friend.remark && friend.nickname && friend.remark !== friend.nickname ? `昵称：${friend.nickname}` : '暂无更多信息',
            tags: friend.remark ? ['备注'] : undefined
        }))
    });
    if (img) {
        await message.send({ format: Format.create().addImage(img) });
        return;
    }
    await message.send({
        format: Format.create().addText(formatFriendList(friends))
    });
};

export { friendList as default };
