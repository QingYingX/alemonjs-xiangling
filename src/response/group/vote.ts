import { Format, logger, useEvent, useMention, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import { normalizeGroupMemberInfo } from '../../adapter/onebot';
import ListCardImage, { type ListCardData } from '../../image/component/list-card';
import { getEventGroupId, getRawArgText, getRawArgs, toSafeInteger } from '../../model/group/admin';
import { getGroupRole, hasBotGroupAdminPermission, hasBotGroupOwnerPermission, hasGroupAdminPermission, isMasterUser } from '../../model/group/permissions';
import { addVote, createVoteState, endVoteState, formatVoteConfig, formatVoteResult, getVoteConfig, getVoteState, isVoteSuccess, setVoteBooleanConfig, setVoteNumberConfig, setVoteSwitch, updateVoteState, type VoteConfig, type VoteState, type VoteType } from '../../model/group/vote';

const settingMap: Record<string, 'outTime' | 'minNum' | 'banTime'> = {
  超时时间: 'outTime',
  最低票数: 'minNum',
  禁言时间: 'banTime'
};

const voteTypeLabel = (type: VoteType): string => type === 'ban' ? '禁言' : '踢人';

const voteBooleanSetting = (text: string): { key: 'veto' | 'voteAdmin'; label: string } | null => {
  if (/管理员一票权/.test(text)) return { key: 'veto', label: '管理员一票权' };
  if (/投票管理员/.test(text)) return { key: 'voteAdmin', label: '允许投票管理员' };
  return null;
};

const sendText = async (text: string) => {
  const [message] = useMessage();
  await message.send({ format: Format.create().addText(text) });
};

const renderListImage = async (data: ListCardData): Promise<Buffer | null> => {
  try {
    return await renderComponentIsHtmlToBuffer(ListCardImage, { data }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
  } catch (error) {
    logger.warn(`vote image render failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

const sendImageOrText = async (data: ListCardData, fallback: string) => {
  const [message] = useMessage();
  const img = await renderListImage(data);
  await message.send({ format: img ? Format.create().addImage(img) : Format.create().addText(fallback) });
};

const buildVoteConfigCard = (config: VoteConfig): ListCardData => ({
  title: '投票设置',
  subTitle: '群组投票禁言 / 投票踢人配置',
  summary: [`禁言${config.voteBan ? '启用' : '禁用'}`, `踢人${config.voteKick ? '启用' : '禁用'}`, `最低 ${config.minNum} 票`],
  items: [
    { title: '投票禁言', content: config.voteBan ? '已启用' : '已禁用', tags: [config.voteBan ? '开启' : '关闭'] },
    { title: '投票踢人', content: config.voteKick ? '已启用' : '已禁用', tags: [config.voteKick ? '开启' : '关闭'] },
    { title: '超时时间', content: `${config.outTime} 秒`, tags: ['#投票设置超时时间'] },
    { title: '最低票数', content: `${config.minNum} 票`, tags: ['#投票设置最低票数'] },
    { title: '禁言时间', content: `${config.banTime} 秒`, tags: ['#投票设置禁言时间'] },
    { title: '管理员一票权', content: config.veto ? '已启用' : '已禁用', tags: ['#启用管理员一票权', '#禁用管理员一票权'] },
    { title: '允许投票管理员', content: config.voteAdmin ? '已启用' : '已禁用', tags: ['#启用投票管理员', '#禁用投票管理员'] }
  ]
});

const buildVoteStateCard = (state: VoteState, config: VoteConfig, title = '投票进行中'): ListCardData => {
  const remaining = Math.max(0, Math.ceil((state.expireAt - Date.now()) / 1000));
  const action = state.type === 'ban' ? '禁言' : '踢人';
  return {
    title,
    subTitle: `目标 ${state.targetUserId} · ${action}`,
    summary: [`支持 ${state.support.length}`, `反对 ${state.oppose.length}`, `最低 ${config.minNum}`, `剩余 ${remaining} 秒`],
    items: [
      {
        title: `${action}投票`,
        subtitle: `发起人：${state.creatorUserId}`,
        content: [
          `支持者发送：#支持投票 ${state.targetUserId}`,
          `反对者发送：#反对投票 ${state.targetUserId}`,
          state.type === 'ban' ? `投票成功禁言 ${config.banTime} 秒` : '投票成功将移出群聊',
          `规则：支持票大于反对票且支持票不低于 ${config.minNum} 票`
        ].join('\n'),
        tags: [action, config.veto ? '管理员一票权' : '普通投票']
      }
    ]
  };
};

const parseTargetUserId = async (): Promise<number | null> => {
  const [event] = useEvent<'message.create'>();
  const [mention] = useMention();
  const mentioned = await mention.findOne();
  return toSafeInteger(mentioned.data?.UserId) ?? toSafeInteger(getRawArgs(event.current)[0]) ?? toSafeInteger((getRawArgText(event.current).match(/\d+/) ?? [])[0]);
};

const executeVoteAction = async (event: ReturnType<typeof useEvent<'message.create'>>[0]['current'], state: VoteState) => {
  const config = await getVoteConfig();
  if (!isVoteSuccess(state, config)) return;
  const [client] = useClient(event);
  if (state.type === 'ban') {
    await client.setGroupBan({ group_id: state.groupId, user_id: state.targetUserId, duration: config.banTime });
    return;
  }
  await client.setGroupKick({ group_id: state.groupId, user_id: state.targetUserId, reject_add_request: false });
};

const finishVote = async (event: ReturnType<typeof useEvent<'message.create'>>[0]['current'], groupId: number, targetUserId: number) => {
  const state = await endVoteState(groupId, targetUserId);
  if (!state) return;
  const config = await getVoteConfig();
  try {
    await executeVoteAction(event, state);
  } catch (error) {
    logger.error(`xiangling vote action failed: ${error instanceof Error ? error.message : String(error)}`);
  }
  const [client] = useClient(event);
  await client.sendGroupMessage({ group_id: groupId, message: [{ type: 'text', data: { text: formatVoteResult(state, config) } }] });
};

const scheduleVoteEnd = (event: ReturnType<typeof useEvent<'message.create'>>[0]['current'], state: VoteState) => {
  const delay = Math.max(0, state.expireAt - Date.now());
  if (delay > 60 * 1000) {
    setTimeout(async () => {
      const current = await getVoteState(state.groupId, state.targetUserId);
      if (!current) return;
      const [client] = useClient(event);
      const action = current.type === 'ban' ? '禁言' : '踢出';
      await client.sendGroupMessage({
        group_id: current.groupId,
        message: [{ type: 'text', data: { text: `${current.targetUserId} 的${action}投票仅剩一分钟结束\n当前票数：\n支持票数：${current.support.length}\n反对票数：${current.oppose.length}\n请支持者发送：\n「#支持投票${current.targetUserId}」\n不支持者请发送：\n「#反对投票${current.targetUserId}」\n发起人：${current.creatorUserId}` } }]
      });
    }, delay - 60 * 1000);
  }
  setTimeout(() => {
    void finishVote(event, state.groupId, state.targetUserId);
  }, delay);
};

const handleSwitch = async (text: string) => {
  const [event] = useEvent<'message.create'>();
  if (!await hasGroupAdminPermission(event.current)) {
    await sendText('需要主人、群主或群管理员权限才能修改投票开关。');
    return;
  }
  const enabled = /启用/.test(text);
  const type: VoteType = /禁言/.test(text) ? 'ban' : 'kick';
  const label = voteTypeLabel(type);
  const result = await setVoteSwitch(type, enabled);
  await sendText(result.changed ? `已${enabled ? '启用' : '禁用'}投票${label}功能。` : `投票${label}功能已处于${enabled ? '启用' : '禁用'}状态。`);
};

const handleSettings = async (text: string) => {
  const [event] = useEvent<'message.create'>();
  if (!await hasGroupAdminPermission(event.current)) {
    await sendText('需要主人、群主或群管理员权限才能修改投票配置。');
    return;
  }
  const match = text.match(/^\s*[#＃!！]?投票设置(超时时间|最低票数|禁言时间)?\s*(\d+)?\s*$/);
  const nameText = match?.[1];
  const value = toSafeInteger(match?.[2]);
  if (!nameText || !value) {
    const config = await getVoteConfig();
    await sendImageOrText(buildVoteConfigCard(config), formatVoteConfig(config));
    return;
  }
  const name = settingMap[nameText];
  const config = await setVoteNumberConfig(name, value);
  await sendText(`已把${nameText}设置成${config[name]}。`);
};

const handleBooleanSetting = async (text: string) => {
  const [event] = useEvent<'message.create'>();
  if (!await hasGroupAdminPermission(event.current)) {
    await sendText('需要主人、群主或群管理员权限才能修改投票高级配置。');
    return;
  }
  const setting = voteBooleanSetting(text);
  if (!setting) {
    await sendText('未知投票高级配置。');
    return;
  }
  const enabled = /启用|开启/.test(text);
  const result = await setVoteBooleanConfig(setting.key, enabled);
  await sendText(result.changed ? `已${enabled ? '启用' : '禁用'}${setting.label}。` : `${setting.label}已处于${enabled ? '启用' : '禁用'}状态。`);
};

const handleInitiate = async (text: string) => {
  const [event] = useEvent<'message.create'>();
  const groupId = getEventGroupId(event.current);
  const creatorUserId = toSafeInteger(event.current.UserId);
  const targetUserId = await parseTargetUserId();
  if (!groupId || !creatorUserId) {
    await sendText('投票功能只能在群聊中使用。');
    return;
  }
  if (!targetUserId) {
    await sendText('请艾特或输入被投票人的 QQ。');
    return;
  }
  if (!await hasBotGroupAdminPermission(event.current, groupId)) {
    await sendText('Bot 权限不足，需要管理员权限。');
    return;
  }
  if (targetUserId === creatorUserId) {
    await sendText('不能对自己发起投票。');
    return;
  }
  if (isMasterUser(event.current, targetUserId)) {
    await sendText('❎ 该命令对主人无效');
    return;
  }
  const type: VoteType = /禁言/.test(text) ? 'ban' : 'kick';
  const config = await getVoteConfig();
  if (type === 'ban' && !config.voteBan) {
    await sendText('该功能已被禁用，请发送 #启用投票禁言 来启用该功能。');
    return;
  }
  if (type === 'kick' && !config.voteKick) {
    await sendText('该功能已被禁用，请发送 #启用投票踢人 来启用该功能。');
    return;
  }
  if (await getVoteState(groupId, targetUserId)) {
    await sendText('已有相同投票，请勿重复发起。');
    return;
  }
  const [client] = useClient(event.current);
  const memberInfo = normalizeGroupMemberInfo(await client.getGroupMemberInfo({ group_id: groupId, user_id: targetUserId, no_cache: false }));
  if (!memberInfo) {
    await sendText('该群没有这个人，或 OneBot 未返回成员信息。');
    return;
  }
  if (memberInfo.role === 'owner') {
    await sendText('权限不足，该命令对群主无效。');
    return;
  }
  if (memberInfo.role === 'admin' && (!config.voteAdmin || !await hasBotGroupOwnerPermission(event.current, groupId))) {
    await sendText('该命令对管理员无效或 Bot 权限不足，需要群主权限。');
    return;
  }

  const now = Date.now();
  const state = await createVoteState({
    groupId,
    targetUserId,
    creatorUserId,
    type,
    support: [String(creatorUserId)],
    oppose: [],
    createdAt: now,
    expireAt: now + config.outTime * 1000,
    ended: false
  }, config.outTime);

  scheduleVoteEnd(event.current, state);
  const fallback = [
    `${targetUserId} 的${type === 'ban' ? '禁言' : '踢出'}投票已发起`,
    `发起人：${creatorUserId}`,
    `请支持者发送：#支持投票 ${targetUserId}`,
    `不支持者发送：#反对投票 ${targetUserId}`,
    `超时时间：${config.outTime}秒`,
    type === 'ban' ? `禁言时间：${config.banTime}秒` : '投票成功将会被移出群聊',
    `规则：支持票大于反对票且支持票不低于${config.minNum}票即可成功投票`,
    config.veto ? '管理员一票权：已开启' : ''
  ].filter(Boolean).join('\n');
  await sendImageOrText(buildVoteStateCard(state, config), fallback);
};

const handleFollow = async (text: string) => {
  const [event] = useEvent<'message.create'>();
  const groupId = getEventGroupId(event.current);
  const userId = toSafeInteger(event.current.UserId);
  const targetUserId = await parseTargetUserId();
  if (!groupId || !userId) {
    await sendText('投票功能只能在群聊中使用。');
    return;
  }
  if (!targetUserId) {
    await sendText('请艾特或输入需要跟票的目标 QQ。');
    return;
  }
  if (!await hasBotGroupAdminPermission(event.current, groupId)) {
    await sendText('Bot 权限不足，需要管理员权限。');
    return;
  }
  if (isMasterUser(event.current, targetUserId)) {
    await sendText('❎ 该命令对主人无效');
    return;
  }
  if (targetUserId === userId) {
    await sendText('不能对自己进行投票。');
    return;
  }
  const state = await getVoteState(groupId, targetUserId);
  if (!state) {
    await sendText('未找到对应投票。');
    return;
  }

  const support = /支持/.test(text);
  const role = await getGroupRole(event.current);
  const isAdmin = role === 'admin' || role === 'owner';
  const config = await getVoteConfig();
  if (config.veto && isAdmin) {
    await endVoteState(groupId, targetUserId);
    if (support) {
      await executeVoteAction(event.current, { ...state, support: [...new Set([...state.support, String(userId)])] });
      await sendText('投票结束，管理员介入，执行操作。');
    } else {
      await sendText('投票取消，管理员介入。');
    }
    return;
  }

  const result = addVote(state, userId, support);
  if (!result.changed) {
    await sendText('你已参与过投票，请勿重复参与。');
    return;
  }
  await updateVoteState(result.state);
  await sendImageOrText(buildVoteStateCard(result.state, config, '投票已记录'), `投票成功，当前票数\n支持：${result.state.support.length} 反对：${result.state.oppose.length}`);
};

export default async () => {
  const [event] = useEvent<'message.create'>();
  const text = event.current.MessageText || '';
  if (/^\s*[#＃!！]?(启用|禁用|开启|关闭)(管理员一票权|投票管理员)$/.test(text)) {
    await handleBooleanSetting(text);
    return false;
  }
  if (/^\s*[#＃!！]?(启用|禁用)投票(禁言|踢人)$/.test(text)) {
    await handleSwitch(text);
    return false;
  }
  if (/^\s*[#＃!！]?投票设置/.test(text)) {
    await handleSettings(text);
    return false;
  }
  if (/^\s*[#＃!！]?(发起)?投票(禁言|踢人)/.test(text)) {
    await handleInitiate(text);
    return false;
  }
  if (/^\s*[#＃!！]?(支持|反对)投票/.test(text)) {
    await handleFollow(text);
    return false;
  }
};
