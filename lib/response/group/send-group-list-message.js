import { useEvent, useMessage, Format } from 'alemonjs';
import { useClient } from '@alemonjs/onebot';
import { normalizeGroupList } from '../../adapter/onebot.js';
import { getRawArgText, toSafeInteger } from '../../model/group/admin.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const parseInput = (text) => {
    const normalized = text.replace(/^[#＃!！]?发群列表\s*/, '').trim();
    const match = normalized.match(/^([\d,，]+)\s+([\s\S]+)$/);
    if (!match)
        return null;
    const indexes = match[1].split(/[，,]/).map(item => toSafeInteger(item)).filter((item) => item !== null && item > 0);
    const message = match[2].trim();
    return indexes.length && message ? { indexes, message } : null;
};
var sendGroupListMessage = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const input = parseInput(event.current.MessageText || '') ?? parseInput('#发群列表 ' + getRawArgText(event.current));
    if (!input) {
        await message.send({ format: Format.create().addText('请使用：#发群列表 <序号1,序号2> <消息>。序号来自 #群列表。') });
        return;
    }
    if (input.indexes.length > 3) {
        await message.send({ format: Format.create().addText('一次最多发送 3 个群，请分批操作。') });
        return;
    }
    const [client] = useClient(event.current);
    const groups = normalizeGroupList(await client.getGroupList()).sort((a, b) => Number(a.group_id) - Number(b.group_id));
    const targets = input.indexes.map(index => groups[index - 1]).filter(Boolean);
    if (targets.length !== input.indexes.length) {
        await message.send({ format: Format.create().addText('群序号超出范围，请先使用 #群列表 查看。') });
        return;
    }
    const results = [];
    for (const [index, group] of targets.entries()) {
        try {
            await client.sendGroupMessage({ group_id: group.group_id, message: [{ type: 'text', data: { text: input.message } }] });
            results.push(`✅ ${group.group_name || group.group_id}(${group.group_id}) 已送达`);
        }
        catch (error) {
            results.push(`❎ ${group.group_name || group.group_id}(${group.group_id}) 发送失败：${error instanceof Error ? error.message : String(error)}`);
        }
        if (index < targets.length - 1)
            await sleep(5000);
    }
    await message.send({ format: Format.create().addText(results.join('\n')) });
};

export { sendGroupListMessage as default };
