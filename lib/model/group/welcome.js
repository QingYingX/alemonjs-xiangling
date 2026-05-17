import { getRedis, createStoreKey } from '../../adapter/storage.js';
import { getXianglingConfig } from '../../config/xiangling.js';

const DEFAULT_WELCOME_TEXT = '欢迎加入本群，请遵守群规';
const DEFAULT_EXIT_TEXT = '乘着西风出发咯~';
const DEFAULT_KICK_TEXT = '被一脚踹了出去~';
const DEFAULT_BOT_JOIN_TEXT = '===机器人已加入本群===\n使用 #管理帮助 查看功能列表\n==================';
const getDefaultConfig = () => {
    const config = getXianglingConfig().welcome;
    return {
        enabled: config.enabled,
        welcomeText: [...config.welcome_text],
        exitText: [...config.exit_text],
        welcomeCooldown: config.welcome_cooldown
    };
};
const configKey = (groupId) => createStoreKey('group', String(groupId), 'welcome.json');
const inputKey = (groupId, userId) => createStoreKey('group', String(groupId), 'welcome-input', `${userId}.json`);
const cooldownKey = (groupId) => createStoreKey('group', String(groupId), 'welcome-cooldown');
const normalizeConfig = (value = {}, fallback = getDefaultConfig()) => ({
    enabled: value.enabled ?? fallback.enabled,
    welcomeText: Array.isArray(value.welcomeText) ? value.welcomeText.map(String).filter(Boolean) : fallback.welcomeText,
    exitText: Array.isArray(value.exitText) ? value.exitText.map(String).filter(Boolean) : fallback.exitText,
    welcomeCooldown: Number(value.welcomeCooldown) >= 0 ? Math.min(Number(value.welcomeCooldown), 24 * 60 * 60) : fallback.welcomeCooldown
});
const getWelcomeConfig = async (groupId) => {
    const raw = await getRedis().get(configKey(groupId));
    if (!raw)
        return getDefaultConfig();
    try {
        return normalizeConfig(JSON.parse(raw));
    }
    catch {
        return getDefaultConfig();
    }
};
const saveWelcomeConfig = async (groupId, config) => {
    await getRedis().set(configKey(groupId), JSON.stringify(config));
};
const setWelcomeConfig = async (groupId, value) => {
    const config = normalizeConfig(value, await getWelcomeConfig(groupId));
    await saveWelcomeConfig(groupId, config);
    return config;
};
const setWelcomeLines = async (groupId, kind, lines) => {
    const config = await getWelcomeConfig(groupId);
    if (kind === 'welcome')
        config.welcomeText = lines;
    else
        config.exitText = lines;
    await saveWelcomeConfig(groupId, config);
    return config;
};
const resetWelcomeLines = async (groupId, kind) => {
    return setWelcomeLines(groupId, kind, []);
};
const startWelcomeInput = async (groupId, userId, kind) => {
    const state = { groupId, userId, kind, lines: [], createdAt: new Date().toISOString() };
    await getRedis().set(inputKey(groupId, userId), JSON.stringify(state), 'EX', 300);
    return state;
};
const getWelcomeInput = async (groupId, userId) => {
    const raw = await getRedis().get(inputKey(groupId, userId));
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
};
const appendWelcomeInputLine = async (groupId, userId, line) => {
    const state = await getWelcomeInput(groupId, userId);
    if (!state)
        return null;
    const next = { ...state, lines: [...state.lines, line].filter(Boolean) };
    await getRedis().set(inputKey(groupId, userId), JSON.stringify(next), 'EX', 300);
    return next;
};
const finishWelcomeInput = async (groupId, userId) => {
    const state = await getWelcomeInput(groupId, userId);
    await getRedis().del(inputKey(groupId, userId));
    return state;
};
const cancelWelcomeInput = async (groupId, userId) => {
    await getRedis().del(inputKey(groupId, userId));
};
const getWelcomeLines = (config, kind) => {
    const lines = kind === 'welcome' ? config.welcomeText : config.exitText;
    if (lines.length)
        return lines;
    const defaults = getXianglingConfig().welcome;
    return [kind === 'welcome' ? defaults.default_welcome : defaults.default_exit];
};
const getKickText = () => getXianglingConfig().welcome.default_kick;
const getBotJoinText = () => getXianglingConfig().welcome.bot_join_text;
const isWelcomeCooldown = async (groupId) => Boolean(await getRedis().get(cooldownKey(groupId)));
const setWelcomeCooldown = async (groupId, seconds) => {
    if (seconds <= 0)
        return;
    await getRedis().set(cooldownKey(groupId), '1', 'EX', seconds);
};
const formatWelcomeConfig = (kind, config) => {
    const label = kind === 'welcome' ? '欢迎' : '退出';
    const lines = getWelcomeLines(config, kind);
    const usingDefault = (kind === 'welcome' ? config.welcomeText : config.exitText).length === 0;
    return [`当前${label}消息：`, ...lines, '', usingDefault ? '状态：使用默认消息' : '状态：使用自定义消息'].join('\n').trim();
};

export { DEFAULT_BOT_JOIN_TEXT, DEFAULT_EXIT_TEXT, DEFAULT_KICK_TEXT, DEFAULT_WELCOME_TEXT, appendWelcomeInputLine, cancelWelcomeInput, finishWelcomeInput, formatWelcomeConfig, getBotJoinText, getKickText, getWelcomeConfig, getWelcomeInput, getWelcomeLines, isWelcomeCooldown, resetWelcomeLines, setWelcomeConfig, setWelcomeCooldown, setWelcomeLines, startWelcomeInput };
