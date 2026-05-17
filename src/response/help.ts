import { Format, logger, useEvent, useMessage } from 'alemonjs';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import { formatHelpText, getHelpPage } from '../constants/help';
import HelpImage from '../image/component/help';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const isGroupAdminHelp = /群组管理帮助|群管帮助/.test(event.current.MessageText || '');
  const key = isGroupAdminHelp ? 'groupAdmin' : 'general';
  const page = getHelpPage(key);
  const format = Format.create();

  try {
    const img = await renderComponentIsHtmlToBuffer(HelpImage, { page }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
    if (img) {
      format.addImage(img);
      await message.send({ format });
      return;
    }
  } catch (error) {
    logger.warn(`help image render failed: ${error instanceof Error ? error.message : String(error)}`);
  }

  format.addText(formatHelpText(key));

  await message.send({ format });
};
