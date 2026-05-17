import { useEvent, useMessage, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupList } from '../../adapter/onebot.js';
import { searchGroups, formatGroupList } from '../../model/group/tools.js';

var searchGroup = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const keyword = event.current.__route?.rawArgs?.join(' ').trim() || '';
    if (!keyword) {
        await message.send({
            format: Format.create().addText('请输入搜索关键词：#搜索群 <关键词>')
        });
        return;
    }
    const [client] = useClient(event.current);
    const groups = searchGroups(normalizeGroupList(await client.getGroupList()), keyword);
    const text = groups.length ? formatGroupList(groups) : `未找到匹配群组：${keyword}`;
    await message.send({
        format: Format.create().addText(text)
    });
};

export { searchGroup as default };
