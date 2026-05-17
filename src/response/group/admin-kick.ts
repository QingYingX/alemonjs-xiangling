import { Format, useEvent, useMention, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberInfo } from '../../adapter/onebot';
import { parseRejectAddRequest, parseTargetArgs } from '../../model/group/admin';
import { isInList, updateList } from '../../model/group/lists';
import { hasBotGroupAdminPermission, hasBotGroupOwnerPermission, isMasterUser } from '../../model/group/permissions';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const [mention] = useMention();
  const mentioned = await mention.findOne();
  const mentionedList = await mention.find();
  const target = parseTargetArgs(event.current, mentioned.data?.UserId);

  if (!target) {
    await message.send({ format: Format.create().addText('请在群内使用：#踢 @用户，或私聊使用：#踢 <群号> <QQ>') });
    return;
  }

  if (!await hasBotGroupAdminPermission(event.current, target.groupId)) {
    await message.send({ format: Format.create().addText('Bot 权限不足，需要管理员权限。') });
    return;
  }

  const rejectAddRequest = parseRejectAddRequest(event.current);
  const [client] = useClient(event.current);
  const targetIds = mentionedList.data?.length
    ? mentionedList.data.map(item => Number(item.UserId)).filter(Number.isSafeInteger)
    : [target.userId];
  const botIsOwner = await hasBotGroupOwnerPermission(event.current, target.groupId);
  const kickedIds: number[] = [];

  for (const userId of [...new Set(targetIds)]) {
    if (isMasterUser(event.current, userId)) {
      await message.send({ format: Format.create().addText('❎ 该命令对主人无效') });
      return;
    }
    const member = normalizeGroupMemberInfo(await client.getGroupMemberInfo({ group_id: target.groupId, user_id: userId, no_cache: false }));
    if (!member) {
      await message.send({ format: Format.create().addText(`❎ 这个群没有${targetIds.length > 1 ? userId : '这个人'}哦~`) });
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
      await message.send({ format: Format.create().addText(`❎ ${targetIds.length > 1 ? userId : '该用户'}是白名单成员，不可操作`) });
      return;
    }
    await client.setGroupKick({ group_id: target.groupId, user_id: userId, reject_add_request: rejectAddRequest });
    kickedIds.push(userId);
  }

  if (rejectAddRequest) {
    for (const userId of kickedIds) {
      await updateList('black', userId, 'add');
    }
    await message.send({ format: Format.create().addText(`✅ 已将「${kickedIds.join('，')}」踢出群聊，并加入黑名单。`) });
    return;
  }
  await message.send({ format: Format.create().addText(`✅ 已将「${kickedIds.join('，')}」踢出群聊`) });
};
