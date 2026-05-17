import type { OneBotFriendInfo, OneBotGroupInfo } from '../../adapter/onebot';

export const toNumberId = (value: unknown): number | null => {
  const text = String(value ?? '').trim();
  if (!/^\d+$/.test(text)) {
    return null;
  }
  const id = Number(text);
  return Number.isSafeInteger(id) ? id : null;
};

export const formatGroupList = (groups: OneBotGroupInfo[]): string => {
  if (!groups.length) {
    return '群列表为空，或当前 OneBot 实现未返回群列表。';
  }

  const sorted = [...groups].sort((a, b) => Number(a.group_id) - Number(b.group_id));
  const totalMembers = sorted.reduce((sum, group) => sum + (Number(group.member_count) || 0), 0);
  const lines = sorted.slice(0, 40).map((group, index) => {
    const name = group.group_name || '未知群名';
    const count = Number(group.member_count) || 0;
    return `${String(index + 1).padStart(2, '0')}. ${name} (${group.group_id}) - ${count}人`;
  });
  const more = sorted.length > 40 ? `\n... 还有 ${sorted.length - 40} 个群未显示` : '';

  return [`群列表，共 ${sorted.length} 个群`, `总成员: ${totalMembers}`, '━━━━━━━━', lines.join('\n') + more].join('\n');
};

export const formatFriendList = (friends: OneBotFriendInfo[]): string => {
  if (!friends.length) {
    return '好友列表为空，或当前 OneBot 实现未返回好友列表。';
  }

  const lines = friends.slice(0, 60).map((friend, index) => {
    const name = friend.remark || friend.nickname || '未知昵称';
    return `${index + 1}. ${name} (${friend.user_id})`;
  });
  const more = friends.length > 60 ? `\n... 还有 ${friends.length - 60} 个好友未显示` : '';

  return [`好友列表，共 ${friends.length} 个好友`, '━━━━━━━━', lines.join('\n') + more].join('\n');
};

export const formatGroupInfo = (group: OneBotGroupInfo): string => {
  return [
    '群组详细信息',
    '━━━━━━━━',
    `群号: ${group.group_id}`,
    `群名: ${group.group_name || '未知群名'}`,
    `成员数: ${Number(group.member_count) || 0}`,
    `人数上限: ${Number(group.max_member_count) || 0}`
  ].join('\n');
};

export const formatGroupMemberStats = (groups: OneBotGroupInfo[]): string => {
  if (!groups.length) {
    return '群列表为空，无法统计群成员。';
  }

  const sorted = [...groups].sort((a, b) => (Number(b.member_count) || 0) - (Number(a.member_count) || 0));
  const totalMembers = sorted.reduce((sum, group) => sum + (Number(group.member_count) || 0), 0);
  const maxMembers = sorted.reduce((sum, group) => sum + (Number(group.max_member_count) || 0), 0);
  const lines = sorted.slice(0, 30).map((group, index) => {
    const name = group.group_name || '未知群名';
    const count = Number(group.member_count) || 0;
    const max = Number(group.max_member_count) || 0;
    return `${index + 1}. ${name}(${group.group_id}) ${count}/${max}`;
  });
  const more = sorted.length > 30 ? `\n... 还有 ${sorted.length - 30} 个群未显示` : '';

  return [`群员统计`, '━━━━━━━━', `群数量: ${sorted.length}`, `成员总数: ${totalMembers}`, `人数上限: ${maxMembers}`, '━━━━━━━━', lines.join('\n') + more].join('\n');
};

export const parseIdAndText = (args: string[]): { id: number; text: string } | null => {
  const [idText, ...messageParts] = args;
  const id = toNumberId(idText);
  const text = messageParts.join(' ').trim();
  return id && text ? { id, text } : null;
};

export const getUserAvatarUrl = (userId: number): string => `https://q1.qlogo.cn/g?b=qq&s=640&nk=${userId}`;

export const getGroupAvatarUrl = (groupId: number): string => `https://p.qlogo.cn/gh/${groupId}/${groupId}/640`;

export const searchGroups = (groups: OneBotGroupInfo[], keyword: string): OneBotGroupInfo[] => {
  const text = keyword.trim();
  if (!text) {
    return [];
  }
  return groups.filter(group => {
    return String(group.group_id).includes(text) || String(group.group_name || '').includes(text);
  });
};
