const reg = ['win32'].includes(process.platform) ? /^file:\/\/\// : /^file:\/\// ;
const fileUrl = new URL('../../../../s1-Cd4xOpcT.png', import.meta.url).href.replace(reg, '');

export { fileUrl as default };
