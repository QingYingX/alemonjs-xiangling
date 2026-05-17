const reg = ['win32'].includes(process.platform) ? /^file:\/\/\// : /^file:\/\// ;
const fileUrl = new URL('../../../../FZB-zYNQuV7D.ttf', import.meta.url).href.replace(reg, '');

export { fileUrl as default };
