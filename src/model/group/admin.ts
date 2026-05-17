import type { EventKeys, Events } from 'alemonjs';

export type TargetParseResult = {
  groupId: number;
  userId: number;
};

export type GroupOnlyParseResult = {
  groupId: number;
};

export type GroupTextParseResult = GroupOnlyParseResult & {
  text: string;
};

export type TargetTextParseResult = TargetParseResult & {
  text: string;
};

export type CardParseResult = TargetTextParseResult;

export const toSafeInteger = (value: unknown): number | null => {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const num = Number(text);
  return Number.isSafeInteger(num) ? num : null;
};

export const parseDurationSeconds = (value: unknown, fallback = 600): number => {
  const text = String(value ?? '').trim();
  const match = text.match(/([0-9]+|[零〇一壹二两三四五六七八九十百千万]+)\s*(秒|s|S|分|分钟|m|M|时|小时|h|H|天|日|d|D|周|w|W|月|年|y|Y)?/);
  const rawNum = match ? parseFlexibleInteger(match[1]) : toSafeInteger(value);
  const unit = match?.[2] || '秒';
  const multiplier = /分|分钟|m/i.test(unit)
    ? 60
    : /时|小时|h/i.test(unit)
      ? 3600
      : /天|日|d/i.test(unit)
        ? 86400
        : /周|w/i.test(unit)
          ? 604800
          : /月/.test(unit)
            ? 2592000
            : /年|y/i.test(unit)
              ? 31536000
              : 1;
  const num = rawNum ? rawNum * multiplier : null;
  if (!num || num <= 0) {
    return fallback;
  }
  return Math.min(num, 30 * 24 * 60 * 60);
};

const chineseDigits: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  壹: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9
};

const parseChineseInteger = (text: string): number | null => {
  let section = 0;
  let number = 0;
  let result = 0;
  const units: Record<string, number> = { 十: 10, 百: 100, 千: 1000 };

  for (const char of text) {
    if (chineseDigits[char] !== undefined) {
      number = chineseDigits[char];
      continue;
    }
    if (char === '万') {
      result += (section + number) * 10000;
      section = 0;
      number = 0;
      continue;
    }
    const unit = units[char];
    if (!unit) return null;
    section += (number || 1) * unit;
    number = 0;
  }

  return result + section + number;
};

const parseFlexibleInteger = (value: unknown): number | null => {
  const text = String(value ?? '').trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) return toSafeInteger(text);
  const num = parseChineseInteger(text);
  return num && Number.isSafeInteger(num) ? num : null;
};

export const parseDurationArg = (args: string[], fallback = 600): number => {
  if (!args.length) return fallback;
  const last = args[args.length - 1] || '';
  const prev = args[args.length - 2] || '';
  if (/^(秒|s|S|分|分钟|m|M|时|小时|h|H|天|日|d|D|周|w|W|月|年|y|Y)$/.test(last) && prev) {
    return parseDurationSeconds(`${prev}${last}`, fallback);
  }
  return parseDurationSeconds(last, fallback);
};

export const getEventGroupId = <T extends EventKeys>(event: Events[T]): number | null => {
  if (String(event.name ?? '').startsWith('private.')) {
    return null;
  }
  return toSafeInteger(event.ChannelId || event.GuildId || event.SpaceId);
};

const normalizeLegacyCommandArgs = (text: string, args: string[]): string[] => {
  if (args.length) return args;

  const trimmed = text.trim();
  const muteMatch = trimmed.match(/^[#＃!！]?禁言\s*(\d+)\s+(\d+)(?:\s+(.+))?$/);
  if (muteMatch) return [muteMatch[1], muteMatch[2], muteMatch[3]].filter((item): item is string => Boolean(item));

  const unmuteMatch = trimmed.match(/^[#＃!！]?解禁\s*(\d+)\s+(\d+)$/);
  if (unmuteMatch) return [unmuteMatch[1], unmuteMatch[2]];

  const kickMatch = trimmed.match(/^[#＃!！]?踢黑?\s*(\d+)\s+(\d+)$/);
  if (kickMatch) return [kickMatch[1], kickMatch[2]];

  const wholeBanMatch = trimmed.match(/^[#＃!！]?全体(?:禁言|解禁)(\d+)$/);
  if (wholeBanMatch) return [wholeBanMatch[1]];

  return args;
};

export const getRawArgs = <T extends EventKeys>(event: Events[T]): string[] => {
  const args = event.__route?.rawArgs?.map(String) ?? [];
  return normalizeLegacyCommandArgs(event.MessageText || '', args);
};

export const getRawArgText = <T extends EventKeys>(event: Events[T]): string => {
  return getRawArgs(event).join(' ').trim();
};

export const parseTargetArgs = <T extends EventKeys>(event: Events[T], mentionedUserId?: string): TargetParseResult | null => {
  const rawArgs = getRawArgs(event);
  const groupId = getEventGroupId(event) ?? toSafeInteger(rawArgs[0]);
  const numericArgs = rawArgs.map(toSafeInteger).filter((item): item is number => item !== null);
  const mentionId = toSafeInteger(mentionedUserId);
  const userId = mentionId ?? (getEventGroupId(event) ? numericArgs[0] : numericArgs[1]);

  if (!groupId || !userId) {
    return null;
  }

  return { groupId, userId };
};

export const parseGroupOnlyArgs = <T extends EventKeys>(event: Events[T]): GroupOnlyParseResult | null => {
  const groupId = getEventGroupId(event) ?? toSafeInteger(getRawArgs(event)[0]);
  return groupId ? { groupId } : null;
};

export const parseGroupTextArgs = <T extends EventKeys>(event: Events[T]): GroupTextParseResult | null => {
  const rawArgs = getRawArgs(event);
  const currentGroupId = getEventGroupId(event);
  const groupId = currentGroupId ?? toSafeInteger(rawArgs[0]);
  const text = rawArgs.slice(currentGroupId ? 0 : 1).join(' ').trim();

  return groupId && text ? { groupId, text } : null;
};

export const parseMessageIdArg = <T extends EventKeys>(event: Events[T]): number | null => {
  return toSafeInteger(getRawArgs(event)[0]) ?? toSafeInteger(event.ReplyId);
};

export const parseRejectAddRequest = <T extends EventKeys>(event: Events[T]): boolean => {
  return /踢黑/.test(event.MessageText || '');
};

const trimTargetText = (args: string[], count: number): string => {
  return args
    .slice(count)
    .filter(item => !/^@?\d{5,}$/.test(item))
    .join(' ')
    .trim();
};

export const parseCardArgs = <T extends EventKeys>(event: Events[T], mentionedUserId?: string): CardParseResult | null => {
  const rawArgs = getRawArgs(event);
  const currentGroupId = getEventGroupId(event);
  const mentionId = toSafeInteger(mentionedUserId);
  const botId = toSafeInteger(event.BotId);

  if (currentGroupId) {
    const explicitUserId = toSafeInteger(rawArgs[0]);
    const userId = mentionId ?? explicitUserId ?? botId;
    const text = trimTargetText(rawArgs, explicitUserId && explicitUserId === userId ? 1 : 0);
    return userId && text ? { groupId: currentGroupId, userId, text } : null;
  }

  const groupId = toSafeInteger(rawArgs[0]);
  const userId = mentionId ?? botId;
  const text = trimTargetText(rawArgs, 1);
  return groupId && userId && text ? { groupId, userId, text } : null;
};

export const parseTitleArgs = <T extends EventKeys>(event: Events[T], mentionedUserId?: string): TargetTextParseResult | null => {
  const rawArgs = getRawArgs(event);
  const currentGroupId = getEventGroupId(event);
  const mentionId = toSafeInteger(mentionedUserId);

  if (currentGroupId) {
    const explicitUserId = toSafeInteger(rawArgs[0]);
    const userId = mentionId ?? explicitUserId;
    const text = trimTargetText(rawArgs, explicitUserId && explicitUserId === userId ? 1 : 0);
    return userId && text ? { groupId: currentGroupId, userId, text } : null;
  }

  const groupId = toSafeInteger(rawArgs[0]);
  const userId = toSafeInteger(rawArgs[1]);
  const text = trimTargetText(rawArgs, 2);
  return groupId && userId && text ? { groupId, userId, text } : null;
};

export const parseSelfTitleArgs = <T extends EventKeys>(event: Events[T]): TargetTextParseResult | null => {
  const groupId = getEventGroupId(event);
  const userId = toSafeInteger(event.UserId);
  const text = getRawArgText(event);
  return groupId && userId && text ? { groupId, userId, text } : null;
};

export const formatMutedMembers = (members: Array<{ user_id: number; nickname?: string; card?: string; shut_up_timestamp?: number }>, now = Date.now()): string => {
  const nowSeconds = Math.floor(now / 1000);
  const muted = members.filter(item => Number(item.shut_up_timestamp ?? 0) > nowSeconds);

  if (!muted.length) {
    return '当前没有正在禁言的群成员。';
  }

  return muted
    .map((item, index) => {
      const name = item.card || item.nickname || String(item.user_id);
      const remaining = Math.max(0, Number(item.shut_up_timestamp ?? 0) - nowSeconds);
      return `${index + 1}. ${name}(${item.user_id}) 剩余 ${remaining} 秒`;
    })
    .join('\n');
};
