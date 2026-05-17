const reg = ['win32'].includes(process.platform) ? /^file:\/\/\// : /^file:\/\// ;
const fileUrl = new URL('../../../../s4-c2YPXmNn.png', import.meta.url).href.replace(reg, '');

export { fileUrl as default };
