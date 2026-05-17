import { useEvent, useMessage, Format } from 'alemonjs';

var master = async (_event, next) => {
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

export { master as default };
