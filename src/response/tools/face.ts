import { Format, useEvent, useMessage } from 'alemonjs';
import { formatFaces, getFaceSegments } from '../../model/tools/media';

export default async () => {
  const [event] = useEvent();
  const [message] = useMessage();
  const faces = getFaceSegments(event.current);

  await message.send({ format: Format.create().addText(formatFaces(faces)) });
};
