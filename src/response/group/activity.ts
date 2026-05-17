import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberList, warnUnsupportedShape } from '../../adapter/onebot';
import { getEventGroupId, toSafeInteger } from '../../model/group/admin';
import { getGroupUserActivity } from '../../model/admin/stats';
import { applyLocalActivity, cancelPendingCleanup, formatInactiveMembers, formatInactiveRank, formatNeverSpeakMembers, formatRecentlyJoined, getInactiveMembers, getNeverSpeakMembers, parseActivityDuration, parseTrailingNumber, savePendingCleanup, takePendingCleanup } from '../../model/group/activity';

const send = async (text: string) => {
  const [message] = useMessage();
  await message.send({ format: Format.create().addText(text) });
};

const kickMembers = async (event: ReturnType<typeof useEvent<'message.create'>>[0]['current'], groupId: number, userIds: number[]): Promise<{ success: number[]; failed: string[] }> => {
  const success: number[] = [];
  const failed: string[] = [];
  const [client] = useClient(event);
  for (const userId of userIds) {
    try {
      await client.setGroupKick({ group_id: groupId, user_id: userId, reject_add_request: false });
      success.push(userId);
    } catch (error) {
      failed.push(`${userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { success, failed };
};

export default async () => {
  const [event] = useEvent<'message.create'>();
  const groupId = getEventGroupId(event.current);
  const text = event.current.MessageText || '';
  if (!groupId) {
    await send('活跃度管理只能在群聊中使用。');
    return false;
  }

  const operatorId = toSafeInteger(event.current.UserId);
  if (/^\s*[#＃!！]?取消清理\s*$/.test(text)) {
    if (!operatorId) {
      await send('无法识别操作者。');
      return false;
    }
    await send(await cancelPendingCleanup(groupId, operatorId) ? '已取消本次清理。' : '当前没有待确认的清理任务。');
    return false;
  }

  if (/^\s*[#＃!！]?确认清理\s*$/.test(text)) {
    if (!operatorId) {
      await send('无法识别操作者。');
      return false;
    }
    const pending = await takePendingCleanup(groupId, operatorId);
    if (!pending) {
      await send('当前没有待确认的清理任务，或任务已过期。');
      return false;
    }
    await send(`开始清理「${pending.label}」，共 ${pending.userIds.length} 人。`);
    const result = await kickMembers(event.current, groupId, pending.userIds);
    await send([`清理「${pending.label}」完成。`, `成功：${result.success.length}`, result.failed.length ? `失败：\n${result.failed.join('\n')}` : ''].filter(Boolean).join('\n'));
    return false;
  }

  const [client] = useClient(event.current);
  const rawMembers = await client.getGroupMemberList({ group_id: groupId });
  const localActivity = await getGroupUserActivity(groupId);
  const members = applyLocalActivity(normalizeGroupMemberList(rawMembers), localActivity);
  if (!members.length) warnUnsupportedShape('getGroupMemberList', rawMembers);

  if (/从未发言/.test(text)) {
    const list = getNeverSpeakMembers(members);
    if (/清理/.test(text)) {
      if (!list.length) {
        await send('本群暂无从未发言的人。');
        return false;
      }
      if (!operatorId) {
        await send('无法识别操作者。');
        return false;
      }
      await savePendingCleanup({ groupId, operatorId, label: '从未发言成员', userIds: list.map(member => Number(member.user_id)).filter(Boolean) });
      await send(`⚠ 本次共需清理「${list.length}」人，防止误触发\n请在 2 分钟内发送：#确认清理\n发送 #取消清理 可取消`);
      return false;
    }
    await send(formatNeverSpeakMembers(list, parseTrailingNumber(text, 1)));
    return false;
  }

  if (/不活跃|潜水/.test(text)) {
    await send(formatInactiveRank(members, parseTrailingNumber(text, 10)));
    return false;
  }

  if (/最近.*入群|入群(情况|记录)/.test(text)) {
    await send(formatRecentlyJoined(members, parseTrailingNumber(text, 10)));
    return false;
  }

  const duration = parseActivityDuration(text);
  if (!duration) {
    await send('请使用：#查看1月没发言的人 / #清理7天没发言的人 / #查看从未发言的人 / #查看不活跃排行榜 / #查看最近入群情况');
    return false;
  }
  const list = getInactiveMembers(members, duration.count, duration.unit);
  if (/清理/.test(text)) {
    if (!list.length) {
      await send(`暂时没有${duration.count}${duration.unit}没发言的人。`);
      return false;
    }
    if (!operatorId) {
      await send('无法识别操作者。');
      return false;
    }
    const label = `${duration.count}${duration.unit}没发言成员`;
    await savePendingCleanup({ groupId, operatorId, label, userIds: list.map(member => Number(member.user_id)).filter(Boolean) });
    await send(`⚠ 本次共需清理「${list.length}」人\n请在 2 分钟内发送：#确认清理\n发送 #取消清理 可取消`);
    return false;
  }
  await send(formatInactiveMembers(list, duration.count, duration.unit, parseTrailingNumber(text, 1)));
  return false;
};
