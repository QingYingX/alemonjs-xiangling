import { createStoreKey, getRedis } from '../../adapter/storage';

export type BannedMatchType = 'exact' | 'fuzzy' | 'regex';
export type BannedPenaltyType = 'kick' | 'mute' | 'recall' | 'kickRecall' | 'muteRecall' | 'kickBlack';

export type BannedWord = {
  word: string;
  matchType: BannedMatchType;
  penaltyType: BannedPenaltyType;
  addedBy?: string;
  date: string;
};

export type GroupBannedWordsConfig = {
  muteTime: number;
  words: BannedWord[];
  titleWords: string[];
  titleExactMode: boolean;
};

const DEFAULT_CONFIG: GroupBannedWordsConfig = {
  muteTime: 300,
  words: [],
  titleWords: [],
  titleExactMode: false
};

const key = (groupId: number): string => createStoreKey('group', String(groupId), 'banned-words.json');

export const matchTypeLabels: Record<BannedMatchType, string> = {
  exact: '精确',
  fuzzy: '模糊',
  regex: '正则'
};

export const penaltyTypeLabels: Record<BannedPenaltyType, string> = {
  kick: '踢',
  mute: '禁',
  recall: '撤',
  kickRecall: '踢撤',
  muteRecall: '禁撤',
  kickBlack: '踢黑'
};

const normalizeConfig = (value: Partial<GroupBannedWordsConfig> = {}): GroupBannedWordsConfig => {
  return {
    muteTime: Number(value.muteTime) > 0 ? Math.min(Number(value.muteTime), 30 * 24 * 60 * 60) : DEFAULT_CONFIG.muteTime,
    words: Array.isArray(value.words) ? value.words.filter(item => item.word).map(item => ({ ...item })) : [],
    titleWords: Array.isArray(value.titleWords) ? value.titleWords.map(String).filter(Boolean) : [],
    titleExactMode: Boolean(value.titleExactMode)
  };
};

export const getBannedWordsConfig = async (groupId: number): Promise<GroupBannedWordsConfig> => {
  const raw = await getRedis().get(key(groupId));
  if (!raw) return { ...DEFAULT_CONFIG, words: [], titleWords: [] };
  try {
    return normalizeConfig(JSON.parse(raw) as Partial<GroupBannedWordsConfig>);
  } catch {
    return { ...DEFAULT_CONFIG, words: [], titleWords: [] };
  }
};

const saveBannedWordsConfig = async (groupId: number, config: GroupBannedWordsConfig) => {
  await getRedis().set(key(groupId), JSON.stringify(config));
};

export const replaceBannedWordsConfig = async (
  groupId: number,
  value: Partial<GroupBannedWordsConfig>
): Promise<GroupBannedWordsConfig> => {
  const config = normalizeConfig(value);
  await saveBannedWordsConfig(groupId, config);
  return config;
};

export const parseBannedMode = (messageText: string): { matchType: BannedMatchType; penaltyType: BannedPenaltyType } => {
  const matchType = /模糊/.test(messageText) ? 'fuzzy' : /正则/.test(messageText) ? 'regex' : 'exact';
  let penaltyType: BannedPenaltyType = 'mute';
  if (/踢黑/.test(messageText)) penaltyType = 'kickBlack';
  else if (/踢撤/.test(messageText)) penaltyType = 'kickRecall';
  else if (/禁撤/.test(messageText)) penaltyType = 'muteRecall';
  else if (/踢/.test(messageText)) penaltyType = 'kick';
  else if (/撤/.test(messageText)) penaltyType = 'recall';
  return { matchType, penaltyType };
};

export const addBannedWord = async (groupId: number, word: string, matchType: BannedMatchType, penaltyType: BannedPenaltyType, addedBy?: string): Promise<BannedWord> => {
  const config = await getBannedWordsConfig(groupId);
  if (config.words.some(item => item.word === word)) throw new Error(`违禁词 ${word} 已存在。`);

  if (matchType === 'regex') {
    new RegExp(word);
  }

  const item: BannedWord = {
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

export const deleteBannedWord = async (groupId: number, word: string): Promise<boolean> => {
  const config = await getBannedWordsConfig(groupId);
  const before = config.words.length;
  config.words = config.words.filter(item => item.word !== word);
  await saveBannedWordsConfig(groupId, config);
  return config.words.length !== before;
};

export const setBannedMuteTime = async (groupId: number, seconds: number): Promise<number> => {
  const config = await getBannedWordsConfig(groupId);
  config.muteTime = Math.min(Math.max(1, seconds), 30 * 24 * 60 * 60);
  await saveBannedWordsConfig(groupId, config);
  return config.muteTime;
};

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const findTriggeredBannedWord = (config: GroupBannedWordsConfig, text: string): BannedWord | null => {
  for (const item of config.words) {
    try {
      if (item.matchType === 'exact' && new RegExp(`^${escapeRegExp(item.word)}$`).test(text)) return item;
      if (item.matchType === 'fuzzy' && text.includes(item.word)) return item;
      if (item.matchType === 'regex' && new RegExp(item.word).test(text)) return item;
    } catch {
      continue;
    }
  }
  return null;
};

export const maskWord = (word: string): string => {
  if (word.length <= 2) return word;
  return `${word.slice(0, 2)}${'*'.repeat(Math.max(0, word.length - 2))}`;
};

export const formatBannedWord = (item: BannedWord, raw = false): string => {
  const time = new Date(item.date).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  return [`屏蔽词: ${raw ? item.word : maskWord(item.word)}`, `匹配模式: ${matchTypeLabels[item.matchType]}`, `处理方式: ${penaltyTypeLabels[item.penaltyType]}`, `添加人: ${item.addedBy ?? '未知'}`, `添加时间: ${time}`].join('\n');
};

export const formatBannedWordList = (config: GroupBannedWordsConfig, raw = false): string => {
  if (!config.words.length) return '当前群没有违禁词。';
  return [`违禁词列表，共 ${config.words.length} 条`, `禁言时间: ${config.muteTime} 秒`, '━━━━━━━━', ...config.words.map(item => formatBannedWord(item, raw))].join('\n\n');
};

export const updateTitleWords = async (groupId: number, words: string[], action: 'add' | 'del'): Promise<string[]> => {
  const config = await getBannedWordsConfig(groupId);
  const set = new Set(config.titleWords);
  for (const word of words.map(item => item.trim()).filter(Boolean)) {
    if (action === 'add') set.add(word);
    else set.delete(word);
  }
  config.titleWords = [...set];
  await saveBannedWordsConfig(groupId, config);
  return config.titleWords;
};

export const toggleTitleExactMode = async (groupId: number): Promise<boolean> => {
  const config = await getBannedWordsConfig(groupId);
  config.titleExactMode = !config.titleExactMode;
  await saveBannedWordsConfig(groupId, config);
  return config.titleExactMode;
};
