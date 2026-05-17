import { Format, useEvent, useMessage } from 'alemonjs';
import { formatImageLinks, getMediaUrls } from '../../model/tools/media';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const urls = getMediaUrls(event.current);

  await message.send({ format: Format.create().addText(formatImageLinks(urls)) });
};
