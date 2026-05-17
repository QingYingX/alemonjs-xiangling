import { Format, useEvent, useMessage } from 'alemonjs';
import { appendWelcomeInputLine, getWelcomeInput } from '../../model/group/welcome';
import { getEventGroupId } from '../../model/group/admin';

const controlPattern = /^\s*[#＃!！]?(设置欢迎|设置退出|结束设置|取消设置|查看欢迎|查看退出|重置欢迎|重置退出|群聊通知帮助)$/;

export default async (_event: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent<'message.create'>();
  const groupId = getEventGroupId(event.current);
  const userId = event.current.UserId;
  const text = (event.current.MessageText || '').trim();

  if (!groupId || !userId || !text || controlPattern.test(text)) {
    await next?.();
    return;
  }

  const state = await getWelcomeInput(groupId, userId);
  if (!state) {
    await next?.();
    return;
  }

  const nextState = await appendWelcomeInputLine(groupId, userId, text);
  const [message] = useMessage();
  await message.send({
    format: Format.create().addText(`已添加${state.kind === 'welcome' ? '欢迎' : '退出'}内容，当前共 ${nextState?.lines.length ?? state.lines.length} 条。`)
  });
  return false;
};
