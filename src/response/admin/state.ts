import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Format, logger, useEvent, useMessage } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import { getBotName } from '../../config/xiangling';
import { ensureDataPath, getDataPath } from '../../adapter/storage';
import { buildStateData, formatStateText } from '../../model/admin/state';
import StateImage from '../../image/component/state';

const STATE_ORIG_IMAGE_FILE = 'latest-state.png';

const tryCall = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
  try {
    return await fn();
  } catch {
    return undefined;
  }
};

export default async () => {
  const [event] = useEvent<'message.create' | 'private.message.create'>();
  const [message] = useMessage();
  const [client] = useClient(event.current);
  const text = event.current.MessageText || '';
  const groupId = 'GuildId' in event.current ? event.current.GuildId : undefined;
  const userId = event.current.UserId;
  const botName = getBotName();
  const botId = event.current.BotId;
  const botIdNumber = /^\d+$/.test(String(botId || "")) ? Number(botId) : undefined;
  const groupIdNumber = /^\d+$/.test(String(groupId || "")) ? Number(groupId) : undefined;
  const isOrigImage = /^\s*[#＃!！]?原图\s*$/.test(text);
  if (isOrigImage) {
    try {
      const img = await readFile(join(getDataPath('state'), STATE_ORIG_IMAGE_FILE));
      await message.send({ format: Format.create().addImage(img) });
    } catch {
      await message.send({ format: Format.create().addText('还没有可发送的状态原图，请先发送 #状态。') });
    }
    return;
  }

  const isMonitor = /监控|debug/i.test(text);

  const data = await buildStateData({
    botName,
    userId,
    groupId,
    monitor: isMonitor,
    platform: event.current.Platform,
    botId,
    status: await tryCall(() => client.getStatus()),
    loginInfo: await tryCall(() => client.getLoginInfo()),
    botGroupMemberInfo: botIdNumber && groupIdNumber ? await tryCall(() => client.getGroupMemberInfo({ group_id: groupIdNumber, user_id: botIdNumber, no_cache: true })) : undefined,
    botStrangerInfo: botIdNumber ? await tryCall(() => client.getStrangerInfo({ user_id: botIdNumber, no_cache: true })) : undefined,
    versionInfo: await tryCall(() => client.getVersionInfo()),
    groupList: await tryCall(() => client.getGroupList()),
    friendList: await tryCall(() => client.getFriendList()),
    groupMembers: groupIdNumber ? await tryCall(() => client.getGroupMemberList({ group_id: groupIdNumber })) : undefined
  });

  const format = Format.create();
  try {
    const img = await renderComponentIsHtmlToBuffer(StateImage, { data }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
    if (img) {
      await ensureDataPath('state');
      await writeFile(getDataPath('state', STATE_ORIG_IMAGE_FILE), img);
      format.addImage(img);
      await message.send({ format });
      return;
    }
  } catch (error) {
    logger.warn(`state image render failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  format.addText(formatStateText(data));
  await message.send({ format });
};
