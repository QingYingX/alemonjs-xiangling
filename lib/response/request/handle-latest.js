import { useEvent, useMessage, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { listRequests, removeRequest } from '../../model/admin/requests.js';
import { getEventGroupId } from '../../model/group/admin.js';

const send = async (text) => {
    const [message] = useMessage();
    await message.send({ format: Format.create().addText(text) });
};
const describe = (record) => {
    if (record.kind === 'friend')
        return '好友申请 ' + record.userId;
    return '群请求 ' + record.userId + (record.groupId ? ' / 群 ' + record.groupId : '');
};
var handleLatest = async () => {
    const [event] = useEvent();
    const approve = /同意/.test(event.current.MessageText || '');
    const groupId = getEventGroupId(event.current);
    const friendRecords = await listRequests('friend');
    const groupRecords = await listRequests('group');
    const scopedGroupRecords = groupId ? groupRecords.filter(item => item.groupId === String(groupId)) : [];
    const candidates = scopedGroupRecords.length ? scopedGroupRecords : [...friendRecords, ...groupRecords];
    if (!candidates.length) {
        await send('暂无可处理的好友申请、加群申请或群邀请。');
        return false;
    }
    if (candidates.length > 1) {
        await send([
            '当前有多条待处理请求，请使用明确命令处理：',
            ...candidates.slice(0, 8).map((item, index) => String(index + 1) + '. ' + describe(item) + ' flag: ' + item.flag),
            '',
            '示例：#同意好友申请 <QQ或flag> / #拒绝加群申请 <QQ/群号/flag>'
        ].join('\n'));
        return false;
    }
    const record = candidates[0];
    const [client] = useClient(event.current);
    if (record.kind === 'friend') {
        await client.setFriendAddRequest({ flag: record.flag, approve });
    }
    else {
        await client.setGroupAddRequest({ flag: record.flag, sub_type: record.subType || 'add', approve });
    }
    await removeRequest(record.kind, record.flag);
    await send('已' + (approve ? '同意' : '拒绝') + describe(record) + '。');
    return false;
};

export { handleLatest as default };
