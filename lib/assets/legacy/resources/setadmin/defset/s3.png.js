const reg = ['win32'].includes(process.platform) ? /^file:\/\/\// : /^file:\/\// ;
const fileUrl = new URL('../../../../s3-D6FykF_s.png', import.meta.url).href.replace(reg, '');

export { fileUrl as default };
