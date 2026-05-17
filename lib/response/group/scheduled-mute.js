import { useEvent, useMessage, Format } from 'alemonjs';
import { formatScheduledMuteTasks, getScheduledMuteTasks, removeScheduledMuteTask, toCronExpression, addScheduledMuteTask } from '../../model/group/scheduled-mute.js';
import { getEventGroupId } from '../../model/group/admin.js';

var scheduledMute = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const groupId = getEventGroupId(event.current);
    const text = event.current.MessageText || '';
    if (!groupId) {
        await message.send({ format: Format.create().addText('定时禁言只能在群聊中设置。') });
        return;
    }
    if (/定时禁言任务/.test(text)) {
        await message.send({ format: Format.create().addText(formatScheduledMuteTasks(await getScheduledMuteTasks())) });
        return;
    }
    const type = /解禁/.test(text) ? 'unmute' : 'mute';
    if (/取消/.test(text)) {
        const changed = await removeScheduledMuteTask(groupId, type);
        await message.send({ format: Format.create().addText(changed ? `已取消本群定时${type === 'mute' ? '禁言' : '解禁'}。` : `本群没有定时${type === 'mute' ? '禁言' : '解禁'}任务。`) });
        return;
    }
    const match = text.match(/定时(?:禁言|解禁)\s*(.+)$/);
    const cron = toCronExpression(match?.[1] || '');
    if (!cron) {
        await message.send({ format: Format.create().addText(`格式不对\n示范：#定时${type === 'mute' ? '禁言' : '解禁'} 00:00`) });
        return;
    }
    try {
        const result = await addScheduledMuteTask(event.current, groupId, type, cron);
        await message.send({ format: Format.create().addText(result.changed ? `设置定时${type === 'mute' ? '禁言' : '解禁'}成功，可发 #定时禁言任务 查看。` : `该群定时${type === 'mute' ? '禁言' : '解禁'}已存在，不可重复设置。`) });
    }
    catch (error) {
        await message.send({ format: Format.create().addText(`定时任务设置失败：${error instanceof Error ? error.message : String(error)}`) });
    }
};

export { scheduledMute as default };
