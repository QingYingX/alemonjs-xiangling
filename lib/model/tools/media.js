const getMediaUrls = (event, type) => {
    return (event.MessageMedia ?? [])
        .filter(item => !type || item.Type === type)
        .map(item => item.Url || item.FileId || item.FileName || '')
        .filter(Boolean);
};
const getFirstImage = (event) => {
    return getMediaUrls(event, 'image')[0] ?? null;
};
const getFaceSegments = (event) => {
    const rawMessage = event.value?.message;
    if (!Array.isArray(rawMessage))
        return [];
    const faces = new Map();
    for (const item of rawMessage) {
        if (item?.type !== 'face')
            continue;
        const id = String(item.data?.id ?? item.id ?? '').trim();
        if (!id)
            continue;
        faces.set(id, { id, text: item.data?.text ?? item.text });
    }
    return [...faces.values()];
};
const formatImageLinks = (urls) => {
    if (!urls.length)
        return '未检测到图片或文件链接，请发送图片后再使用 #取直链。';
    return [`检测到 ${urls.length} 个链接：`, ...urls.map((url, index) => `${index + 1}. ${url}`)].join('\n');
};
const formatFaces = (faces) => {
    if (!faces.length)
        return '未检测到 QQ 表情，请带表情一起发送 #取face。';
    return faces.map((face, index) => `${index + 1}. id: ${face.id}${face.text ? `\n描述: ${face.text}` : ''}`).join('\n\n');
};
const formatOcrResult = (data) => {
    const words = data ?? {};
    if (typeof words.words === 'string' && words.words.trim())
        return words.words.trim();
    if (Array.isArray(words.texts) && words.texts.length)
        return words.texts.join('\n');
    if (Array.isArray(words.wordslist)) {
        const text = words.wordslist.map(item => item.words).filter(Boolean).join('\n');
        if (text.trim())
            return text.trim();
    }
    return 'OCR 未返回可读文字。';
};

export { formatFaces, formatImageLinks, formatOcrResult, getFaceSegments, getFirstImage, getMediaUrls };
