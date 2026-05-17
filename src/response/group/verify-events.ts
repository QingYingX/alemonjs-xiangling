import { logger, useEvent } from 'alemonjs';
import { getEventGroupId, toSafeInteger } from '../../model/group/admin';
import { checkVerifyAnswer, deleteVerifyState, getVerifyState, saveVerifyState, shouldVerifyJoin } from '../../model/group/verify';
import { clearVerifyTimer, startVerify } from './verify-settings';
import { finishVerifyWithKick, getMessageId, recallLastVerifyPrompt, recallMsg, recallVerifyMsgs, sendVerifyFailPrompt, sendVerifySuccess } from './verify-message';

const isPossibleAnswer = (text: string): boolean => /^\s*(\d+|[0-9a-f]{7}|[0-9a-f]{40})\s*$/i.test(text);

export default async (_event?: unknown, next?: () => Promise<void> | void) => {
  const [event] = useEvent<'member.add' | 'member.remove' | 'message.create'>();
  const groupId = getEventGroupId(event.current);
  const userId = toSafeInteger(event.current.UserId);
  if (!groupId || !userId) {
    await next?.();
    return;
  }

  if (event.current.name === 'member.add') {
    if (await shouldVerifyJoin(event.current, groupId, userId)) {
      logger.info(`xiangling start verify: group=${groupId} user=${userId}`);
      await startVerify(event.current, groupId, userId);
      (event.current as typeof event.current & { __xianglingVerifyStarted?: boolean }).__xianglingVerifyStarted = true;
      return false;
    }
    await next?.();
    return;
  }

  if (event.current.name === 'member.remove') {
    if (await getVerifyState(groupId, userId)) {
      clearVerifyTimer(groupId, userId);
      await deleteVerifyState(groupId, userId);
      logger.info(`xiangling clear verify state after member removed: group=${groupId} user=${userId}`);
    }
    await next?.();
    return;
  }

  const text = (event.current.MessageText || '').trim();
  if (!isPossibleAnswer(text)) {
    await next?.();
    return;
  }
  const state = await getVerifyState(groupId, userId);
  if (!state) {
    logger.info(`xiangling verify answer ignored without state: group=${groupId} user=${userId} text=${text}`);
    await next?.();
    return;
  }

  const answerMessageId = getMessageId(event.current);
  const stateAfterRecall = await recallLastVerifyPrompt(event.current, state);

  if (checkVerifyAnswer(text, stateAfterRecall)) {
    clearVerifyTimer(groupId, userId);
    await recallMsg(event.current, answerMessageId);
    await recallVerifyMsgs(event.current, stateAfterRecall);
    await deleteVerifyState(groupId, userId);
    await sendVerifySuccess(event.current, groupId, userId);
    return false;
  }

  const nextState = { ...stateAfterRecall, remainTimes: stateAfterRecall.remainTimes - 1, lastFailAt: Date.now() };
  if (nextState.remainTimes > 0) {
    await recallMsg(event.current, answerMessageId);
    const failMsgId = await sendVerifyFailPrompt(event.current, nextState);
    await saveVerifyState({ ...nextState, failMsgId });
    return false;
  }

  clearVerifyTimer(groupId, userId);
  await recallMsg(event.current, answerMessageId);
  await recallVerifyMsgs(event.current, stateAfterRecall);
  await finishVerifyWithKick(event.current, groupId, userId, '验证失败，请重新申请');
  return false;
};
