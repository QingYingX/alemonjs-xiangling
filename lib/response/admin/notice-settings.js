import { useEvent, useMessage, Format } from 'alemonjs';
import { setNoticeSetting, formatNoticeSettings, getNoticeSettings } from '../../model/admin/notice-settings.js';

var noticeSettings = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const text = event.current.MessageText || '';
    const allMatch = text.match(/^(?:[#＃!！])?(?:(?:机器人管理|管理)设置通知全部(开启|关闭)|(?:机器人管理|管理)(启用|禁用)全部通知)$/);
    if (allMatch) {
        const enabled = allMatch[1] === '开启' || allMatch[2] === '启用';
        const result = await setNoticeSetting('全部通知', enabled);
        await message.send({ format: Format.create().addText([result, '', formatNoticeSettings(await getNoticeSettings())].join('\n')) });
        return false;
    }
    const match = text.match(/^(?:[#＃!！])?(?:管理设置通知|群管通知设置)(.+?)(开启|关闭|取消|\d+秒?)$/);
    if (!match) {
        await message.send({ format: Format.create().addText(formatNoticeSettings(await getNoticeSettings())) });
        return false;
    }
    const name = match[1].replace(/(群单独|bot单独|bot群单独|单独)$/i, '').trim();
    const rawValue = match[2];
    const value = /^\d+秒?$/.test(rawValue) ? Number(rawValue.replace(/\D/g, '')) : rawValue === '开启';
    const result = await setNoticeSetting(name, value);
    await message.send({ format: Format.create().addText([result, '', formatNoticeSettings(await getNoticeSettings())].join('\n')) });
    return false;
};

export { noticeSettings as default };
