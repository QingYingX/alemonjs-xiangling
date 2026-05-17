const reg = ['win32'].includes(process.platform) ? /^file:\/\/\// : /^file:\/\// ;
const fileUrl = new URL('../../../../s2-DsLmHmvQ.png', import.meta.url).href.replace(reg, '');

export { fileUrl as default };
