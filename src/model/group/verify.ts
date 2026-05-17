import { logger, type EventKeys, type Events } from 'alemonjs';
import { createStoreKey, getRedis } from '../../adapter/storage';
import { getXianglingConfig } from '../../config/xiangling';
import { toSafeInteger } from './admin';
import { isInList } from './lists';
import { getGroupMemberRole, type GroupRole } from './permissions';

export type VerifyMode = '计算' | '提交';

export type RepoVerifyConfig = {
  platform: 'github' | 'gitee';
  owner: string;
  repo: string;
  branch: string;
};

export type VerifyGroupConfig = {
  mode: VerifyMode;
  repoVerify?: Partial<RepoVerifyConfig>;
};

export type VerifyConfig = {
  enabledGroups: Record<string, VerifyGroupConfig>;
  time: number;
  times: number;
  delayTime: number;
  remindAtLastMinute: boolean;
  repoVerify: RepoVerifyConfig;
  range: { min: number; max: number };
};

export type VerifyState = {
  groupId: number;
  userId: number;
  mode: VerifyMode;
  verifyCode: string;
  fullCode?: string;
  questionText: string;
  remainTimes: number;
  expireAt: number;
  verifyMsgId?: number | null;
  failMsgId?: number | null;
  remindMsgId?: number | null;
  lastFailAt?: number;
};

const getDefaultConfig = (): VerifyConfig => {
  const config = getXianglingConfig().group_verify;
  return {
    enabledGroups: { ...config.groups },
    time: config.time,
    times: config.times,
    delayTime: config.delay_time,
    remindAtLastMinute: config.remind_at_last_minute,
    repoVerify: {
      platform: 'github',
      owner: 'QingYingX-Bot',
      repo: 'RobotManagement-plugin',
      branch: 'master'
    },
    range: { ...config.range }
  };
};

const configKey = (): string => createStoreKey('group-verify', 'config.json');
const stateKey = (groupId: number, userId: number): string => createStoreKey('group-verify', String(groupId), `${userId}.json`);
const verifyKickKey = (groupId: number, userId: number): string => createStoreKey('group-verify', 'kick', `${groupId}:${userId}`);

const normalizeRepoVerify = (value: unknown, fallback: RepoVerifyConfig): RepoVerifyConfig => {
  const record = value && typeof value === 'object' ? value as Partial<RepoVerifyConfig> : {};
  const platform = String(record.platform || fallback.platform).toLowerCase();
  return {
    platform: platform === 'gitee' ? 'gitee' : 'github',
    owner: String(record.owner || fallback.owner).trim(),
    repo: String(record.repo || fallback.repo).trim(),
    branch: String(record.branch || fallback.branch).trim() || fallback.branch
  };
};

const normalizeGroupConfig = (value: unknown, fallback: VerifyGroupConfig = { mode: '计算' }): VerifyGroupConfig => {
  const record = value && typeof value === 'object' ? value as VerifyGroupConfig : fallback;
  return {
    mode: record.mode === '提交' ? '提交' : '计算',
    repoVerify: record.repoVerify && typeof record.repoVerify === 'object' ? { ...record.repoVerify } : undefined
  };
};

const normalizeEnabledGroups = (value: unknown, fallback: Record<string, VerifyGroupConfig>): Record<string, VerifyGroupConfig> => {
  if (!value || typeof value !== 'object') return fallback;
  return Object.fromEntries(Object.entries(value).map(([groupId, groupConfig]) => [groupId, normalizeGroupConfig(groupConfig)]));
};

const normalizeConfig = (value: Partial<VerifyConfig> = {}, fallback = getDefaultConfig()): VerifyConfig => ({
  enabledGroups: normalizeEnabledGroups(value.enabledGroups, fallback.enabledGroups),
  time: Number(value.time) > 0 ? Math.min(Number(value.time), 24 * 60 * 60) : fallback.time,
  times: Number(value.times) > 0 ? Math.min(Number(value.times), 10) : fallback.times,
  delayTime: Number(value.delayTime) >= 0 ? Math.min(Number(value.delayTime), 60) : fallback.delayTime,
  remindAtLastMinute: typeof value.remindAtLastMinute === 'boolean' ? value.remindAtLastMinute : fallback.remindAtLastMinute,
  repoVerify: normalizeRepoVerify(value.repoVerify, fallback.repoVerify),
  range: {
    min: Number(value.range?.min) >= 0 ? Number(value.range?.min) : fallback.range.min,
    max: Number(value.range?.max) > 0 ? Number(value.range?.max) : fallback.range.max
  }
});

export const getVerifyConfig = async (): Promise<VerifyConfig> => {
  const raw = await getRedis().get(configKey());
  if (!raw) return getDefaultConfig();
  try {
    return normalizeConfig(JSON.parse(raw) as Partial<VerifyConfig>);
  } catch {
    return getDefaultConfig();
  }
};

const saveVerifyConfig = async (config: VerifyConfig) => {
  await getRedis().set(configKey(), JSON.stringify(normalizeConfig(config)));
};

export const setVerifyConfig = async (value: Partial<VerifyConfig>): Promise<VerifyConfig> => {
  const config = normalizeConfig(value);
  await saveVerifyConfig(config);
  return config;
};

export const isVerifyGroup = async (groupId: number): Promise<boolean> => {
  const config = await getVerifyConfig();
  return Boolean(config.enabledGroups[String(groupId)]);
};

export const setVerifyGroup = async (groupId: number, enabled: boolean): Promise<{ changed: boolean; config: VerifyConfig }> => {
  const config = await getVerifyConfig();
  const id = String(groupId);
  const exists = Boolean(config.enabledGroups[id]);
  if (enabled && exists) return { changed: false, config };
  if (!enabled && !exists) return { changed: false, config };
  if (enabled) config.enabledGroups[id] = { mode: '计算' };
  else delete config.enabledGroups[id];
  await saveVerifyConfig(config);
  return { changed: true, config };
};

export const getVerifyMode = async (groupId: number): Promise<VerifyMode> => {
  const config = await getVerifyConfig();
  return config.enabledGroups[String(groupId)]?.mode === '提交' ? '提交' : '计算';
};

export const setVerifyMode = async (groupId: number, mode: VerifyMode): Promise<VerifyConfig> => {
  const config = await getVerifyConfig();
  config.enabledGroups[String(groupId)] = { ...config.enabledGroups[String(groupId)], mode };
  await saveVerifyConfig(config);
  return config;
};

export const setVerifyTimeout = async (seconds: number): Promise<VerifyConfig> => {
  const config = await getVerifyConfig();
  config.time = seconds;
  await saveVerifyConfig(config);
  return config;
};

export const buildCalcVerifyState = async (groupId: number, userId: number): Promise<VerifyState> => {
  const config = await getVerifyConfig();
  const min = Math.min(config.range.min, config.range.max);
  const max = Math.max(config.range.min, config.range.max);
  let left = Math.floor(Math.random() * (max - min + 1)) + min;
  let right = Math.floor(Math.random() * (max - min + 1)) + min;
  while (max > min && left === right) {
    right = Math.floor(Math.random() * (max - min + 1)) + min;
  }
  const plus = Math.random() >= 0.5;
  const a = plus ? left : Math.max(left, right);
  const b = plus ? right : Math.min(left, right);
  const answer = plus ? a + b : a - b;
  return {
    groupId,
    userId,
    mode: '计算',
    verifyCode: String(answer),
    questionText: `「${a} ${plus ? '+' : '-'} ${b}」的运算结果`,
    remainTimes: config.times,
    expireAt: Date.now() + config.time * 1000,
    verifyMsgId: null,
    failMsgId: null,
    remindMsgId: null,
    lastFailAt: 0
  };
};

const getRepoVerifyConfig = async (groupId: number): Promise<RepoVerifyConfig> => {
  const config = await getVerifyConfig();
  const groupConfig = config.enabledGroups[String(groupId)];
  return normalizeRepoVerify(groupConfig?.repoVerify, config.repoVerify);
};

const fetchLatestCommit = async (config: RepoVerifyConfig): Promise<{ sha: string }> => {
  if (!config.owner || !config.repo) {
    throw new Error('请先配置 repoVerify.owner 与 repoVerify.repo');
  }
  const url = config.platform === 'gitee'
    ? `https://gitee.com/api/v5/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/commits/${encodeURIComponent(config.branch)}`
    : `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/commits/${encodeURIComponent(config.branch)}`;
  const response = await fetch(url, { headers: { 'User-Agent': 'alemonjs-xiangling' } });
  if (!response.ok) throw new Error(`请求仓库提交失败: ${response.status} ${response.statusText}`);
  const data = await response.json() as { sha?: unknown; commit?: { sha?: unknown } };
  const sha = String(data.sha || data.commit?.sha || '').toLowerCase();
  if (!/^[0-9a-f]{40}$/i.test(sha)) throw new Error('仓库接口未返回有效提交 Hash');
  return { sha };
};

const buildCommitVerifyState = async (groupId: number, userId: number): Promise<VerifyState> => {
  const config = await getVerifyConfig();
  const repoConfig = await getRepoVerifyConfig(groupId);
  const commit = await fetchLatestCommit(repoConfig);
  const shortHash = commit.sha.slice(0, 7);
  return {
    groupId,
    userId,
    mode: '提交',
    verifyCode: shortHash,
    fullCode: commit.sha,
    questionText: `「${repoConfig.platform}/${repoConfig.owner}/${repoConfig.repo}」最新提交 Hash\n支持 7 位短 Hash 或完整 Hash`,
    remainTimes: config.times,
    expireAt: Date.now() + config.time * 1000,
    verifyMsgId: null,
    failMsgId: null,
    remindMsgId: null,
    lastFailAt: 0
  };
};

export const buildVerifyState = async (groupId: number, userId: number): Promise<VerifyState> => {
  if (await getVerifyMode(groupId) === '提交') {
    try {
      return await buildCommitVerifyState(groupId, userId);
    } catch (error) {
      logger.warn(`xiangling commit verify fallback to calc: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return buildCalcVerifyState(groupId, userId);
};

export const saveVerifyState = async (state: VerifyState): Promise<VerifyState> => {
  const ttl = Math.max(60, Math.ceil((state.expireAt - Date.now()) / 1000) + 60);
  await getRedis().set(stateKey(state.groupId, state.userId), JSON.stringify(state), 'EX', ttl);
  return state;
};

export const getVerifyState = async (groupId: number, userId: number): Promise<VerifyState | null> => {
  const raw = await getRedis().get(stateKey(groupId, userId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VerifyState;
  } catch {
    return null;
  }
};

export const deleteVerifyState = async (groupId: number, userId: number) => {
  await getRedis().del(stateKey(groupId, userId));
};

export const markVerifyKick = async (groupId: number, userId: number): Promise<void> => {
  await getRedis().set(verifyKickKey(groupId, userId), '1', 'EX', 60);
};

export const consumeVerifyKick = async (groupId: number, userId: number): Promise<boolean> => {
  const key = verifyKickKey(groupId, userId);
  const exists = Boolean(await getRedis().get(key));
  if (exists) await getRedis().del(key);
  return exists;
};

export const checkVerifyAnswer = (message: string, state: VerifyState): boolean => {
  if (state.mode === '提交') {
    const shortHash = String(state.verifyCode || '').toLowerCase();
    const fullHash = String(state.fullCode || '').toLowerCase();
    const matches = String(message || '').matchAll(/(^|[^0-9a-f])([0-9a-f]{40}|[0-9a-f]{7})(?![0-9a-f])/ig);
    for (const match of matches) {
      const text = match[2].toLowerCase();
      if (text === shortHash || text === fullHash) return true;
    }
    return false;
  }
  const code = state.verifyCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|\\D)${code}(?!\\d)`).test(message);
};

const isAdminRole = (role: GroupRole): boolean => role === 'owner' || role === 'admin';

export const shouldVerifyJoin = async <T extends EventKeys>(event: Events[T], groupId: number, userId: number): Promise<boolean> => {
  if (!await isVerifyGroup(groupId)) return false;
  if (event.IsMaster) return false;

  const botId = toSafeInteger(event.BotId);
  if (botId && userId === botId) return false;

  if (botId) {
    const botRole = await getGroupMemberRole(event, groupId, botId);
    if (botRole === 'member') {
      logger.info(`xiangling skip join verify because bot is not group admin: group=${groupId} role=${botRole || 'unknown'}`);
      return false;
    }
    if (!botRole) {
      logger.info(`xiangling bot group role unknown, continue join verify: group=${groupId}`);
    }
  }

  if (await isInList('white', userId)) return false;

  const raw = event.value as { sub_type?: unknown; operator_id?: unknown } | undefined;
  const operatorId = toSafeInteger(raw?.operator_id);
  const isInvite = raw?.sub_type === 'invite';
  if (isInvite && operatorId && operatorId !== userId && operatorId !== botId) {
    const operatorRole = await getGroupMemberRole(event, groupId, operatorId);
    if (isAdminRole(operatorRole)) return false;
  }

  return true;
};
