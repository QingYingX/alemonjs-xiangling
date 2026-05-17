import { useEvent, useMention, useMessage, Format, logger } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import { normalizeGroupMemberInfo } from '../../adapter/onebot.js';
import ListCardImage from '../../image/component/list-card.js';
import { clearAllWhoAt, clearWhoAt, listWhoAt, formatWhoAtRecords } from '../../model/group/who-at.js';
import { getEventGroupId, toSafeInteger } from '../../model/group/admin.js';

const send = async (text) => {
    const [message] = useMessage();
    await message.send({ format: Format.create().addText(text) });
};
const sendListImage = async (data, fallback) => {
    const [message] = useMessage();
    try {
        const img = await renderComponentIsHtmlToBuffer(ListCardImage, { data }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
        if (img) {
            await message.send({ format: Format.create().addImage(img) });
            return;
        }
    }
    catch (error) {
        logger.warn(`who-at image render failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    await message.send({ format: Format.create().addText(fallback) });
};
var whoAt = async () => {
    const [event] = useEvent();
    const [mention] = useMention();
    const text = event.current.MessageText || '';
    const groupId = getEventGroupId(event.current);
    const userId = toSafeInteger(event.current.UserId);
    if (!groupId || !userId) {
        await send('艾特追踪只能在群聊中使用。');
        return false;
    }
    if (/清除全部|clear_all/i.test(text)) {
        if (!event.current.IsMaster) {
            await send('只有主人才能清除全部艾特数据。');
            return false;
        }
        const count = await clearAllWhoAt(groupId);
        await send(`已清除本群 ${count} 条艾特数据。`);
        return false;
    }
    if (/清除|clear_at/i.test(text)) {
        const changed = await clearWhoAt(groupId, userId);
        await send(changed ? '已成功清除你的艾特数据。' : '目前数据库没有你的艾特数据，无法清除。');
        return false;
    }
    const mentioned = await mention.findOne();
    const targetUserId = /我|哪个逼/i.test(text) ? userId : toSafeInteger(mentioned.data?.UserId) ?? userId;
    const records = await listWhoAt(groupId, targetUserId);
    const [client] = useClient(event.current);
    const member = await client.getGroupMemberInfo({ group_id: groupId, user_id: targetUserId, no_cache: false }).then(normalizeGroupMemberInfo).catch(() => null);
    const targetName = member?.card || member?.nickname || String(targetUserId);
    await sendListImage({
        title: '谁艾特了我',
        subTitle: `群 ${groupId} · ${targetName}(${targetUserId})`,
        summary: [`共 ${records.length} 条`, '保留 24 小时', '最多 30 条'],
        emptyText: `目前还没有人艾特过 ${targetName}。`,
        items: records.slice(0, 20).map((record, index) => ({
            title: `${index + 1}. ${record.senderName || record.userId}`,
            subtitle: `${record.userId} · ${new Date(record.time * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}`,
            content: record.message || '[仅@]',
            tags: record.messageId ? [`消息 ${record.messageId}`] : undefined
        }))
    }, formatWhoAtRecords(records, targetUserId, member));
    return false;
};

export { whoAt as default };
