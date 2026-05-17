const reg = ['win32'].includes(process.platform) ? /^file:\/\/\// : /^file:\/\// ;
const fileUrl = new URL('../../../gpAdmin_default-CYZrEx3_.yaml', import.meta.url).href.replace(reg, '');

export { fileUrl as default };
