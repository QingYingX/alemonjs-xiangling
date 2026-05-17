import { Format, logger, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import { normalizeGroupList, warnUnsupportedShape } from '../../adapter/onebot';
import { formatGroupList } from '../../model/group/tools';
import ListCardImage, { type ListCardData } from '../../image/component/list-card';

const renderListImage = async (data: ListCardData): Promise<Buffer | null> => {
  try {
    return await renderComponentIsHtmlToBuffer(ListCardImage, { data }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
  } catch (error) {
    logger.warn(`group list image render failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const [client] = useClient(event.current);
  const raw = await client.getGroupList();
  const groups = normalizeGroupList(raw);
  if (!groups.length) warnUnsupportedShape('getGroupList', raw);

  const sorted = [...groups].sort((a, b) => Number(a.group_id) - Number(b.group_id));
  const totalMembers = sorted.reduce((sum, group) => sum + (Number(group.member_count) || 0), 0);
  const totalMax = sorted.reduce((sum, group) => sum + (Number(group.max_member_count) || 0), 0);
  const img = await renderListImage({
    title: '群列表',
    subTitle: `当前账号共加入 ${sorted.length} 个群`,
    summary: [`总成员 ${totalMembers}`, totalMax ? `人数上限 ${totalMax}` : '人数上限未知', sorted.length > 80 ? `仅显示前 80 个` : '全部显示'],
    emptyText: '群列表为空，或当前 OneBot 实现未返回群列表。',
    items: sorted.slice(0, 80).map((group, index) => ({
      title: `${index + 1}. ${group.group_name || '未知群名'}`,
      subtitle: `群号：${group.group_id}`,
      content: `当前成员：${Number(group.member_count) || 0}\n人数上限：${Number(group.max_member_count) || 0 || '未知'}`,
      tags: [`${Number(group.member_count) || 0}人`]
    }))
  });
  if (img) {
    await message.send({ format: Format.create().addImage(img) });
    return;
  }

  await message.send({
    format: Format.create().addText(formatGroupList(groups))
  });
};
