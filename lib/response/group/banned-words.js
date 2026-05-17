import { useEvent, useMessage, Format, logger } from 'alemonjs';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import ListCardImage from '../../image/component/list-card.js';
import { parseBannedMode, addBannedWord, formatBannedWord, deleteBannedWord, getBannedWordsConfig, matchTypeLabels, penaltyTypeLabels, formatBannedWordList, setBannedMuteTime, updateTitleWords, toggleTitleExactMode } from '../../model/group/banned-words.js';
import { getEventGroupId, toSafeInteger, getRawArgs, getRawArgText } from '../../model/group/admin.js';

const stripCommand = (text, command) => text.replace(command, '').trim();
const parseWordFromAddCommand = (text) => {
    return text.replace(/^\s*[#＃!！]?新增(模糊|精确|正则1|正则2|正则)?(踢黑|踢撤|禁撤|踢|禁|撤)?违禁词/, '').trim();
};
const normalizeRegexWord = (text, word) => {
    if (!/正则2/.test(text))
        return word;
    const match = word.match(/^\/(.*)\/([gimsuy]*)$/);
    if (!match)
        return word;
    new RegExp(match[1], match[2]);
    return match[1];
};
const parseCsvWords = (text) => text.split(/[,，]/).map(item => item.trim()).filter(Boolean);
const renderListImage = async (data) => {
    try {
        return await renderComponentIsHtmlToBuffer(ListCardImage, { data }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
    }
    catch (error) {
        logger.warn(`banned words image render failed: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
};
var bannedWords = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const groupId = getEventGroupId(event.current);
    const text = event.current.MessageText || '';
    const format = Format.create();
    if (!groupId) {
        await message.send({ format: format.addText('违禁词功能只能在群聊中使用。') });
        return;
    }
    if (/违禁词帮助/.test(text)) {
        await message.send({
            format: format.addText([
                '违禁词命令：',
                '#新增违禁词 <词>',
                '#新增模糊踢违禁词 <词>',
                '#新增正则禁撤违禁词 <正则>',
                '#删除违禁词 <词>',
                '#查看违禁词 <词>',
                '#违禁词列表 / #违禁词列表原始',
                '#设置违禁词禁言时间 <秒>'
            ].join('\n'))
        });
        return;
    }
    if (/^\s*[#＃!！]?新增/.test(text)) {
        const word = normalizeRegexWord(text, parseWordFromAddCommand(text));
        if (!word) {
            await message.send({ format: format.addText('请使用：#新增违禁词 <词>') });
            return;
        }
        try {
            const mode = parseBannedMode(text);
            const item = await addBannedWord(groupId, word, mode.matchType, mode.penaltyType, event.current.UserId);
            await message.send({ format: format.addText(`已添加违禁词：\n${formatBannedWord(item, true)}`) });
        }
        catch (error) {
            await message.send({ format: format.addText(`添加失败：${error instanceof Error ? error.message : String(error)}`) });
        }
        return;
    }
    if (/^\s*[#＃!！]?删除违禁词/.test(text)) {
        const word = stripCommand(text, /^\s*[#＃!！]?删除违禁词/);
        if (!word) {
            await message.send({ format: format.addText('请使用：#删除违禁词 <词>') });
            return;
        }
        const changed = await deleteBannedWord(groupId, word);
        await message.send({ format: format.addText(changed ? `已删除违禁词：${word}` : `违禁词不存在：${word}`) });
        return;
    }
    if (/^\s*[#＃!！]?查看违禁词/.test(text)) {
        const word = stripCommand(text, /^\s*[#＃!！]?查看违禁词/);
        if (!word) {
            await message.send({ format: format.addText('请使用：#查看违禁词 <词>') });
            return;
        }
        const config = await getBannedWordsConfig(groupId);
        const item = config.words.find(entry => entry.word === word);
        await message.send({ format: format.addText(item ? formatBannedWord(item, true) : `未找到违禁词：${word}`) });
        return;
    }
    if (/^\s*[#＃!！]?违禁词列表/.test(text)) {
        const config = await getBannedWordsConfig(groupId);
        const raw = /原始|raw/i.test(text);
        const img = await renderListImage({
            title: '违禁词列表',
            subTitle: `群 ${groupId}`,
            summary: [`共 ${config.words.length} 条`, `禁言 ${config.muteTime} 秒`, `头衔屏蔽 ${config.titleWords.length} 个`, `头衔${config.titleExactMode ? '精确' : '模糊'}匹配`],
            emptyText: '当前群没有违禁词。',
            items: config.words.slice(0, 40).map((item, index) => ({
                title: `${index + 1}. ${raw ? item.word : item.word.length > 2 ? `${item.word.slice(0, 2)}${'*'.repeat(Math.max(0, item.word.length - 2))}` : item.word}`,
                subtitle: `添加人：${item.addedBy || '未知'} · ${new Date(item.date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false })}`,
                content: `匹配模式：${matchTypeLabels[item.matchType]}\n处理方式：${penaltyTypeLabels[item.penaltyType]}`,
                tags: [matchTypeLabels[item.matchType], penaltyTypeLabels[item.penaltyType]]
            })),
            footer: raw ? '原始模式：已显示完整词条' : '普通模式：长词条已脱敏'
        });
        if (img) {
            await message.send({ format: format.addImage(img) });
            return;
        }
        await message.send({ format: format.addText(formatBannedWordList(config, raw)) });
        return;
    }
    if (/^\s*[#＃!！]?设置违禁词禁言时间/.test(text)) {
        const seconds = toSafeInteger(getRawArgs(event.current)[0]) ?? toSafeInteger((text.match(/\d+/) ?? [])[0]);
        if (!seconds) {
            await message.send({ format: format.addText('请使用：#设置违禁词禁言时间 <秒>') });
            return;
        }
        const value = await setBannedMuteTime(groupId, seconds);
        await message.send({ format: format.addText(`已设置违禁词禁言时间为 ${value} 秒。`) });
        return;
    }
    if (/^\s*[#＃!！]?查看头衔屏蔽词/.test(text)) {
        const config = await getBannedWordsConfig(groupId);
        const img = await renderListImage({
            title: '头衔屏蔽词',
            subTitle: `群 ${groupId}`,
            summary: [`共 ${config.titleWords.length} 个`, config.titleExactMode ? '精确匹配' : '模糊匹配'],
            emptyText: '当前没有头衔屏蔽词。',
            items: config.titleWords.slice(0, 80).map((word, index) => ({
                title: `${index + 1}. ${word}`,
                content: `匹配模式：${config.titleExactMode ? '精确' : '模糊'}`
            }))
        });
        if (img) {
            await message.send({ format: format.addImage(img) });
            return;
        }
        await message.send({ format: format.addText(config.titleWords.length ? `头衔屏蔽词：\n${config.titleWords.join('\n')}` : '当前没有头衔屏蔽词。') });
        return;
    }
    if (/^\s*[#＃!！]?(增加|减少)头衔屏蔽词/.test(text)) {
        const action = /增加/.test(text) ? 'add' : 'del';
        const words = parseCsvWords(stripCommand(text, /^\s*[#＃!！]?(增加|减少)头衔屏蔽词/) || getRawArgText(event.current));
        if (!words.length) {
            await message.send({ format: format.addText('请使用：#增加头衔屏蔽词 <词1,词2>') });
            return;
        }
        const list = await updateTitleWords(groupId, words, action);
        await message.send({ format: format.addText(`已${action === 'add' ? '添加' : '删除'}，当前共 ${list.length} 个头衔屏蔽词。`) });
        return;
    }
    if (/^\s*[#＃!！]?切换头衔屏蔽词匹配/.test(text)) {
        const exact = await toggleTitleExactMode(groupId);
        await message.send({ format: format.addText(`已切换为${exact ? '精确' : '模糊'}匹配。`) });
    }
};

export { bannedWords as default };
