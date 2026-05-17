import { useEvent } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getGroupAddNoticeConfig } from '../../model/group/group-add-notice.js';

var groupAddNotice = async (_event, next) => {
    const [event] = useEvent();
    if (event.current.name !== 'private.guild.add') {
        await next?.();
        return;
    }
    const raw = event.current.value ?? {};
    if (raw.post_type !== 'request' || raw.request_type !== 'group') {
        await next?.();
        return;
    }
    const groupId = Number(raw.group_id);
    if (!Number.isSafeInteger(groupId)) {
        await next?.();
        return;
    }
    const config = await getGroupAddNoticeConfig();
    if (!config.openGroups.includes(String(groupId))) {
        await next?.();
        return;
    }
    const userId = String(raw.user_id ?? event.current.UserId ?? '未知');
    const subType = String(raw.sub_type ?? 'add');
    const comment = raw.comment ? String(raw.comment) : '无附加信息';
    const lines = [
        config.message,
        `群号：${groupId}`,
        `申请人：${userId}`,
        `类型：${subType === 'invite' ? '群邀请' : '加群申请'}`,
        `附加信息：${comment}`,
        '可使用 #查看加群申请 后处理。'
    ];
    try {
        const [client] = useClient(event.current);
        await client.sendGroupMessage({ group_id: groupId, message: [{ type: 'text', data: { text: lines.join('\n') } }] });
    }
    catch (error) {
        logger.warn(`send group add notice failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    await next?.();
};

export { groupAddNotice as default };
