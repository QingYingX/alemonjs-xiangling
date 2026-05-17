import { useEvent, useMessage, Format } from 'alemonjs';
import { hasGroupOwnerPermission } from '../model/group/permissions.js';

var groupOwner = async (_event, next) => {
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

export { groupOwner as default };
