import { Format, logger, useEvent, useMessage } from 'alemonjs';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import ListCardImage, { type ListCardData } from '../../image/component/list-card';
import { cancelWelcomeInput, finishWelcomeInput, formatWelcomeConfig, getWelcomeConfig, getWelcomeLines, resetWelcomeLines, setWelcomeLines, startWelcomeInput, type WelcomeKind } from '../../model/group/welcome';
import { getEventGroupId, getRawArgText } from '../../model/group/admin';

const parseKind = (text: string): WelcomeKind | null => {
  if (/欢迎/.test(text)) return 'welcome';
  if (/退出/.test(text)) return 'exit';
  return null;
};

const kindLabel = (kind: WelcomeKind): string => kind === 'welcome' ? '欢迎' : '退出';
const imageCache = new Map<string, Buffer>();
const maxImageCacheSize = 24;

const renderListImage = async (data: ListCardData): Promise<Buffer | null> => {
  const cacheKey = JSON.stringify(data);
  const cached = imageCache.get(cacheKey);
  if (cached) return cached;
  try {
    const img = await renderComponentIsHtmlToBuffer(ListCardImage, { data }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
    imageCache.set(cacheKey, img);
    if (imageCache.size > maxImageCacheSize) {
      const oldestKey = imageCache.keys().next().value;
      if (oldestKey) imageCache.delete(oldestKey);
    }
    return img;
  } catch (error) {
    logger.warn(`welcome settings image render failed: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
};

const helpText = [
  '群聊通知功能命令：',
  '#设置欢迎',
  '#设置退出',
  '#结束设置',
  '#取消设置',
  '#查看欢迎 / #查看退出',
  '#重置欢迎 / #重置退出'
].join('\n');

export default async () => {
  const [event] = useEvent<'message.create'>();
  const [message] = useMessage();
  const groupId = getEventGroupId(event.current);
  const userId = event.current.UserId;
  const text = (event.current.MessageText || '').trim();
  const format = Format.create();

  if (!groupId || !userId) {
    await message.send({ format: format.addText('欢迎与退出消息只能在群聊中设置。') });
    return false;
  }

  if (/^\s*[#＃!！]?群聊通知帮助$/.test(text)) {
    await message.send({ format: format.addText(helpText) });
    return false;
  }

  if (/^\s*[#＃!！]?设置(欢迎|退出)(?:\s|$)/.test(text)) {
    const kind = parseKind(text);
    if (!kind) return false;
    const inlineText = getRawArgText(event.current).trim();
    if (inlineText) {
      const lines = inlineText.split(/\n+/).map(item => item.trim()).filter(Boolean);
      await setWelcomeLines(groupId, kind, lines);
      await message.send({ format: format.addText(`${kindLabel(kind)}消息设置成功：\n${lines.join('\n')}`) });
      return false;
    }
    await startWelcomeInput(groupId, userId, kind);
    await message.send({
      format: format.addText([
        `已进入${kindLabel(kind)}消息输入模式。`,
        `请直接发送要添加的${kindLabel(kind)}文本，可以连续发送多条。`,
        '发送 #结束设置 保存，发送 #取消设置 取消。',
        `也可以直接使用：#设置${kindLabel(kind)} <文本>`
      ].join('\n'))
    });
    return false;
  }

  if (/^\s*[#＃!！]?结束设置$/.test(text)) {
    const current = await finishWelcomeInput(groupId, userId);
    if (!current) {
      await message.send({ format: format.addText('当前没有正在输入的欢迎/退出消息。') });
      return false;
    }
    const lines = current.lines.map(item => item.trim()).filter(Boolean);
    if (!lines.length) {
      await message.send({ format: format.addText('输入内容为空，已取消本次设置。') });
      return false;
    }
    await setWelcomeLines(groupId, current.kind, lines);
    await message.send({ format: format.addText(`${kindLabel(current.kind)}消息设置成功：\n${lines.join('\n')}`) });
    return false;
  }

  if (/^\s*[#＃!！]?取消设置$/.test(text)) {
    await cancelWelcomeInput(groupId, userId);
    await message.send({ format: format.addText('已取消欢迎/退出消息输入。') });
    return false;
  }

  if (/^\s*[#＃!！]?查看(欢迎|退出)$/.test(text)) {
    const kind = parseKind(text);
    if (!kind) return false;
    const config = await getWelcomeConfig(groupId);
    const customLines = kind === 'welcome' ? config.welcomeText : config.exitText;
    const lines = getWelcomeLines(config, kind);
    const img = await renderListImage({
      title: `当前${kindLabel(kind)}消息`,
      subTitle: `群 ${groupId}`,
      summary: [customLines.length ? '自定义消息' : '默认消息', `${lines.length} 行`, `冷却 ${config.welcomeCooldown} 秒`],
      items: lines.map((line, index) => ({
        title: `${index + 1}. ${kindLabel(kind)}文本`,
        content: line
      }))
    });
    if (img) {
      await message.send({ format: Format.create().addImage(img) });
      return false;
    }
    await message.send({ format: format.addText(formatWelcomeConfig(kind, config)) });
    return false;
  }

  if (/^\s*[#＃!！]?重置(欢迎|退出)$/.test(text)) {
    const kind = parseKind(text);
    if (!kind) return false;
    await resetWelcomeLines(groupId, kind);
    await message.send({ format: format.addText(`${kindLabel(kind)}消息已重置为默认消息。`) });
    return false;
  }
  await message.send({ format: format.addText(helpText) });
};
