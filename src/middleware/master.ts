import { Format, useEvent, useMessage } from 'alemonjs';

export default async (_event: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent();

  if (!event.current.IsMaster) {
    const [message] = useMessage();
    await message.send({
      format: Format.create().addText('只有主人才能使用这个命令。')
    });
    return false;
  }

  await next?.();
};
