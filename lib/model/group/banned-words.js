import { getRedis, createStoreKey } from '../../adapter/storage.js';

const DEFAULT_CONFIG = {
    muteTime: 300,
    words: [],
    titleWords: [],
    titleExactMode: false
};
const key = (groupId) => createStoreKey('group', String(groupId), 'banned-words.json');
const matchTypeLabels = {
    exact: '精确',
    fuzzy: '模糊',
    regex: '正则'
};
const penaltyTypeLabels = {
    kick: '踢',
    mute: '禁',
    recall: '撤',
    kickRecall: '踢撤',
    muteRecall: '禁撤',
    kickBlack: '踢黑'
};
const normalizeConfig = (value = {}) => {
    return {
        muteTime: Number(value.muteTime) > 0 ? Math.min(Number(value.muteTime), 30 * 24 * 60 * 60) : DEFAULT_CONFIG.muteTime,
        words: Array.isArray(value.words) ? value.words.filter(item => item.word).map(item => ({ ...item })) : [],
        titleWords: Array.isArray(value.titleWords) ? value.titleWords.map(String).filter(Boolean) : [],
        titleExactMode: Boolean(value.titleExactMode)
    };
};
const getBannedWordsConfig = async (groupId) => {
    const raw = await getRedis().get(key(groupId));
    if (!raw)
        return { ...DEFAULT_CONFIG, words: [], titleWords: [] };
    try {
        return normalizeConfig(JSON.parse(raw));
    }
    catch {
        return { ...DEFAULT_CONFIG, words: [], titleWords: [] };
    }
};
const saveBannedWordsConfig = async (groupId, config) => {
    await getRedis().set(key(groupId), JSON.stringify(config));
};
const replaceBannedWordsConfig = async (groupId, value) => {
    const config = normalizeConfig(value);
    await saveBannedWordsConfig(groupId, config);
    return config;
};
const parseBannedMode = (messageText) => {
    const matchType = /模糊/.test(messageText) ? 'fuzzy' : /正则/.test(messageText) ? 'regex' : 'exact';
    let penaltyType = 'mute';
    if (/踢黑/.test(messageText))
        penaltyType = 'kickBlack';
    else if (/踢撤/.test(messageText))
        penaltyType = 'kickRecall';
    else if (/禁撤/.test(messageText))
        penaltyType = 'muteRecall';
    else if (/踢/.test(messageText))
        penaltyType = 'kick';
    else if (/撤/.test(messageText))
        penaltyType = 'recall';
    return { matchType, penaltyType };
};
const addBannedWord = async (groupId, word, matchType, penaltyType, addedBy) => {
    const config = await getBannedWordsConfig(groupId);
    if (config.words.some(item => item.word === word))
        throw new Error(`违禁词 ${word} 已存在。`);
    const item = {
        word,
        matchType,
        penaltyType,
        addedBy,
        date: new Date().toISOString()
    };
    config.words.push(item);
    await saveBannedWordsConfig(groupId, config);
    return item;
};
const deleteBannedWord = async (groupId, word) => {
    const config = await getBannedWordsConfig(groupId);
    const before = config.words.length;
    config.words = config.words.filter(item => item.word !== word);
    await saveBannedWordsConfig(groupId, config);
    return config.words.length !== before;
};
const setBannedMuteTime = async (groupId, seconds) => {
    const config = await getBannedWordsConfig(groupId);
    config.muteTime = Math.min(Math.max(1, seconds), 30 * 24 * 60 * 60);
    await saveBannedWordsConfig(groupId, config);
    return config.muteTime;
};
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const findTriggeredBannedWord = (config, text) => {
    for (const item of config.words) {
        try {
            if (item.matchType === 'exact' && new RegExp(`^${escapeRegExp(item.word)}$`).test(text))
                return item;
            if (item.matchType === 'fuzzy' && text.includes(item.word))
                return item;
            if (item.matchType === 'regex' && new RegExp(item.word).test(text))
                return item;
        }
        catch {
            continue;
        }
    }
    return null;
};
const maskWord = (word) => {
    if (word.length <= 2)
        return word;
    return `${word.slice(0, 2)}${'*'.repeat(Math.max(0, word.length - 2))}`;
};
const formatBannedWord = (item, raw = false) => {
    const time = new Date(item.date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    return [`屏蔽词: ${raw ? item.word : maskWord(item.word)}`, `匹配模式: ${matchTypeLabels[item.matchType]}`, `处理方式: ${penaltyTypeLabels[item.penaltyType]}`, `添加人: ${item.addedBy ?? '未知'}`, `添加时间: ${time}`].join('\n');
};
const formatBannedWordList = (config, raw = false) => {
    if (!config.words.length)
        return '当前群没有违禁词。';
    return [`违禁词列表，共 ${config.words.length} 条`, `禁言时间: ${config.muteTime} 秒`, '━━━━━━━━', ...config.words.map(item => formatBannedWord(item, raw))].join('\n\n');
};
const updateTitleWords = async (groupId, words, action) => {
    const config = await getBannedWordsConfig(groupId);
    const set = new Set(config.titleWords);
    for (const word of words.map(item => item.trim()).filter(Boolean)) {
        if (action === 'add')
            set.add(word);
        else
            set.delete(word);
    }
    config.titleWords = [...set];
    await saveBannedWordsConfig(groupId, config);
    return config.titleWords;
};
const toggleTitleExactMode = async (groupId) => {
    const config = await getBannedWordsConfig(groupId);
    config.titleExactMode = !config.titleExactMode;
    await saveBannedWordsConfig(groupId, config);
    return config.titleExactMode;
};

export { addBannedWord, deleteBannedWord, findTriggeredBannedWord, formatBannedWord, formatBannedWordList, getBannedWordsConfig, maskWord, matchTypeLabels, parseBannedMode, penaltyTypeLabels, replaceBannedWordsConfig, setBannedMuteTime, toggleTitleExactMode, updateTitleWords };
