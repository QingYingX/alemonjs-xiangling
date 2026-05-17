import { Format, useEvent, useMention, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberInfo } from '../../adapter/onebot';
import { getEventGroupId, getRawArgs, parseDurationArg, parseTargetArgs, toSafeInteger } from '../../model/group/admin';
import { isInList } from '../../model/group/lists';
import { hasBotGroupAdminPermission, hasBotGroupOwnerPermission, isMasterUser } from '../../model/group/permissions';

const unitReg = /^(秒|s|S|分|分钟|m|M|时|小时|h|H|天|日|d|D|周|w|W|月|年|y|Y)$/;

const durationLabel = (args: string[], seconds: number): string => {
  if (!args.length) return `${seconds}秒`;
  const last = args[args.length - 1] || '';
  const prev = args[args.length - 2] || '';
  if (unitReg.test(last) && prev) return `${prev}${last}`;
  return /[秒分时小时天日周月年smhdwy]/i.test(last) ? last : `${last || seconds}秒`;
};

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const [mention] = useMention();
  const mentioned = await mention.findOne();
  const mentionedList = await mention.find();
  const target = parseTargetArgs(event.current, mentioned.data?.UserId);

  if (!target) {
    await message.send({ format: Format.create().addText('请在群内使用：#禁言 @用户 [秒数]，或私聊使用：#禁言 <群号> <QQ> [秒数]') });
    return;
  }

  if (!await hasBotGroupAdminPermission(event.current, target.groupId)) {
    await message.send({ format: Format.create().addText('Bot 权限不足，需要管理员权限。') });
    return;
  }

  const rawArgs = getRawArgs(event.current);
  const currentGroupId = getEventGroupId(event.current);
  const durationArgs = currentGroupId
    ? (toSafeInteger(rawArgs[0]) === target.userId ? rawArgs.slice(1) : rawArgs)
    : rawArgs.slice(2);
  const duration = parseDurationArg(durationArgs, 300);
  const label = durationLabel(durationArgs, duration);
  const [client] = useClient(event.current);
  const targetIds = mentionedList.data?.length
    ? mentionedList.data.map(item => toSafeInteger(item.UserId)).filter((item): item is number => item !== null)
    : [target.userId];
  const names: string[] = [];
  const botIsOwner = await hasBotGroupOwnerPermission(event.current, target.groupId);

  for (const userId of [...new Set(targetIds)]) {
    if (isMasterUser(event.current, userId)) {
      await message.send({ format: Format.create().addText('❎ 该命令对主人无效') });
      return;
    }
    const member = normalizeGroupMemberInfo(await client.getGroupMemberInfo({ group_id: target.groupId, user_id: userId, no_cache: false }));
    if (!member) {
      await message.send({ format: Format.create().addText(`❎ 该群没有${targetIds.length > 1 ? userId : '这个人'}哦~`) });
      return;
    }
    if (member.role === 'owner') {
      await message.send({ format: Format.create().addText('❎ 权限不足，该命令对群主无效') });
      return;
    }
    if (member.role === 'admin') {
      if (!botIsOwner) {
        await message.send({ format: Format.create().addText('❎ 权限不足，需要群主权限') });
        return;
      }
      if (!event.current.IsMaster) {
        await message.send({ format: Format.create().addText('❎ 只有主人才能对管理执行该命令') });
        return;
      }
    }
    if (!event.current.IsMaster && await isInList('white', userId)) {
      await message.send({ format: Format.create().addText(`❎ ${targetIds.length > 1 ? userId : '该用户'}为白名单成员，不可操作`) });
      return;
    }
    await client.setGroupBan({ group_id: target.groupId, user_id: userId, duration });
    names.push(member.card || member.nickname || String(userId));
  }

  await message.send({ format: Format.create().addText(`✅ 已将「${names.join('，')}」禁言${label}`) });
};
