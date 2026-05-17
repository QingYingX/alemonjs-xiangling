import { createStoreKey, getRedis } from '../../adapter/storage';
import { getXianglingConfig } from '../../config/xiangling';

export type ListKind = 'black' | 'white' | 'blackManagers';

type GroupLists = {
  black: string[];
  white: string[];
  blackManagers: string[];
  whiteAutoUnban: boolean;
};

const getDefaultLists = (): GroupLists => {
  const config = getXianglingConfig().group_lists;
  return {
    black: [...config.black],
    white: [...config.white],
    blackManagers: [...config.black_managers],
    whiteAutoUnban: config.white_auto_unban
  };
};

const key = (): string => createStoreKey('group-lists.json');

const normalizeId = (id: unknown): string => String(id ?? '').trim();

export const getGroupLists = async (): Promise<GroupLists> => {
  const raw = await getRedis().get(key());
  if (!raw) return getDefaultLists();
  try {
    const parsed = JSON.parse(raw) as Partial<GroupLists>;
    const defaults = getDefaultLists();
    return {
      black: Array.isArray(parsed.black) ? parsed.black.map(normalizeId).filter(Boolean) : defaults.black,
      white: Array.isArray(parsed.white) ? parsed.white.map(normalizeId).filter(Boolean) : defaults.white,
      blackManagers: Array.isArray(parsed.blackManagers) ? parsed.blackManagers.map(normalizeId).filter(Boolean) : defaults.blackManagers,
      whiteAutoUnban: parsed.whiteAutoUnban ?? defaults.whiteAutoUnban
    };
  } catch {
    return getDefaultLists();
  }
};

const saveGroupLists = async (lists: GroupLists) => {
  await getRedis().set(key(), JSON.stringify(lists));
};

export const setGroupLists = async (value: Partial<GroupLists>): Promise<GroupLists> => {
  const lists: GroupLists = {
    black: Array.isArray(value.black) ? value.black.map(normalizeId).filter(Boolean) : [],
    white: Array.isArray(value.white) ? value.white.map(normalizeId).filter(Boolean) : [],
    blackManagers: Array.isArray(value.blackManagers) ? value.blackManagers.map(normalizeId).filter(Boolean) : [],
    whiteAutoUnban: Boolean(value.whiteAutoUnban)
  };
  await saveGroupLists(lists);
  return lists;
};

export const isInList = async (kind: ListKind, userId: unknown): Promise<boolean> => {
  const lists = await getGroupLists();
  const id = normalizeId(userId);
  return Boolean(id && lists[kind].includes(id));
};

export const updateList = async (kind: ListKind, userId: unknown, action: 'add' | 'del'): Promise<{ changed: boolean; list: string[] }> => {
  const lists = await getGroupLists();
  const id = normalizeId(userId);
  if (!id) return { changed: false, list: lists[kind] };

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

export const setWhiteAutoUnban = async (enable: boolean): Promise<boolean> => {
  const lists = await getGroupLists();
  lists.whiteAutoUnban = enable;
  await saveGroupLists(lists);
  return enable;
};

export const formatList = (title: string, list: string[]): string => {
  if (!list.length) return `${title}为空。`;
  return [`${title}，共 ${list.length} 个：`, ...list.map((item, index) => `${index + 1}. ${item}`)].join('\n');
};
