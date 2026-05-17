import { useEvent, useMessage, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getEventGroupId, toSafeInteger, getRawArgs } from '../../model/group/admin.js';
import { getBotGroupRole, getGroupRole } from '../../model/group/permissions.js';

const chineseDigits = {
    零: 0,
    〇: 0,
    一: 1,
    壹: 1,
    二: 2,
    两: 2,
    三: 3,
    四: 4,
    五: 5,
    六: 6,
    七: 7,
    八: 8,
    九: 9
};
const parseChineseInteger = (text) => {
    let section = 0;
    let number = 0;
    let result = 0;
    const units = { 十: 10, 百: 100, 千: 1000 };
    for (const char of text) {
        if (chineseDigits[char] !== undefined) {
            number = chineseDigits[char];
            continue;
        }
        if (char === '万') {
            result += (section + number) * 10000;
            section = 0;
            number = 0;
            continue;
        }
        const unit = units[char];
        if (!unit)
            return null;
        section += (number || 1) * unit;
        number = 0;
    }
    return result + section + number;
};
const parseNumber = (value) => {
    if (/^\d+$/.test(value))
        return Number(value);
    return parseChineseInteger(value);
};
const parseSelfMuteDuration = (text) => {
    const match = text.match(/([零〇一壹二两三四五六七八九十百千万\d]+)\s*个?\s*(秒|s|S|分|分钟|m|M|时|小时|h|H|天|d|D)?/);
    const value = match ? parseNumber(match[1]) : null;
    if (!value || !Number.isSafeInteger(value) || value <= 0)
        return 5 * 60;
    const unit = match?.[2] || '分';
    const multiplier = /秒|s/i.test(unit) ? 1 : /时|小时|h/i.test(unit) ? 3600 : /天|d/i.test(unit) ? 86400 : 60;
    return Math.min(value * multiplier, 30 * 24 * 60 * 60);
};
var selfMute = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const groupId = getEventGroupId(event.current);
    const userId = toSafeInteger(event.current.UserId);
    const rawArgs = getRawArgs(event.current);
    const duration = parseSelfMuteDuration(rawArgs.join(' ') || event.current.MessageText || '');
    if (!groupId || !userId) {
        await message.send({ format: Format.create().addText('请在群内使用：#我要自闭 [秒数]') });
        return;
    }
    const botRole = await getBotGroupRole(event.current, groupId);
    if (botRole === 'member') {
        await message.send({ format: Format.create().addText('Bot 不是群管理员，没法帮你自闭。') });
        return;
    }
    const userRole = await getGroupRole(event.current);
    if (event.current.IsMaster || (userRole === 'admin' && botRole !== 'owner')) {
        await message.send({ format: Format.create().addText('别自闭啦~~') });
        return;
    }
    const [client] = useClient(event.current);
    await client.setGroupBan({ group_id: groupId, user_id: userId, duration });
    await message.send({ format: Format.create().addText(`已自闭 ${duration} 秒。`) });
};

export { selfMute as default };
