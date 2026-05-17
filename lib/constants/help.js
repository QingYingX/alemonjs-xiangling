import { readFileSync } from 'node:fs';
import YAML from 'yaml';
import fileUrl from '../assets/legacy/config/system/help_default.yaml.js';
import fileUrl$1 from '../assets/legacy/config/system/gpAdmin_default.yaml.js';

const DEFAULT_ORDER = 999;
const FULL_WIDTH_TOP_ORDER = 50;
const parseLegacyHelp = (path) => {
    return YAML.parse(readFileSync(path, 'utf8'));
};
const clampInt = (value, fallback, min, max) => {
    const parsed = Number.parseInt(String(value ?? ''), 10);
    if (Number.isNaN(parsed))
        return fallback;
    return Math.min(max, Math.max(min, parsed));
};
const normalizeIcon = (icon) => {
    const parsed = Number(icon);
    if (!Number.isFinite(parsed) || parsed <= 0)
        return undefined;
    return parsed;
};
const normalizeGroup = (group) => {
    const items = (group.list ?? [])
        .filter(item => item.title)
        .map(item => ({
        title: String(item.title).trim(),
        desc: String(item.desc ?? ''),
        icon: normalizeIcon(item.icon)
    }));
    if (items.length === 0)
        return null;
    return {
        group: String(group.group ?? '未分组'),
        auth: group.auth,
        order: group.order ?? DEFAULT_ORDER,
        items
    };
};
const normalizeGroups = (groups) => {
    return (groups ?? [])
        .map(normalizeGroup)
        .filter((group) => Boolean(group))
        .sort((a, b) => a.order - b.order);
};
const collectLayoutGroups = (legacyList) => {
    const leftGroups = [];
    const rightGroups = [];
    const topFullWidthGroups = [];
    const bottomFullWidthGroups = [];
    if (Array.isArray(legacyList)) {
        const groups = normalizeGroups(legacyList);
        return {
            groups,
            leftGroups,
            rightGroups,
            topFullWidthGroups,
            bottomFullWidthGroups
        };
    }
    const fullWidthGroups = normalizeGroups(legacyList?.fullWidth);
    for (const group of fullWidthGroups) {
        if (group.order < FULL_WIDTH_TOP_ORDER) {
            topFullWidthGroups.push(group);
        }
        else {
            bottomFullWidthGroups.push(group);
        }
    }
    leftGroups.push(...normalizeGroups(legacyList?.left));
    rightGroups.push(...normalizeGroups(legacyList?.right));
    return {
        groups: [...topFullWidthGroups, ...leftGroups, ...rightGroups, ...bottomFullWidthGroups],
        leftGroups,
        rightGroups,
        topFullWidthGroups,
        bottomFullWidthGroups
    };
};
const buildHelpPage = (path, type) => {
    const data = parseLegacyHelp(path);
    const cfg = type === 'general' ? data.helpCfg : data.gpAdminHelpCfg;
    const list = type === 'general' ? data.helpList : data.gpAdminHelpList;
    const layout = collectLayoutGroups(list);
    const colCount = clampInt(cfg?.columnCount ?? cfg?.colCount, 2, 2, 5);
    const colWidth = clampInt(cfg?.colWidth, 380, 200, 600);
    const twoColumnLayout = cfg?.twoColumnLayout === true && layout.leftGroups.length > 0 && layout.rightGroups.length > 0;
    return {
        title: cfg?.title ?? (type === 'general' ? '香菱插件帮助' : '群组管理帮助'),
        subTitle: cfg?.subTitle ?? 'AlemonJS & Xiangling',
        colWidth,
        colCount,
        twoColumnLayout,
        ...layout
    };
};
const getHelpPage = (key) => {
    return key === 'general'
        ? buildHelpPage(fileUrl, 'general')
        : buildHelpPage(fileUrl$1, 'groupAdmin');
};
const formatHelpText = (key = 'general') => {
    const page = getHelpPage(key);
    const body = page.groups
        .map(group => {
        const auth = group.auth && group.auth !== 'all' ? `（${group.auth}）` : '';
        const lines = group.items.map(item => `- ${item.title}: ${item.desc}`);
        return [`${group.group}${auth}:`, ...lines].join('\n');
    })
        .join('\n\n');
    return `${page.title}\n${page.subTitle}\n\n${body}`;
};

export { formatHelpText, getHelpPage };
