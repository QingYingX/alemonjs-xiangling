import { useEvent, useMessage, Format, logger, getConfigValue } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { deleteFeedback, clearFeedback, listFeedback, formatFeedbackList, getFeedback, createFeedback, formatFeedbackRecord } from '../../model/admin/feedback.js';
import { getFeedbackSettings } from '../../model/admin/feedback-settings.js';
import { getRawArgs, toSafeInteger } from '../../model/group/admin.js';

const getCommandText = (messageText) => messageText.replace(/^\s*[#＃!！]?\S+\s*/, '').trim();
const readMasterIds = () => {
    const config = getConfigValue() || {};
    const onebot = config.onebot && typeof config.onebot === 'object' && !Array.isArray(config.onebot)
        ? config.onebot
        : {};
    const masterIds = Array.isArray(onebot.master_id) ? onebot.master_id : [];
    return [...new Set(masterIds.map(item => Number(item)).filter(Number.isFinite))];
};
var feedback = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const text = event.current.MessageText || '';
    const args = getRawArgs(event.current);
    const format = Format.create();
    const settings = await getFeedbackSettings();
    if (/^\s*[#＃!！]?(删除|移除)反馈/.test(text)) {
        if (!event.current.IsMaster) {
            await message.send({ format: format.addText('只有主人才能删除反馈。') });
            return;
        }
        const code = args[0];
        if (!/^\d{6}$/.test(code || '')) {
            await message.send({ format: format.addText('请使用：#删除反馈 <6位识别码>') });
            return;
        }
        const deleted = await deleteFeedback(code);
        await message.send({ format: format.addText(deleted ? `已删除反馈 ${code}。` : `未找到反馈 ${code}。`) });
        return;
    }
    if (/^\s*[#＃!！]?清空反馈/.test(text)) {
        if (!event.current.IsMaster) {
            await message.send({ format: format.addText('只有主人才能清空反馈。') });
            return;
        }
        const count = await clearFeedback();
        await message.send({ format: format.addText(`已清空反馈记录 ${count} 条。`) });
        return;
    }
    if (/^\s*[#＃!！]?反馈列表/.test(text)) {
        if (!event.current.IsMaster) {
            await message.send({ format: format.addText('只有主人才能查看反馈列表。') });
            return;
        }
        const page = toSafeInteger(args[0]) ?? 1;
        const data = await listFeedback(page);
        await message.send({ format: format.addText(formatFeedbackList(page, data.pages, data.total, data.records)) });
        return;
    }
    if (/^\s*[#＃!！]?回复反馈/.test(text)) {
        if (!event.current.IsMaster) {
            await message.send({ format: format.addText('只有主人才能回复反馈。') });
            return;
        }
        const [code, ...replyParts] = args;
        const reply = replyParts.join(' ').trim();
        if (!/^\d{6}$/.test(code || '') || !reply) {
            await message.send({ format: format.addText('请使用：#回复反馈 <6位识别码> <内容>') });
            return;
        }
        const record = await getFeedback(code);
        if (!record) {
            await message.send({ format: format.addText(`未找到识别码 ${code} 对应的反馈，可能已过期。`) });
            return;
        }
        const replyMessage = [`【反馈回复】`, `识别码: ${code}`, '━━━━━━━━', reply].join('\n');
        const [client] = useClient(event.current);
        if (record.isPrivate || !record.groupId) {
            await client.sendPrivateMessage({ user_id: Number(record.userId), message: [{ type: 'text', data: { text: replyMessage } }] });
        }
        else {
            await client.sendGroupMessage({
                group_id: Number(record.groupId),
                message: [
                    { type: 'at', data: { qq: Number(record.userId) } },
                    { type: 'text', data: { text: `\n${replyMessage}` } }
                ]
            });
        }
        await message.send({ format: format.addText(`已回复反馈 ${code}。`) });
        return;
    }
    if (!settings.enabled) {
        await message.send({ format: format.addText('反馈功能已禁用。') });
        return;
    }
    const content = getCommandText(text);
    if (!content) {
        await message.send({ format: format.addText('请使用：#反馈 <内容>') });
        return;
    }
    const record = await createFeedback(event.current, content);
    if (event.current.IsMaster) {
        await message.send({ format: format.addText(`反馈已记录，识别码：${record.code}`) });
        return;
    }
    try {
        const [client] = useClient(event.current);
        const notifyText = formatFeedbackRecord(record);
        const masterIds = readMasterIds();
        for (const userId of masterIds) {
            await client.sendPrivateMessage({ user_id: userId, message: [{ type: 'text', data: { text: notifyText } }] });
        }
        for (const groupId of settings.groups) {
            const numericGroupId = Number(groupId);
            if (!Number.isFinite(numericGroupId))
                continue;
            await client.sendGroupMessage({ group_id: numericGroupId, message: [{ type: 'text', data: { text: notifyText } }] });
        }
    }
    catch (error) {
        logger.warn(`feedback notify failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    await message.send({ format: format.addText(`反馈已记录，识别码：${record.code}`) });
};

export { feedback as default };
