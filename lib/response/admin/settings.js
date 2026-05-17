import { useEvent, useMessage, Format, logger } from 'alemonjs';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import { setStateAsDefault, setRenderScale, buildSettingsImageData, getAdminSettings, formatSettingsText } from '../../model/admin/settings.js';
import SettingsImage from '../../image/component/settings.js';

const parseBoolean = (value) => {
    if (value === '开启')
        return true;
    if (value === '关闭')
        return false;
    return null;
};
var settings = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const text = (event.current.MessageText || '').trim();
    const format = Format.create();
    const stateMatch = text.match(/^[#＃!！]?群管设置状态(开启|关闭)$/);
    if (stateMatch) {
        const enabled = parseBoolean(stateMatch[1]);
        if (enabled === null)
            return false;
        await setStateAsDefault(enabled);
        await message.send({ format: format.addText(`已${enabled ? '开启' : '关闭'}群管状态页偏好。`) });
        return false;
    }
    const scaleMatch = text.match(/^[#＃!！]?群管设置渲染精度(\d+)$/);
    if (scaleMatch) {
        const value = Number(scaleMatch[1]);
        if (!Number.isFinite(value) || value < 50 || value > 200) {
            await message.send({ format: format.addText('渲染精度范围为 50~200，例如：#群管设置渲染精度100') });
            return false;
        }
        await setRenderScale(value);
        await message.send({ format: format.addText(`已设置香菱渲染精度为 ${value}。`) });
        return false;
    }
    if (/^[#＃!！]?群管设置陌生人点赞(开启|关闭)$/.test(text)) {
        await message.send({ format: format.addText('陌生人点赞属于点赞链路，香菱 AlemonJS 版暂不迁移。') });
        return false;
    }
    const data = await buildSettingsImageData();
    const settings = await getAdminSettings();
    try {
        const scale = settings.renderScale / 100;
        const img = await renderComponentIsHtmlToBuffer(SettingsImage, { data }, {
            screenshot: { encoding: 'base64', fullPage: true },
            bufferFromEncoding: 'base64',
            playwright: { context: { deviceScaleFactor: scale } }
        });
        if (img) {
            await message.send({ format: format.addImage(img) });
            return false;
        }
    }
    catch (error) {
        logger.warn(`settings image render failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    await message.send({ format: format.addText(formatSettingsText(data)) });
    return false;
};

export { settings as default };
