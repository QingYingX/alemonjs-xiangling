import { getConfigValue, logger, useEvent } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getNoticeSettings } from '../model/admin/notice-settings';

const toSegments = (text: string) => [{ type: 'text', data: { text } }];
type NoticeEventName =
  | 'message.create'
  | 'private.message.create'
  | 'message.delete'
  | 'private.message.delete'
  | 'private.friend.add'
  | 'private.friend.remove'
  | 'private.guild.add'
  | 'member.add'
  | 'member.remove'
  | 'member.ban'
  | 'member.unban'
  | 'member.update'
  | 'notice.create';

type RawNotice = {
  self_id?: string | number;
  user_id?: string | number;
  target_id?: string | number;
  group_id?: string | number;
  operator_id?: string | number;
  duration?: string | number;
  sub_type?: string;
  comment?: string;
  flag?: string;
};

const getMasterIds = (): number[] => {
  const root = getConfigValue<Record<string, unknown>>() || {};
  const onebot = root.onebot && typeof root.onebot === 'object' ? root.onebot as Record<string, unknown> : {};
  const ids = Array.isArray(onebot.master_id) ? onebot.master_id : [];
  return ids.map(id => Number(id)).filter(id => Number.isSafeInteger(id) && id > 0);
};

const getRaw = (value: unknown): RawNotice => {
  return value && typeof value === 'object' ? value as RawNotice : {};
};

const sameId = (left: unknown, right: unknown): boolean => Boolean(left && right && String(left) === String(right));

const formatDuration = (seconds: unknown): string => {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) return '未知';
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor(value % 3600 / 60);
  const rest = Math.floor(value % 60);
  return [hours ? `${hours}小时` : '', minutes ? `${minutes}分钟` : '', rest ? `${rest}秒` : ''].filter(Boolean).join('') || `${value}秒`;
};

const buildForwardBody = (current: ReturnType<typeof useEvent<NoticeEventName>>[0]['current'], settings: Awaited<ReturnType<typeof getNoticeSettings>>): string | null => {
  const raw = getRaw(current.value);
  const senderId = 'UserId' in current ? current.UserId : raw.user_id;
  const selfId = raw.self_id ?? current.BotId;
  const groupId = 'GuildId' in current ? current.GuildId : raw.group_id;
  const isGroupMessage = current.name === 'message.create' || current.name === 'message.delete';
  const isRecall = current.name === 'message.delete' || current.name === 'private.message.delete';

  if ((current.name === 'message.create' || current.name === 'private.message.create') && sameId(senderId, selfId)) return null;

  if (isRecall) {
    const enabled = isGroupMessage ? settings.groupRecall : settings.privateRecall;
    if (!enabled) return null;
    return `[香菱通知] ${isGroupMessage ? '群聊' : '好友'}撤回\n消息ID：${current.MessageId}\n来源：${groupId || senderId || '未知'}\n操作人：${raw.operator_id || '未知'}`;
  }

  if (current.name === 'message.create' || current.name === 'private.message.create') {
    const enabled = current.name === 'message.create' ? settings.groupMessage : settings.privateMessage;
    if (!enabled) return null;
    return `[香菱通知] ${current.name === 'message.create' ? '群聊消息' : '好友消息'}\n来源：${groupId || senderId || '未知'}\n发送人：${senderId || '未知'}\n内容：${current.MessageText || '[非文本消息]'}`;
  }

  if (current.name === 'private.friend.add') {
    const isFriendNotice = current.tag === 'NOTICE_FRIEND_ADD';
    if (isFriendNotice && !settings.friendNumberChange) return null;
    if (!isFriendNotice && !settings.friendRequest) return null;
    return isFriendNotice
      ? `[香菱通知] 新增好友\n好友账号：${senderId || '未知'}\n好友昵称：${current.UserName || '未知'}`
      : `[香菱通知] 好友申请\n申请账号：${senderId || '未知'}\n验证信息：${raw.comment || '无'}\nFlag：${raw.flag || current.MessageId || '未知'}`;
  }

  if (current.name === 'private.friend.remove') {
    if (!settings.friendNumberChange) return null;
    return `[香菱通知] 好友减少\n好友账号：${senderId || '未知'}\n好友昵称：${current.UserName || '未知'}`;
  }

  if (current.name === 'private.guild.add') {
    if (!settings.addGroupApplication && !settings.groupInviteRequest) return null;
    const requestType = raw.sub_type === 'invite' ? '群邀请' : '加群申请';
    return `[香菱通知] ${requestType}\n群号：${raw.group_id || '未知'}\n申请账号：${senderId || '未知'}\n验证信息：${raw.comment || '无'}\nFlag：${raw.flag || current.MessageId || '未知'}`;
  }

  if (current.name === 'member.add') {
    const isBot = sameId(current.UserId, current.BotId);
    if (isBot && !settings.groupNumberChange) return null;
    if (!isBot && !settings.groupMemberNumberChange) return null;
    return isBot
      ? `[香菱通知] 新增群聊\n新增群号：${groupId || '未知'}`
      : `[香菱通知] 新增群员\n群号：${groupId || '未知'}\n新成员账号：${current.UserId}\n新成员昵称：${current.UserName || '未知'}`;
  }

  if (current.name === 'member.remove') {
    const isBot = sameId(current.UserId, current.BotId);
    const isKick = raw.sub_type === 'kick' || raw.sub_type === 'kick_me' || Boolean(raw.operator_id && !sameId(raw.operator_id, current.UserId));
    if (isBot && !settings.groupNumberChange) return null;
    if (!isBot && !settings.groupMemberNumberChange) return null;
    if (isBot) {
      return `[香菱通知] ${isKick ? '机器人被踢' : '机器人退群'}\n群号：${groupId || '未知'}\n操作人：${raw.operator_id || '未知'}`;
    }
    return `[香菱通知] ${isKick ? '群员被踢' : '群员退群'}\n群号：${groupId || '未知'}\n成员账号：${current.UserId}\n成员昵称：${current.UserName || '未知'}\n操作人：${raw.operator_id || '未知'}`;
  }

  if (current.name === 'member.update') {
    if (!settings.groupAdminChange) return null;
    const isSet = raw.sub_type === 'set' || /SET$/.test(String(current.tag || ''));
    const isBot = sameId(current.UserId, current.BotId);
    return `[香菱通知] ${isBot ? '机器人' : '群员'}${isSet ? '被设置管理' : '被取消管理'}\n群号：${groupId || '未知'}\n账号：${current.UserId}`;
  }

  if (current.name === 'member.ban' || current.name === 'member.unban') {
    if (!settings.botBeenBanned || !sameId(current.UserId, current.BotId)) return null;
    const banned = current.name === 'member.ban';
    return `[香菱通知] 机器人${banned ? '被禁言' : '被解除禁言'}\n群号：${groupId || '未知'}\n操作人：${raw.operator_id || '未知'}${banned ? `\n禁言时长：${formatDuration(raw.duration)}` : ''}`;
  }

  if (current.name === 'notice.create') {
    const rawType = raw.sub_type || current.tag;
    if (!/poke/i.test(String(rawType))) return null;
    const enabled = groupId ? settings.groupMessage : settings.privateMessage;
    if (!enabled) return null;
    return `[香菱通知] 戳一戳\n来源：${groupId ? `群 ${groupId}` : '私聊'}\n发送人：${senderId || '未知'}\n目标：${raw.target_id || '未知'}`;
  }

  return null;
};

export default async (_event: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent<NoticeEventName>();
  const current = event.current;

  try {
    const settings = await getNoticeSettings();
    const [client] = useClient(current);
    const allTargets = getMasterIds();
    const targets = settings.notificationsAll ? allTargets : allTargets.slice(0, 1);

    if (!targets.length) {
      await next?.();
      return;
    }

    const body = buildForwardBody(current, settings);
    if (!body) {
      await next?.();
      return;
    }

    await Promise.all(targets.map(userId => client.sendPrivateMessage({ user_id: userId, message: toSegments(body) })));
  } catch (error) {
    logger.warn(`xiangling forward notice failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  await next?.();
};
