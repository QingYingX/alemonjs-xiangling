import { useEvent, useMessage, Format } from 'alemonjs';
import { getMediaUrls, formatImageLinks } from '../../model/tools/media.js';

var imageLink = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const urls = getMediaUrls(event.current);
    await message.send({ format: Format.create().addText(formatImageLinks(urls)) });
};

export { imageLink as default };
