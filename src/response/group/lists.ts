import { Format, useEvent, useMention, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupList, normalizeGroupMemberInfo, normalizeGroupMemberList } from '../../adapter/onebot';
import { formatList, getGroupLists, isInList, setWhiteAutoUnban, updateList } from '../../model/group/lists';
import { getEventGroupId, getRawArgs, toSafeInteger } from '../../model/group/admin';
import { hasBotGroupAdminPermission } from '../../model/group/permissions';

const listTitle = (kind: 'black' | 'white' | 'blackManagers'): string => {
  if (kind === 'black') return '黑名单';
  if (kind === 'white') return '白名单';
  return '黑名单管理名单';
};

const parseUserId = (text: string, rawArgs: string[], mentionedUserId?: string, command?: RegExp): number | null => {
  const inlineText = command ? text.replace(command, '').trim() : text;
  return toSafeInteger(mentionedUserId) ?? toSafeInteger(rawArgs[0]) ?? toSafeInteger((inlineText.match(/\d+/) ?? [])[0]);
};

const sendNoPermission = async (reason: string) => {
  const [message] = useMessage();
  await message.send({ format: Format.create().addText(reason) });
};

const isGroupAdmin = async (): Promise<boolean> => {
  const [event] = useEvent<'message.create' | 'private.message.create'>();
  if (event.current.IsMaster) return true;
  const groupId = getEventGroupId(event.current);
  const userId = toSafeInteger(event.current.UserId);
  if (!groupId || !userId) return false;
  const rawRole = String((event.current.value as { sender?: { role?: string } } | undefined)?.sender?.role ?? '');
  if (rawRole === 'admin' || rawRole === 'owner') return true;
  const [client] = useClient(event.current);
  const member = await client.getGroupMemberInfo({ group_id: groupId, user_id: userId, no_cache: false }).then(normalizeGroupMemberInfo).catch(() => null);
  return member?.role === 'admin' || member?.role === 'owner';
};

const hasBlacklistPermission = async (): Promise<boolean> => {
  const [event] = useEvent();
  if (event.current.IsMaster) return true;
  return isInList('blackManagers', event.current.UserId);
};

const ensureMaster = async (): Promise<boolean> => {
  const [event] = useEvent();
  if (event.current.IsMaster) return true;
  await sendNoPermission('只有主人才能管理黑名单授权名单。');
  return false;
};

const ensureBlacklistPermission = async (): Promise<boolean> => {
  if (await hasBlacklistPermission()) return true;
  await sendNoPermission('暂无黑名单管理权限，请联系主人使用 #黑名单授权 <QQ> 授权。');
  return false;
};

const ensureWhitelistPermission = async (): Promise<boolean> => {
  if (await isGroupAdmin()) return true;
  await sendNoPermission('白名单管理需要主人、群主或群管理员权限。');
  return false;
};

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const [mention] = useMention();
  const mentioned = await mention.findOne();
  const text = event.current.MessageText || '';
  const rawArgs = getRawArgs(event.current);
  const format = Format.create();

  if (/黑名单管理列表/.test(text)) {
    if (!(await ensureMaster())) return;
    const lists = await getGroupLists();
    await message.send({ format: format.addText(formatList('黑名单管理名单', lists.blackManagers)) });
    return;
  }

  if (/^(#|＃|!|！)?(黑|白)名单列表/.test(text.trim())) {
    const kind = /黑/.test(text) ? 'black' : 'white';
    if (kind === 'black' && !(await ensureBlacklistPermission())) return;
    if (kind === 'white' && !(await ensureWhitelistPermission())) return;
    const lists = await getGroupLists();
    await message.send({ format: format.addText(formatList(listTitle(kind), lists[kind])) });
    return;
  }

  if (/白名单(自动)?解禁/.test(text)) {
    if (!(await ensureWhitelistPermission())) return;
    const enable = /开启/.test(text);
    await setWhiteAutoUnban(enable);
    await message.send({ format: format.addText(`已${enable ? '开启' : '关闭'}白名单自动解禁。`) });
    return;
  }

  if (/黑名单(授权|取消授权)/.test(text)) {
    if (!(await ensureMaster())) return;
    const userId = parseUserId(text, rawArgs, mentioned.data?.UserId, /^\s*[#＃!！]?黑名单(授权|取消授权)/);
    if (!userId) {
      await message.send({ format: format.addText('请使用：#黑名单授权 <QQ> / #黑名单取消授权 <QQ>') });
      return;
    }
    const action = /取消/.test(text) ? 'del' : 'add';
    const result = await updateList('blackManagers', userId, action);
    await message.send({ format: format.addText(result.changed ? `已${action === 'add' ? '授权' : '取消授权'} ${userId}。` : `${userId} 状态未变化。`) });
    return;
  }

  if (/^(#|＃|!|！)?(加|删)(黑|白)/.test(text.trim())) {
    const userId = parseUserId(text, rawArgs, mentioned.data?.UserId, /^\s*[#＃!！]?(加|删)(黑|白)/);
    if (!userId) {
      await message.send({ format: format.addText('请使用：#加黑 <QQ> / #删黑 <QQ> / #加白 <QQ> / #删白 <QQ>') });
      return;
    }
    const kind = /黑/.test(text) ? 'black' : 'white';
    if (kind === 'black' && !(await ensureBlacklistPermission())) return;
    if (kind === 'white' && !(await ensureWhitelistPermission())) return;
    const action = /加/.test(text) ? 'add' : 'del';
    const result = await updateList(kind, userId, action);
    await message.send({ format: format.addText(result.changed ? `已${action === 'add' ? '添加' : '删除'}${listTitle(kind)} QQ(${userId})。` : `QQ(${userId}) 状态未变化。`) });
    return;
  }

  if (/查黑/.test(text)) {
    if (!(await ensureBlacklistPermission())) return;
    const [client] = useClient(event.current);
    const allGroups = /全群查黑/.test(text);
    if (allGroups && !event.current.IsMaster) {
      await message.send({ format: format.addText('只有主人才能全群查黑。') });
      return;
    }
    const groupId = getEventGroupId(event.current);
    if (!groupId && !allGroups) {
      await message.send({ format: format.addText('请在群内使用 #查黑。') });
      return;
    }
    const lists = await getGroupLists();
    if (!lists.black.length) {
      await message.send({ format: format.addText('黑名单为空，无需检查。') });
      return;
    }
    const groupIds = allGroups ? normalizeGroupList(await client.getGroupList()).map(group => Number(group.group_id)).filter(Boolean) : [groupId].filter((item): item is number => Boolean(item));
    if (!groupIds.length) {
      await message.send({ format: format.addText('未获取到可检查的群列表。') });
      return;
    }
    let success = 0;
    let failed = 0;
    let found = 0;
    const summaries: string[] = [];
    for (const currentGroupId of groupIds) {
      if (!await hasBotGroupAdminPermission(event.current, currentGroupId)) {
        if (allGroups) summaries.push(`${currentGroupId}: Bot 权限不足`);
        failed++;
        continue;
      }
      const members = normalizeGroupMemberList(await client.getGroupMemberList({ group_id: currentGroupId }));
      const targets = members.filter(member => lists.black.includes(String(member.user_id))).map(member => Number(member.user_id));
      found += targets.length;
      if (!targets.length && allGroups) {
        summaries.push(`${currentGroupId}: 未发现`);
        continue;
      }
      for (const userId of targets) {
        try {
          await client.setGroupKick({ group_id: currentGroupId, user_id: userId, reject_add_request: false });
          success++;
        } catch (error) {
          logger.warn(`kick blacklist member failed: ${error instanceof Error ? error.message : String(error)}`);
          failed++;
        }
      }
      if (allGroups && targets.length) summaries.push(`${currentGroupId}: 发现 ${targets.length} 人`);
    }
    if (!found) {
      await message.send({ format: format.addText(allGroups ? summaries.join('\n') || '所有群均未发现黑名单成员。' : '群内未发现黑名单成员。') });
      return;
    }
    await message.send({ format: format.addText([allGroups ? '全群查黑完成。' : '查黑完成。', allGroups && summaries.length ? summaries.join('\n') : '', `发现 ${found} 人，踢出成功 ${success}，失败 ${failed}。`].filter(Boolean).join('\n')) });
  }
};
