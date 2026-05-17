const reg = ['win32'].includes(process.platform) ? /^file:\/\/\// : /^file:\/\// ;
const fileUrl = new URL('../../../../../bg-FIlw4WB3.jpg', import.meta.url).href.replace(reg, '');

export { fileUrl as default };
