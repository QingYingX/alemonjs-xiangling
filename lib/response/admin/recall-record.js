import { useEvent, useMessage, Format, logger } from 'alemonjs';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import ListCardImage from '../../image/component/list-card.js';
import { listRecallRecords, formatRecallRecords } from '../../model/admin/recall.js';

const renderListImage = async (data) => {
    try {
        return await renderComponentIsHtmlToBuffer(ListCardImage, { data }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
    }
    catch (error) {
        logger.warn(`recall record image render failed: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
};
var recallRecord = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const text = event.current.MessageText || '';
    const isPrivate = /好友|私聊/.test(text);
    const groupId = 'GuildId' in event.current ? event.current.GuildId : undefined;
    const records = await listRecallRecords(isPrivate ? 'private' : 'group', isPrivate ? undefined : groupId);
    const title = isPrivate ? '最近好友撤回记录' : `最近群聊撤回记录${groupId ? `(${groupId})` : ''}`;
    const img = await renderListImage({
        title,
        subTitle: isPrivate ? '私聊 / 好友撤回' : `群 ${groupId || '全局'}`,
        summary: [`共 ${records.length} 条`, '保留 7 天', '最多 50 条'],
        emptyText: '暂无撤回记录。',
        items: records.slice(0, 20).map((record, index) => {
            const sender = record.userName ? `${record.userName}(${record.userId || '未知'})` : String(record.userId || '未知');
            const operator = record.operatorId && String(record.operatorId) !== String(record.userId || '') ? `操作人：${record.operatorId}` : '本人撤回或未知操作人';
            return {
                title: `${index + 1}. ${sender}`,
                subtitle: new Date(record.recallTime * 1000).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }),
                content: record.text,
                tags: [operator, record.messageId ? `消息 ${record.messageId}` : '']
                    .filter(Boolean)
            };
        })
    });
    if (img) {
        await message.send({ format: Format.create().addImage(img) });
        return false;
    }
    await message.send({ format: Format.create().addText(formatRecallRecords(records, title)) });
    return false;
};

export { recallRecord as default };
