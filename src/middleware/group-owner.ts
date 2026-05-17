import { Format, useEvent, useMessage } from 'alemonjs';
import { hasGroupOwnerPermission } from '../model/group/permissions';

export default async (_event: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent();

  if (!await hasGroupOwnerPermission(event.current)) {
    const [message] = useMessage();
    await message.send({
      format: Format.create().addText('需要主人或群主权限。')
    });
    return false;
  }

  await next?.();
};
