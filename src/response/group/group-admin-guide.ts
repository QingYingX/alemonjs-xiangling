import { logger, useEvent } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupMemberList } from '../../adapter/onebot';
import { getEventGroupId, toSafeInteger } from '../../model/group/admin';
import step1 from '../../assets/legacy/resources/setadmin/defset/s1.png';
import step2 from '../../assets/legacy/resources/setadmin/defset/s2.png';
import step3 from '../../assets/legacy/resources/setadmin/defset/s3.png';
import step4 from '../../assets/legacy/resources/setadmin/defset/s4.png';

type RawGroupAdminNotice = {
  sub_type?: string;
};

const sameId = (left: unknown, right: unknown): boolean => Boolean(left && right && String(left) === String(right));

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const imageSteps = [
  { text: '1. 点击右上角按钮', file: step1 },
  { text: '2. 再次点击“管理群”', file: step2 },
  { text: '3. 找到“设置管理员”点击进入', file: step3 },
  { text: '4. 选择机器人账号，修改为“不接收验证消息”', file: step4 }
];

export default async () => {
  const [event] = useEvent<'member.update'>();
  const current = event.current;
  const groupId = getEventGroupId(current);
  const userId = toSafeInteger(current.UserId);
  const botId = toSafeInteger(current.BotId);
  const raw = current.value && typeof current.value === 'object' ? current.value as RawGroupAdminNotice : {};
  const isSet = raw.sub_type === 'set' || /SET$/.test(String(current.tag || ''));

  if (!groupId || !userId || !botId || !isSet || !sameId(userId, botId)) return;

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
  } catch (error) {
    logger.warn(`xiangling group admin guide failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};
