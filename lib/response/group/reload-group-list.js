import { useEvent, useMessage, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupList } from '../../adapter/onebot.js';
import { formatGroupMemberStats } from '../../model/group/tools.js';

var reloadGroupList = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const [client] = useClient(event.current);
    const groups = normalizeGroupList(await client.getGroupList());
    await message.send({
        format: Format.create().addText(`已重新从 OneBot 获取群列表。\n\n${formatGroupMemberStats(groups)}`)
    });
};

export { reloadGroupList as default };
