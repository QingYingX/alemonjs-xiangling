const reg = ['win32'].includes(process.platform) ? /^file:\/\/\// : /^file:\/\// ;
const fileUrl = new URL('../../../../../icon-aE2yG17_.png', import.meta.url).href.replace(reg, '');

export { fileUrl as default };
