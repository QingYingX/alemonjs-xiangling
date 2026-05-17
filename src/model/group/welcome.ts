import { createStoreKey, getRedis } from '../../adapter/storage';
import { getXianglingConfig } from '../../config/xiangling';

export type WelcomeKind = 'welcome' | 'exit';

export type GroupWelcomeConfig = {
  enabled: boolean;
  welcomeText: string[];
  exitText: string[];
  welcomeCooldown: number;
};

export type WelcomeInputState = {
  groupId: number;
  userId: string;
  kind: WelcomeKind;
  lines: string[];
  createdAt: string;
};

export const DEFAULT_WELCOME_TEXT = '欢迎加入本群，请遵守群规';
export const DEFAULT_EXIT_TEXT = '乘着西风出发咯~';
export const DEFAULT_KICK_TEXT = '被一脚踹了出去~';
export const DEFAULT_BOT_JOIN_TEXT = '===机器人已加入本群===\n使用 #管理帮助 查看功能列表\n==================';

const getDefaultConfig = (): GroupWelcomeConfig => {
  const config = getXianglingConfig().welcome;
  return {
    enabled: config.enabled,
    welcomeText: [...config.welcome_text],
    exitText: [...config.exit_text],
    welcomeCooldown: config.welcome_cooldown
  };
};

const configKey = (groupId: number): string => createStoreKey('group', String(groupId), 'welcome.json');
const inputKey = (groupId: number, userId: string): string => createStoreKey('group', String(groupId), 'welcome-input', `${userId}.json`);
const cooldownKey = (groupId: number): string => createStoreKey('group', String(groupId), 'welcome-cooldown');

const normalizeConfig = (
  value: Partial<GroupWelcomeConfig> = {},
  fallback = getDefaultConfig()
): GroupWelcomeConfig => ({
  enabled: value.enabled ?? fallback.enabled,
  welcomeText: Array.isArray(value.welcomeText) ? value.welcomeText.map(String).filter(Boolean) : fallback.welcomeText,
  exitText: Array.isArray(value.exitText) ? value.exitText.map(String).filter(Boolean) : fallback.exitText,
  welcomeCooldown: Number(value.welcomeCooldown) >= 0 ? Math.min(Number(value.welcomeCooldown), 24 * 60 * 60) : fallback.welcomeCooldown
});

export const getWelcomeConfig = async (groupId: number): Promise<GroupWelcomeConfig> => {
  const raw = await getRedis().get(configKey(groupId));
  if (!raw) return getDefaultConfig();
  try {
    return normalizeConfig(JSON.parse(raw) as Partial<GroupWelcomeConfig>);
  } catch {
    return getDefaultConfig();
  }
};

const saveWelcomeConfig = async (groupId: number, config: GroupWelcomeConfig) => {
  await getRedis().set(configKey(groupId), JSON.stringify(config));
};

export const setWelcomeConfig = async (groupId: number, value: Partial<GroupWelcomeConfig>): Promise<GroupWelcomeConfig> => {
  const config = normalizeConfig(value, await getWelcomeConfig(groupId));
  await saveWelcomeConfig(groupId, config);
  return config;
};

export const setWelcomeLines = async (groupId: number, kind: WelcomeKind, lines: string[]) => {
  const config = await getWelcomeConfig(groupId);
  if (kind === 'welcome') config.welcomeText = lines;
  else config.exitText = lines;
  await saveWelcomeConfig(groupId, config);
  return config;
};

export const resetWelcomeLines = async (groupId: number, kind: WelcomeKind) => {
  return setWelcomeLines(groupId, kind, []);
};

export const startWelcomeInput = async (groupId: number, userId: string, kind: WelcomeKind) => {
  const state: WelcomeInputState = { groupId, userId, kind, lines: [], createdAt: new Date().toISOString() };
  await getRedis().set(inputKey(groupId, userId), JSON.stringify(state), 'EX', 300);
  return state;
};

export const getWelcomeInput = async (groupId: number, userId: string): Promise<WelcomeInputState | null> => {
  const raw = await getRedis().get(inputKey(groupId, userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as WelcomeInputState;
  } catch {
    return null;
  }
};

export const appendWelcomeInputLine = async (groupId: number, userId: string, line: string): Promise<WelcomeInputState | null> => {
  const state = await getWelcomeInput(groupId, userId);
  if (!state) return null;
  const next = { ...state, lines: [...state.lines, line].filter(Boolean) };
  await getRedis().set(inputKey(groupId, userId), JSON.stringify(next), 'EX', 300);
  return next;
};

export const finishWelcomeInput = async (groupId: number, userId: string): Promise<WelcomeInputState | null> => {
  const state = await getWelcomeInput(groupId, userId);
  await getRedis().del(inputKey(groupId, userId));
  return state;
};

export const cancelWelcomeInput = async (groupId: number, userId: string) => {
  await getRedis().del(inputKey(groupId, userId));
};

export const getWelcomeLines = (config: GroupWelcomeConfig, kind: WelcomeKind): string[] => {
  const lines = kind === 'welcome' ? config.welcomeText : config.exitText;
  if (lines.length) return lines;
  const defaults = getXianglingConfig().welcome;
  return [kind === 'welcome' ? defaults.default_welcome : defaults.default_exit];
};

export const getKickText = (): string => getXianglingConfig().welcome.default_kick;

export const getBotJoinText = (): string => getXianglingConfig().welcome.bot_join_text;

export const isWelcomeCooldown = async (groupId: number): Promise<boolean> => Boolean(await getRedis().get(cooldownKey(groupId)));

export const setWelcomeCooldown = async (groupId: number, seconds: number) => {
  if (seconds <= 0) return;
  await getRedis().set(cooldownKey(groupId), '1', 'EX', seconds);
};

export const formatWelcomeConfig = (kind: WelcomeKind, config: GroupWelcomeConfig): string => {
  const label = kind === 'welcome' ? '欢迎' : '退出';
  const lines = getWelcomeLines(config, kind);
  const usingDefault = (kind === 'welcome' ? config.welcomeText : config.exitText).length === 0;
  return [`当前${label}消息：`, ...lines, '', usingDefault ? '状态：使用默认消息' : '状态：使用自定义消息'].join('\n').trim();
};
