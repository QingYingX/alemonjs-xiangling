import { Format, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberList, warnUnsupportedShape } from '../../adapter/onebot';
import { formatMutedMembers, parseGroupOnlyArgs } from '../../model/group/admin';
import { hasBotGroupAdminPermission, hasGroupAdminPermission } from '../../model/group/permissions';

export default async () => {
  const [event] = useEvent<'message.create' | 'private.message.create'>();
  const [message] = useMessage();
  const target = parseGroupOnlyArgs(event.current);

  if (!target) {
    await message.send({ format: Format.create().addText('请在群内使用，或私聊使用：#禁言列表 <群号> / #解除全部禁言 <群号>') });
    return;
  }

  const [client] = useClient(event.current);
  const raw = await client.getGroupMemberList({ group_id: target.groupId });
  const members = normalizeGroupMemberList(raw);
  if (!members.length) warnUnsupportedShape('getGroupMemberList', raw);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const muted = members.filter(item => Number(item.shut_up_timestamp ?? 0) > nowSeconds);
  const shouldRelease = /解除全部禁言/.test(event.current.MessageText || '');

  if (shouldRelease) {
    if (!await hasGroupAdminPermission(event.current)) {
      await message.send({ format: Format.create().addText('解除全部禁言需要主人、群主或群管理员权限。') });
      return;
    }
    if (!await hasBotGroupAdminPermission(event.current, target.groupId)) {
      await message.send({ format: Format.create().addText('Bot 权限不足，需要管理员权限。') });
      return;
    }
    await Promise.all(muted.map(item => client.setGroupBan({ group_id: target.groupId, user_id: item.user_id, duration: 0 })));
    await message.send({ format: Format.create().addText(`已解除 ${muted.length} 名群成员的禁言。`) });
    return;
  }

  await message.send({ format: Format.create().addText(`禁言列表：\n${formatMutedMembers(members)}`) });
};
