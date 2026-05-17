const reg = ['win32'].includes(process.platform) ? /^file:\/\/\// : /^file:\/\// ;
const fileUrl = new URL('../../../../NZBZ-WoQgSQwi.ttf', import.meta.url).href.replace(reg, '');

export { fileUrl as default };
