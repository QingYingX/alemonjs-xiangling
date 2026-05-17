import { useEvent, useMessage, Format } from 'alemonjs';
import { sendOneBotAction } from '../../adapter/onebot.js';
import { getRawArgText } from '../../model/group/admin.js';
import { getFirstImage } from '../../model/tools/media.js';

const send = async (text) => {
    const [message] = useMessage();
    await message.send({ format: Format.create().addText(text) });
};
const tryAction = async (event, action, params) => {
    try {
        await sendOneBotAction(event, action, params);
        await send('已提交 OneBot 操作。若协议端支持该 action，会立即生效。');
    }
    catch (error) {
        await send('当前 OneBot 协议端不支持或拒绝该操作：' + (error instanceof Error ? error.message : String(error)));
    }
};
const onlineStatusMap = {
    离开: 31,
    忙碌: 50,
    请勿打扰: 70,
    隐身: 41,
    我在线上: 11,
    Q我吧: 60,
    q我吧: 60
};
const genderMap = {
    无: 0,
    男: 1,
    女: 2
};
var botManage = async () => {
    const [event] = useEvent();
    const text = event.current.MessageText || '';
    const args = getRawArgText(event.current);
    if (/^\s*[#＃!！]?(改|换)头像/.test(text)) {
        const image = getFirstImage(event.current) || args;
        if (!image) {
            await send('请带图片使用：#改头像 <图片>');
            return false;
        }
        await tryAction(event.current, 'set_qq_avatar', { file: image });
        return false;
    }
    if (/^\s*[#＃!！]?(改|换)(昵|名)称?/.test(text)) {
        if (!args) {
            await send('请使用：#改昵称 <新昵称>');
            return false;
        }
        await tryAction(event.current, 'set_qq_profile', { nickname: args });
        return false;
    }
    if (/^\s*[#＃!！]?改签名/.test(text)) {
        if (!args) {
            await send('请使用：#改签名 <内容>');
            return false;
        }
        await tryAction(event.current, 'set_self_longnick', { longNick: args, long_nick: args, text: args });
        return false;
    }
    if (/^\s*[#＃!！]?改(状态|性别)/.test(text)) {
        if (/改状态/.test(text)) {
            const status = onlineStatusMap[args];
            if (!status) {
                await send('请使用：#改状态 <状态>\n可选：我在线上、离开、隐身、忙碌、Q我吧、请勿打扰。');
                return false;
            }
            await tryAction(event.current, 'set_online_status', { status, status_id: status });
            return false;
        }
        const gender = genderMap[args];
        if (gender === undefined) {
            await send('请使用：#改性别 <男|女|无>');
            return false;
        }
        await tryAction(event.current, 'set_qq_profile', { sex: gender, gender });
        return false;
    }
    await send('Bot 管理命令：#改头像 / #改昵称 / #改签名。其余 QQWeb 或非标准能力暂不迁移。');
    return false;
};

export { botManage as default };
