import { Format, useEvent, useMessage } from 'alemonjs';
import { hasGroupAdminPermission } from '../model/group/permissions';

export default async (_event: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent();

  if (!await hasGroupAdminPermission(event.current)) {
    const [message] = useMessage();
    await message.send({
      format: Format.create().addText('需要主人、群主或群管理员权限。')
    });
    return false;
  }

  await next?.();
};
