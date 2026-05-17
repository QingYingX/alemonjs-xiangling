import { useEvent, useMessage, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getEventGroupId } from '../../model/group/admin.js';

var dragonKing = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const groupId = getEventGroupId(event.current);
    if (!groupId) {
        await message.send({ format: Format.create().addText('请在群内使用：#谁是龙王') });
        return;
    }
    const [client] = useClient(event.current);
    const honor = await client.getGroupHonorInfo({ group_id: groupId, type: 'talkative' });
    const current = honor?.current_talkative;
    if (!current?.user_id) {
        await message.send({ format: Format.create().addText('当前 OneBot 未返回本群龙王信息。') });
        return;
    }
    const lines = [
        '本群龙王',
        '━━━━━━━━',
        `账号: ${current.user_id}`,
        `昵称: ${current.nickname || '未知'}`,
        `蝉联: ${current.day_count ?? 0} 天`
    ];
    await message.send({ format: Format.create().addText(lines.join('\n')) });
};

export { dragonKing as default };
