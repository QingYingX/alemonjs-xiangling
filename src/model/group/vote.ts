import { createStoreKey, getRedis } from '../../adapter/storage';
import { getXianglingConfig } from '../../config/xiangling';

export type VoteType = 'ban' | 'kick';

export type VoteConfig = {
  voteBan: boolean;
  voteKick: boolean;
  outTime: number;
  minNum: number;
  banTime: number;
  veto: boolean;
  voteAdmin: boolean;
};

export type VoteState = {
  groupId: number;
  targetUserId: number;
  creatorUserId: number;
  type: VoteType;
  support: string[];
  oppose: string[];
  createdAt: number;
  expireAt: number;
  ended: boolean;
};

const getDefaultConfig = (): VoteConfig => {
  const config = getXianglingConfig().group_vote;
  return {
    voteBan: config.vote_ban,
    voteKick: config.vote_kick,
    outTime: config.out_time,
    minNum: config.min_num,
    banTime: config.ban_time,
    veto: config.veto,
    voteAdmin: config.vote_admin
  };
};

const configKey = (): string => createStoreKey('group-vote', 'config.json');
const voteKey = (groupId: number, targetUserId: number): string => createStoreKey('group-vote', String(groupId), `${targetUserId}.json`);

const normalizeConfig = (value: Partial<VoteConfig> = {}, fallback = getDefaultConfig()): VoteConfig => ({
  voteBan: value.voteBan ?? fallback.voteBan,
  voteKick: value.voteKick ?? fallback.voteKick,
  outTime: Number(value.outTime) > 0 ? Math.min(Number(value.outTime), 24 * 60 * 60) : fallback.outTime,
  minNum: Number(value.minNum) > 0 ? Math.min(Number(value.minNum), 500) : fallback.minNum,
  banTime: Number(value.banTime) > 0 ? Math.min(Number(value.banTime), 30 * 24 * 60 * 60) : fallback.banTime,
  veto: value.veto ?? fallback.veto,
  voteAdmin: value.voteAdmin ?? fallback.voteAdmin
});

export const getVoteConfig = async (): Promise<VoteConfig> => {
  const raw = await getRedis().get(configKey());
  if (!raw) return getDefaultConfig();
  try {
    return normalizeConfig(JSON.parse(raw) as Partial<VoteConfig>);
  } catch {
    return getDefaultConfig();
  }
};

const saveVoteConfig = async (config: VoteConfig) => {
  await getRedis().set(configKey(), JSON.stringify(normalizeConfig(config)));
};

export const setVoteConfig = async (value: Partial<VoteConfig>): Promise<VoteConfig> => {
  const config = normalizeConfig(value);
  await saveVoteConfig(config);
  return config;
};

export const setVoteSwitch = async (type: VoteType, enabled: boolean): Promise<{ changed: boolean; config: VoteConfig }> => {
  const config = await getVoteConfig();
  const key = type === 'ban' ? 'voteBan' : 'voteKick';
  if (config[key] === enabled) return { changed: false, config };
  config[key] = enabled;
  await saveVoteConfig(config);
  return { changed: true, config };
};

export const setVoteNumberConfig = async (name: 'outTime' | 'minNum' | 'banTime', value: number): Promise<VoteConfig> => {
  const config = await getVoteConfig();
  config[name] = value;
  await saveVoteConfig(config);
  return normalizeConfig(config);
};

export const setVoteBooleanConfig = async (name: 'veto' | 'voteAdmin', value: boolean): Promise<{ changed: boolean; config: VoteConfig }> => {
  const config = await getVoteConfig();
  if (config[name] === value) return { changed: false, config };
  config[name] = value;
  await saveVoteConfig(config);
  return { changed: true, config: normalizeConfig(config) };
};

export const formatVoteConfig = (config: VoteConfig): string => [
  '投票配置参数：',
  `投票禁言：${config.voteBan ? '启用' : '禁用'}`,
  `投票踢人：${config.voteKick ? '启用' : '禁用'}`,
  `超时时间：${config.outTime}秒`,
  `最低票数：${config.minNum}票`,
  `禁言时间：${config.banTime}秒`,
  `管理员一票权：${config.veto ? '启用' : '禁用'}`,
  `允许投票管理员：${config.voteAdmin ? '启用' : '禁用'}`,
  '',
  '示例：#投票设置禁言时间8600 / #启用管理员一票权 / #启用投票管理员'
].join('\n');

export const getVoteState = async (groupId: number, targetUserId: number): Promise<VoteState | null> => {
  const raw = await getRedis().get(voteKey(groupId, targetUserId));
  if (!raw) return null;
  try {
    const state = JSON.parse(raw) as VoteState;
    return state.ended ? null : state;
  } catch {
    return null;
  }
};

export const createVoteState = async (state: VoteState, ttlSeconds: number): Promise<VoteState> => {
  await getRedis().set(voteKey(state.groupId, state.targetUserId), JSON.stringify(state), 'EX', ttlSeconds + 120);
  return state;
};

export const updateVoteState = async (state: VoteState): Promise<VoteState> => {
  const ttl = Math.max(120, Math.ceil((state.expireAt - Date.now()) / 1000) + 120);
  await getRedis().set(voteKey(state.groupId, state.targetUserId), JSON.stringify(state), 'EX', ttl);
  return state;
};

export const endVoteState = async (groupId: number, targetUserId: number): Promise<VoteState | null> => {
  const state = await getVoteState(groupId, targetUserId);
  await getRedis().del(voteKey(groupId, targetUserId));
  return state;
};

export const addVote = (state: VoteState, userId: number | string, support: boolean): { changed: boolean; state: VoteState } => {
  const id = String(userId);
  if (state.support.includes(id) || state.oppose.includes(id)) return { changed: false, state };
  const next: VoteState = support
    ? { ...state, support: [...state.support, id] }
    : { ...state, oppose: [...state.oppose, id] };
  return { changed: true, state: next };
};

export const isVoteSuccess = (state: VoteState, config: VoteConfig): boolean => {
  return state.support.length > state.oppose.length && state.support.length >= config.minNum;
};

export const formatVoteResult = (state: VoteState, config: VoteConfig): string => {
  const success = isVoteSuccess(state, config);
  const action = state.type === 'ban' ? '禁言' : '踢出';
  return [
    '投票结束，投票结果：',
    `支持票数：${state.support.length}`,
    `反对票数：${state.oppose.length}`,
    success ? `支持票数大于反对票且达到最低票数，投票成功，${action}目标。` : `反对票数大于支持票数或支持票数小于${config.minNum}，投票失败。`
  ].join('\n');
};
