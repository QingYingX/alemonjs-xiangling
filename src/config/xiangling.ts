import { getConfigValue } from 'alemonjs';

export type XianglingConfig = {
  bot_name: string;
  official_website: string;
  official_group: string;
  operator: string;
  admin: {
    state_as_default: boolean;
    render_scale: number;
  };
  notice: {
    private_message: boolean;
    group_message: boolean;
    group_temporary_message: boolean;
    group_recall: boolean;
    private_recall: boolean;
    friend_request: boolean;
    group_invite_request: boolean;
    add_group_application: boolean;
    group_admin_change: boolean;
    friend_number_change: boolean;
    group_number_change: boolean;
    group_member_number_change: boolean;
    bot_been_banned: boolean;
    msg_save_deltime: number;
    notifications_all: boolean;
  };
  group_lists: {
    black: string[];
    white: string[];
    black_managers: string[];
    white_auto_unban: boolean;
  };
  group_vote: {
    vote_ban: boolean;
    vote_kick: boolean;
    out_time: number;
    min_num: number;
    ban_time: number;
    veto: boolean;
    vote_admin: boolean;
  };
  group_verify: {
    groups: Record<string, { mode: '计算' | '提交' }>;
    time: number;
    times: number;
    delay_time: number;
    remind_at_last_minute: boolean;
    range: {
      min: number;
      max: number;
    };
  };
  group_add_notice: {
    open_groups: string[];
    message: string;
  };
  welcome: {
    enabled: boolean;
    welcome_text: string[];
    exit_text: string[];
    welcome_cooldown: number;
    default_welcome: string;
    default_exit: string;
    default_kick: string;
    bot_join_text: string;
  };
  feedback: {
    enabled: boolean;
    groups: string[];
  };
  group_recall: {
    bot: 'all' | 'admin' | 'owner' | 'master';
    member: 'all' | 'admin' | 'owner' | 'master';
  };
  group_manage: {
    auto_approve_group_invite: boolean;
  };
};

const defaultConfig: XianglingConfig = {
  bot_name: '香菱',
  official_website: '',
  official_group: '',
  operator: '',
  admin: {
    state_as_default: false,
    render_scale: 100
  },
  notice: {
    private_message: false,
    group_message: false,
    group_temporary_message: false,
    group_recall: false,
    private_recall: false,
    friend_request: false,
    group_invite_request: false,
    add_group_application: false,
    group_admin_change: false,
    friend_number_change: false,
    group_number_change: false,
    group_member_number_change: false,
    bot_been_banned: false,
    msg_save_deltime: 7200,
    notifications_all: false
  },
  group_lists: {
    black: [],
    white: [],
    black_managers: [],
    white_auto_unban: false
  },
  group_vote: {
    vote_ban: true,
    vote_kick: false,
    out_time: 180,
    min_num: 4,
    ban_time: 3600,
    veto: true,
    vote_admin: false
  },
  group_verify: {
    groups: {},
    time: 300,
    times: 7,
    delay_time: 2,
    remind_at_last_minute: true,
    range: {
      min: 10,
      max: 100
    }
  },
  group_add_notice: {
    open_groups: [],
    message: '有一个加群通知，管理员快去看看吧~'
  },
  welcome: {
    enabled: true,
    welcome_text: [],
    exit_text: [],
    welcome_cooldown: 30,
    default_welcome: '欢迎加入本群，请遵守群规',
    default_exit: '乘着西风出发咯~',
    default_kick: '被一脚踹了出去~',
    bot_join_text: '===机器人已加入本群===\n使用 #管理帮助 查看功能列表\n=================='
  },
  feedback: {
    enabled: true,
    groups: []
  },
  group_recall: {
    bot: 'all',
    member: 'admin'
  },
  group_manage: {
    auto_approve_group_invite: false
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
};

const readString = (value: unknown, fallback: string): string => {
  return typeof value === 'string' ? value : fallback;
};

const readBoolean = (value: unknown, fallback: boolean): boolean => {
  return typeof value === 'boolean' ? value : fallback;
};

const readNumber = (value: unknown, fallback: number, min?: number, max?: number): number => {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.round(num);
  return Math.min(max ?? rounded, Math.max(min ?? rounded, rounded));
};

const readStringArray = (value: unknown, fallback: string[] = []): string[] => {
  return Array.isArray(value) ? value.map(item => String(item).trim()).filter(Boolean) : [...fallback];
};


const readPermission = (
  value: unknown,
  fallback: 'all' | 'admin' | 'owner' | 'master'
): 'all' | 'admin' | 'owner' | 'master' => {
  return value === 'all' || value === 'admin' || value === 'owner' || value === 'master' ? value : fallback;
};

const readVerifyGroups = (value: unknown): Record<string, { mode: '计算' | '提交' }> => {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([groupId, item]) => {
    const record = isRecord(item) ? item : {};
    const mode = record.mode === '提交' ? '提交' : '计算';
    return [groupId, { mode }];
  }));
};

export const getXianglingConfig = (): XianglingConfig => {
  const root = getConfigValue<Record<string, unknown>>() || {};
  const raw = isRecord(root['alemonjs-xiangling']) ? root['alemonjs-xiangling'] : {};
  const admin = isRecord(raw.admin) ? raw.admin : {};
  const notice = isRecord(raw.notice) ? raw.notice : {};
  const groupLists = isRecord(raw.group_lists) ? raw.group_lists : {};
  const groupVote = isRecord(raw.group_vote) ? raw.group_vote : {};
  const groupVerify = isRecord(raw.group_verify) ? raw.group_verify : {};
  const verifyRange = isRecord(groupVerify.range) ? groupVerify.range : {};
  const groupAddNotice = isRecord(raw.group_add_notice) ? raw.group_add_notice : {};
  const welcome = isRecord(raw.welcome) ? raw.welcome : {};
  const feedback = isRecord(raw.feedback) ? raw.feedback : {};
  const groupRecall = isRecord(raw.group_recall) ? raw.group_recall : {};
  const groupManage = isRecord(raw.group_manage) ? raw.group_manage : {};

  return {
    bot_name: readString(raw.bot_name, defaultConfig.bot_name),
    official_website: readString(raw.official_website, defaultConfig.official_website),
    official_group: readString(raw.official_group, defaultConfig.official_group),
    operator: readString(raw.operator, defaultConfig.operator),
    admin: {
      state_as_default: readBoolean(admin.state_as_default, defaultConfig.admin.state_as_default),
      render_scale: readNumber(admin.render_scale, defaultConfig.admin.render_scale, 50, 200)
    },
    notice: {
      private_message: readBoolean(notice.private_message, defaultConfig.notice.private_message),
      group_message: readBoolean(notice.group_message, defaultConfig.notice.group_message),
      group_temporary_message: readBoolean(notice.group_temporary_message, defaultConfig.notice.group_temporary_message),
      group_recall: readBoolean(notice.group_recall, defaultConfig.notice.group_recall),
      private_recall: readBoolean(notice.private_recall, defaultConfig.notice.private_recall),
      friend_request: readBoolean(notice.friend_request, defaultConfig.notice.friend_request),
      group_invite_request: readBoolean(notice.group_invite_request, defaultConfig.notice.group_invite_request),
      add_group_application: readBoolean(notice.add_group_application, defaultConfig.notice.add_group_application),
      group_admin_change: readBoolean(notice.group_admin_change, defaultConfig.notice.group_admin_change),
      friend_number_change: readBoolean(notice.friend_number_change, defaultConfig.notice.friend_number_change),
      group_number_change: readBoolean(notice.group_number_change, defaultConfig.notice.group_number_change),
      group_member_number_change: readBoolean(notice.group_member_number_change, defaultConfig.notice.group_member_number_change),
      bot_been_banned: readBoolean(notice.bot_been_banned, defaultConfig.notice.bot_been_banned),
      msg_save_deltime: readNumber(notice.msg_save_deltime, defaultConfig.notice.msg_save_deltime, 120),
      notifications_all: readBoolean(notice.notifications_all, defaultConfig.notice.notifications_all)
    },
    group_lists: {
      black: readStringArray(groupLists.black, defaultConfig.group_lists.black),
      white: readStringArray(groupLists.white, defaultConfig.group_lists.white),
      black_managers: readStringArray(groupLists.black_managers, defaultConfig.group_lists.black_managers),
      white_auto_unban: readBoolean(groupLists.white_auto_unban, defaultConfig.group_lists.white_auto_unban)
    },
    group_vote: {
      vote_ban: readBoolean(groupVote.vote_ban, defaultConfig.group_vote.vote_ban),
      vote_kick: readBoolean(groupVote.vote_kick, defaultConfig.group_vote.vote_kick),
      out_time: readNumber(groupVote.out_time, defaultConfig.group_vote.out_time, 1, 24 * 60 * 60),
      min_num: readNumber(groupVote.min_num, defaultConfig.group_vote.min_num, 1, 500),
      ban_time: readNumber(groupVote.ban_time, defaultConfig.group_vote.ban_time, 1, 30 * 24 * 60 * 60),
      veto: readBoolean(groupVote.veto, defaultConfig.group_vote.veto),
      vote_admin: readBoolean(groupVote.vote_admin, defaultConfig.group_vote.vote_admin)
    },
    group_verify: {
      groups: readVerifyGroups(groupVerify.groups),
      time: readNumber(groupVerify.time, defaultConfig.group_verify.time, 1, 24 * 60 * 60),
      times: readNumber(groupVerify.times, defaultConfig.group_verify.times, 1, 10),
      delay_time: readNumber(groupVerify.delay_time ?? groupVerify.DelayTime, defaultConfig.group_verify.delay_time, 0, 60),
      remind_at_last_minute: readBoolean(groupVerify.remind_at_last_minute ?? groupVerify.remindAtLastMinute, defaultConfig.group_verify.remind_at_last_minute),
      range: {
        min: readNumber(verifyRange.min, defaultConfig.group_verify.range.min, 0),
        max: readNumber(verifyRange.max, defaultConfig.group_verify.range.max, 1)
      }
    },
    group_add_notice: {
      open_groups: readStringArray(groupAddNotice.open_groups, defaultConfig.group_add_notice.open_groups),
      message: readString(groupAddNotice.message, defaultConfig.group_add_notice.message)
    },
    welcome: {
      enabled: readBoolean(welcome.enabled, defaultConfig.welcome.enabled),
      welcome_text: readStringArray(welcome.welcome_text, defaultConfig.welcome.welcome_text),
      exit_text: readStringArray(welcome.exit_text, defaultConfig.welcome.exit_text),
      welcome_cooldown: readNumber(welcome.welcome_cooldown, defaultConfig.welcome.welcome_cooldown, 0, 24 * 60 * 60),
      default_welcome: readString(welcome.default_welcome, defaultConfig.welcome.default_welcome),
      default_exit: readString(welcome.default_exit, defaultConfig.welcome.default_exit),
      default_kick: readString(welcome.default_kick, defaultConfig.welcome.default_kick),
      bot_join_text: readString(welcome.bot_join_text, defaultConfig.welcome.bot_join_text)
    },
    feedback: {
      enabled: readBoolean(feedback.enabled, defaultConfig.feedback.enabled),
      groups: readStringArray(feedback.groups, defaultConfig.feedback.groups)
    },
    group_recall: {
      bot: readPermission(groupRecall.bot, defaultConfig.group_recall.bot),
      member: readPermission(groupRecall.member, defaultConfig.group_recall.member)
    },
    group_manage: {
      auto_approve_group_invite: readBoolean(
        groupManage.auto_approve_group_invite,
        defaultConfig.group_manage.auto_approve_group_invite
      )
    }
  };
};

export const getBotName = (): string => getXianglingConfig().bot_name;
