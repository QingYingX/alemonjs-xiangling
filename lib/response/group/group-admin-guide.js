import { useEvent, logger } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberList } from '../../adapter/onebot.js';
import { getEventGroupId, toSafeInteger } from '../../model/group/admin.js';
import fileUrl from '../../assets/legacy/resources/setadmin/defset/s1.png.js';
import fileUrl$1 from '../../assets/legacy/resources/setadmin/defset/s2.png.js';
import fileUrl$2 from '../../assets/legacy/resources/setadmin/defset/s3.png.js';
import fileUrl$3 from '../../assets/legacy/resources/setadmin/defset/s4.png.js';

const sameId = (left, right) => Boolean(left && right && String(left) === String(right));
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const imageSteps = [
    { text: '1. 点击右上角按钮', file: fileUrl },
    { text: '2. 再次点击“管理群”', file: fileUrl$1 },
    { text: '3. 找到“设置管理员”点击进入', file: fileUrl$2 },
    { text: '4. 选择机器人账号，修改为“不接收验证消息”', file: fileUrl$3 }
];
var groupAdminGuide = async () => {
    const [event] = useEvent();
    const current = event.current;
    const groupId = getEventGroupId(current);
    const userId = toSafeInteger(current.UserId);
    const botId = toSafeInteger(current.BotId);
    const raw = current.value && typeof current.value === 'object' ? current.value : {};
    const isSet = raw.sub_type === 'set' || /SET$/.test(String(current.tag || ''));
    if (!groupId || !userId || !botId || !isSet || !sameId(userId, botId))
        return;
    const [client] = useClient(current);
    try {
        const members = normalizeGroupMemberList(await client.getGroupMemberList({ group_id: groupId }));
        const owner = members.find(member => member.role === 'owner');
        await client.sendGroupMessage({
            group_id: groupId,
            message: [
                ...(owner?.user_id ? [{ type: 'at', data: { qq: owner.user_id } }] : []),
                { type: 'text', data: { text: '\n香菱已被设置为群管理，请群主按照下方提示进行操作。' } }
            ]
        });
        for (const step of imageSteps) {
            await sleep(350);
            await client.sendGroupMessage({
                group_id: groupId,
                message: [
                    { type: 'text', data: { text: step.text } },
                    { type: 'image', data: { file: step.file } }
                ]
            });
        }
    }
    catch (error) {
        logger.warn(`xiangling group admin guide failed: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export { groupAdminGuide as default };
