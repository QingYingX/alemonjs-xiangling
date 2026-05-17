import { useEvent, logger } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { getGroupManageConfig } from '../../model/admin/group-manage.js';

var autoApproveGroupInvite = async (_event, next) => {
    const [event] = useEvent();
    if (event.current.name !== 'private.guild.add') {
        await next?.();
        return;
    }
    const raw = event.current.value ?? {};
    if (raw.post_type !== 'request' || raw.request_type !== 'group') {
        await next?.();
        return;
    }
    const subType = String(raw.sub_type ?? 'add');
    if (subType !== 'invite') {
        await next?.();
        return;
    }
    const config = await getGroupManageConfig();
    if (!config.autoApproveGroupInvite) {
        await next?.();
        return;
    }
    const flag = String(raw.flag ?? event.current.MessageId ?? '').trim();
    if (!flag) {
        await next?.();
        return;
    }
    try {
        const [client] = useClient(event.current);
        await client.setGroupAddRequest({ flag, sub_type: subType, approve: true });
        logger.info(`xiangling auto approved group invite: ${flag}`);
        return false;
    }
    catch (error) {
        logger.warn(`auto approve group invite failed: ${error instanceof Error ? error.message : String(error)}`);
        await next?.();
    }
};

export { autoApproveGroupInvite as default };
