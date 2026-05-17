import { Format, logger, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import { normalizeGroupList } from '../../adapter/onebot';
import { formatGroupMemberStats } from '../../model/group/tools';
import ListCardImage, { type ListCardData } from '../../image/component/list-card';

const renderListImage = async (data: ListCardData): Promise<Buffer | null> => {
  try {
    return await renderComponentIsHtmlToBuffer(ListCardImage, { data }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
  } catch (error) {
    logger.warn(`member stats image render failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const [client] = useClient(event.current);
  const groups = normalizeGroupList(await client.getGroupList());
  const sorted = [...groups].sort((a, b) => (Number(b.member_count) || 0) - (Number(a.member_count) || 0));
  const totalMembers = sorted.reduce((sum, group) => sum + (Number(group.member_count) || 0), 0);
  const totalMax = sorted.reduce((sum, group) => sum + (Number(group.max_member_count) || 0), 0);
  const img = await renderListImage({
    title: '群员统计',
    subTitle: `当前账号共 ${sorted.length} 个群`,
    summary: [`成员总数 ${totalMembers}`, totalMax ? `人数上限 ${totalMax}` : '人数上限未知', sorted.length > 80 ? '仅显示前 80 个' : '全部显示'],
    emptyText: '群列表为空，无法统计群成员。',
    items: sorted.slice(0, 80).map((group, index) => {
      const count = Number(group.member_count) || 0;
      const max = Number(group.max_member_count) || 0;
      const percent = max > 0 ? `${Math.round(count / max * 100)}%` : '未知';
      return {
        title: `${index + 1}. ${group.group_name || '未知群名'}`,
        subtitle: `群号：${group.group_id}`,
        content: `当前成员：${count}\n人数上限：${max || '未知'}\n占用比例：${percent}`,
        tags: [`${count}/${max || '?'}`]
      };
    })
  });
  if (img) {
    await message.send({ format: Format.create().addImage(img) });
    return;
  }

  await message.send({
    format: Format.create().addText(formatGroupMemberStats(groups))
  });
};
