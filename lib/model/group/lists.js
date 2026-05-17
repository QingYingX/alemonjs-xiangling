import { getRedis, createStoreKey } from '../../adapter/storage.js';
import { getXianglingConfig } from '../../config/xiangling.js';

const getDefaultLists = () => {
    const config = getXianglingConfig().group_lists;
    return {
        black: [...config.black],
        white: [...config.white],
        blackManagers: [...config.black_managers],
        whiteAutoUnban: config.white_auto_unban
    };
};
const key = () => createStoreKey('group-lists.json');
const normalizeId = (id) => String(id ?? '').trim();
const getGroupLists = async () => {
    const raw = await getRedis().get(key());
    if (!raw)
        return getDefaultLists();
    try {
        const parsed = JSON.parse(raw);
        const defaults = getDefaultLists();
        return {
            black: Array.isArray(parsed.black) ? parsed.black.map(normalizeId).filter(Boolean) : defaults.black,
            white: Array.isArray(parsed.white) ? parsed.white.map(normalizeId).filter(Boolean) : defaults.white,
            blackManagers: Array.isArray(parsed.blackManagers) ? parsed.blackManagers.map(normalizeId).filter(Boolean) : defaults.blackManagers,
            whiteAutoUnban: parsed.whiteAutoUnban ?? defaults.whiteAutoUnban
        };
    }
    catch {
        return getDefaultLists();
    }
};
const saveGroupLists = async (lists) => {
    await getRedis().set(key(), JSON.stringify(lists));
};
const setGroupLists = async (value) => {
    const lists = {
        black: Array.isArray(value.black) ? value.black.map(normalizeId).filter(Boolean) : [],
        white: Array.isArray(value.white) ? value.white.map(normalizeId).filter(Boolean) : [],
        blackManagers: Array.isArray(value.blackManagers) ? value.blackManagers.map(normalizeId).filter(Boolean) : [],
        whiteAutoUnban: Boolean(value.whiteAutoUnban)
    };
    await saveGroupLists(lists);
    return lists;
};
const isInList = async (kind, userId) => {
    const lists = await getGroupLists();
    const id = normalizeId(userId);
    return Boolean(id && lists[kind].includes(id));
};
const updateList = async (kind, userId, action) => {
    const lists = await getGroupLists();
    const id = normalizeId(userId);
    if (!id)
        return { changed: false, list: lists[kind] };
    const exists = lists[kind].includes(id);
    if (action === 'add' && !exists) {
        lists[kind] = [...lists[kind], id];
        await saveGroupLists(lists);
        return { changed: true, list: lists[kind] };
    }
    if (action === 'del' && exists) {
        lists[kind] = lists[kind].filter(item => item !== id);
        await saveGroupLists(lists);
        return { changed: true, list: lists[kind] };
    }
    return { changed: false, list: lists[kind] };
};
const setWhiteAutoUnban = async (enable) => {
    const lists = await getGroupLists();
    lists.whiteAutoUnban = enable;
    await saveGroupLists(lists);
    return enable;
};
const formatList = (title, list) => {
    if (!list.length)
        return `${title}为空。`;
    return [`${title}，共 ${list.length} 个：`, ...list.map((item, index) => `${index + 1}. ${item}`)].join('\n');
};

export { formatList, getGroupLists, isInList, setGroupLists, setWhiteAutoUnban, updateList };
