import { useEvent, useMessage, Format } from 'alemonjs';
import { hasGroupAdminPermission } from '../model/group/permissions.js';

var groupAdmin = async (_event, next) => {
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

export { groupAdmin as default };
