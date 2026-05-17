import { mkdir, writeFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { useEvent, useRoute, useMessage, Format } from 'alemonjs';
import { findCommands, commandEntries } from '../../constants/commands.js';
import { getDataPath } from '../../adapter/storage.js';

const pageSize = 25;
const sanitizeFileName = (value) => {
    return basename(value.replace(/[^a-zA-Z0-9._-]+/g, '-')).replace(/^-+|-+$/g, '') || 'commands';
};
const formatCommandExport = (title, entries) => {
    const lines = [
        '香菱指令导出: ' + title,
        '导出时间: ' + new Date().toLocaleString('zh-CN', { hour12: false }),
        '指令总数: ' + entries.length,
        '',
        '='.repeat(50),
        '指令列表',
        '='.repeat(50),
        ''
    ];
    entries.forEach((entry, index) => {
        lines.push(String(index + 1) + '. ' + entry.command);
        lines.push('   模块: ' + entry.module);
        lines.push('   描述: ' + entry.description);
        if (entry.auth && entry.auth !== 'all')
            lines.push('   权限: ' + entry.auth);
        lines.push('');
    });
    return lines.join('\n');
};
const exportCommands = async (args) => {
    const keyword = args[0] || '全部';
    const entries = keyword === '全部' ? commandEntries : findCommands(keyword);
    if (!entries.length)
        return '未找到可导出的指令：' + keyword;
    const dir = getDataPath('commands');
    await mkdir(dir, { recursive: true });
    const fileName = sanitizeFileName(keyword === '全部' ? 'all' : keyword) + '.txt';
    const filePath = join(dir, fileName);
    await writeFile(filePath, formatCommandExport(keyword, entries), 'utf8');
    return [
        '指令导出完成。',
        '范围: ' + keyword,
        '数量: ' + entries.length,
        '文件: ' + filePath
    ].join('\n');
};
const formatEntry = (entry, index) => {
    const auth = entry.auth && entry.auth !== 'all' ? ` [${entry.auth}]` : '';
    return `${index}. ${entry.command}${auth}\n   ${entry.description} -> ${entry.module}`;
};
var commandList = async () => {
    const [event] = useEvent();
    const [route] = useRoute(event.current);
    const [message] = useMessage();
    const text = event.current.MessageText || '';
    const rawArgs = route.rawArgs.length ? route.rawArgs : text.replace(/^[#＃!！]?(指令表|指令查询|指令导出)\s*/, '').trim().split(/\s+/).filter(Boolean);
    if (/指令导出/.test(text)) {
        const result = await exportCommands(rawArgs);
        await message.send({ format: Format.create().addText(result) });
        return false;
    }
    if (/指令查询/.test(text)) {
        const keyword = rawArgs.join(' ').trim();
        if (!keyword) {
            await message.send({ format: Format.create().addText('使用格式：#指令查询 <命令>') });
            return false;
        }
        const matches = findCommands(keyword);
        const body = matches.length
            ? [`找到 ${matches.length} 条匹配：`, ...matches.slice(0, 30).map((entry, index) => formatEntry(entry, index + 1))].join('\n')
            : `未找到匹配命令：${keyword}`;
        await message.send({ format: Format.create().addText(body) });
        return false;
    }
    const pageArg = rawArgs.find(arg => /^\d+$/.test(arg));
    const keyword = rawArgs.filter(arg => !/^\d+$/.test(arg)).join(' ').trim();
    const page = Math.max(1, Number(pageArg || 1));
    const list = keyword ? findCommands(keyword) : commandEntries;
    const pages = Math.max(1, Math.ceil(list.length / pageSize));
    const current = Math.min(page, pages);
    const items = list.slice((current - 1) * pageSize, current * pageSize);
    const body = [
        keyword ? `香菱指令表：${keyword}` : '香菱指令表',
        `第 ${current}/${pages} 页，共 ${list.length} 条`,
        ...items.map((entry, index) => formatEntry(entry, (current - 1) * pageSize + index + 1)),
        '',
        '用法：#指令表 [关键词] [页码] / #指令查询 <命令> / #指令导出 [关键词|全部]'
    ].join('\n');
    await message.send({ format: Format.create().addText(body) });
    return false;
};

export { commandList as default };
