import { Format, useEvent, useMessage } from 'alemonjs';
import { ocrImage } from '../../adapter/onebot';
import { formatOcrResult, getFirstImage } from '../../model/tools/media';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const image = getFirstImage(event.current);

  if (!image) {
    await message.send({ format: Format.create().addText('请带图片一起发送 #ocr，或回复图片后再试。') });
    return;
  }

  const result = await ocrImage(event.current, image);
  await message.send({ format: Format.create().addText(formatOcrResult(result)) });
};
