import { useEvent, useMessage, Format } from 'alemonjs';
import { getFaceSegments, formatFaces } from '../../model/tools/media.js';

var face = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const faces = getFaceSegments(event.current);
    await message.send({ format: Format.create().addText(formatFaces(faces)) });
};

export { face as default };
