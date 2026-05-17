import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { totalmem, freemem, cpus, loadavg, uptime, hostname, arch, release, platform, networkInterfaces } from 'node:os';
import { promisify } from 'node:util';
import { getRuntimeApp } from 'alemonjs';
import { migrationStage, appVersion } from '../../constants/version.js';
import { getRedis } from '../../adapter/storage.js';
import { normalizeGroupMemberList, normalizeFriendList, normalizeGroupList } from '../../adapter/onebot.js';
import { getMessageStats, getMessageStatsTables, formatMessageStats } from './stats.js';

const execFileAsync = promisify(execFile);
const formatDuration = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds % 86400 / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const parts = [];
    if (days)
        parts.push(`${days}天`);
    if (hours)
        parts.push(`${hours}小时`);
    parts.push(`${minutes}分钟`);
    return parts.join('');
};
const bytes = (value) => {
    if (!Number.isFinite(value) || value < 0)
        return '未知';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index += 1;
    }
    return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
};
const mb = (value) => `${(value / 1024 / 1024).toFixed(1)} MB`;
const pickObject = (value) => {
    if (!value || typeof value !== "object")
        return {};
    const object = value;
    const nested = object.data ?? object.result;
    if (nested && typeof nested === "object") {
        return pickObject(nested);
    }
    return object;
};
const pickText = (...values) => {
    for (const value of values) {
        const text = String(value ?? "").trim();
        if (text)
            return text;
    }
    return undefined;
};
const pickIdText = (...values) => {
    for (const value of values) {
        const text = String(value ?? "").trim();
        if (/^\d+$/.test(text))
            return text;
    }
    return undefined;
};
const statusText = (value, platformName) => {
    if (value === true)
        return "在线";
    if (value === false)
        return "离线";
    const text = String(value ?? "").trim();
    if (!text)
        return platformName === "OneBot" ? "在线" : "未知";
    if (/^(ok|good|online|connected|connect)$/i.test(text))
        return "在线";
    if (/^(offline|disconnect|disconnected|failed|fail|bad)$/i.test(text))
        return "离线";
    return text;
};
const titleCasePlatform = (value) => {
    const text = String(value || '').trim();
    if (!text)
        return 'OneBot';
    if (/^onebot$/i.test(text))
        return 'OneBot';
    return text;
};
const pickOneBotVersion = (version, platformName) => {
    const appName = String(version.app_name || version.appName || '').trim();
    const appVersion = String(version.app_version || version.appVersion || version.version || '').trim();
    if (appName && appVersion)
        return /^v/i.test(appVersion) ? appName + ' ' + appVersion : appName + ' v' + appVersion;
    if (appName)
        return appName;
    if (appVersion)
        return /^v/i.test(appVersion) ? platformName + ' ' + appVersion : platformName + ' v' + appVersion;
    return platformName || 'OneBot';
};
const readCpuTimes = () => {
    const items = cpus();
    const total = items.reduce((sum, item) => sum + Object.values(item.times).reduce((a, b) => a + b, 0), 0);
    const idle = items.reduce((sum, item) => sum + item.times.idle, 0);
    return { total, idle, model: items[0]?.model || '未知', count: items.length };
};
const getCpuPercent = async () => {
    const start = readCpuTimes();
    await new Promise(resolve => setTimeout(resolve, 120));
    const end = readCpuTimes();
    const total = end.total - start.total;
    const idle = end.idle - start.idle;
    if (total <= 0)
        return 0;
    return Math.round((1 - idle / total) * 100);
};
const getSwapMetric = async () => {
    try {
        const raw = await readFile('/proc/meminfo', 'utf8');
        const total = Number(raw.match(/^SwapTotal:\s+(\d+)/m)?.[1] || 0) * 1024;
        const free = Number(raw.match(/^SwapFree:\s+(\d+)/m)?.[1] || 0) * 1024;
        const used = Math.max(0, total - free);
        return {
            title: 'SWAP',
            percent: total > 0 ? Math.round(used / total * 100) : 0,
            detail: total > 0 ? `${bytes(used)} / ${bytes(total)}` : '未启用',
            sub: total > 0 ? `可用 ${bytes(free)}` : undefined
        };
    }
    catch {
        return { title: 'SWAP', percent: 0, detail: '未知' };
    }
};
const getDiskMetrics = async () => {
    try {
        const { stdout } = await execFileAsync('df', ['-kP']);
        return stdout.split('\n').slice(1).map(line => line.trim().split(/\s+/)).filter(parts => parts.length >= 6)
            .filter(parts => !/^tmpfs|devtmpfs|overlay$/.test(parts[0]))
            .slice(0, 8)
            .map(parts => {
            const size = Number(parts[1]) * 1024;
            const used = Number(parts[2]) * 1024;
            return {
                mount: parts.slice(5).join(' '),
                used: bytes(used),
                size: bytes(size),
                percent: size > 0 ? Math.round(used / size * 100) : 0
            };
        });
    }
    catch {
        return [];
    }
};
const getNetworkMetrics = async () => {
    try {
        const raw = await readFile('/proc/net/dev', 'utf8');
        return raw.split('\n').slice(2).map(line => line.trim()).filter(Boolean).map(line => {
            const [namePart, rest] = line.split(':');
            const parts = rest.trim().split(/\s+/).map(Number);
            return { name: namePart.trim(), rx: bytes(parts[0] || 0), tx: bytes(parts[8] || 0) };
        }).filter(item => item.name !== 'lo').slice(0, 6);
    }
    catch {
        return Object.entries(networkInterfaces()).slice(0, 6).map(([name, list]) => ({
            name,
            rx: `${list?.length || 0} 地址`,
            tx: '未知'
        }));
    }
};
const parseRedisInfo = (info) => {
    const map = {};
    for (const line of info.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#'))
            continue;
        const index = trimmed.indexOf(':');
        if (index === -1)
            continue;
        map[trimmed.slice(0, index)] = trimmed.slice(index + 1);
    }
    const keyspace = Object.entries(map).filter(([key]) => /^db\d+$/.test(key)).map(([db, value]) => {
        const pairs = Object.fromEntries(value.split(',').map(item => item.split('=')));
        return { db, keys: pairs.keys || '0', expires: pairs.expires || '0', avgTtl: pairs.avg_ttl || '0' };
    });
    return {
        version: map.redis_version,
        processId: map.process_id,
        uptime: map.uptime_in_seconds ? formatDuration(Number(map.uptime_in_seconds)) : undefined,
        usedMemory: map.used_memory ? bytes(Number(map.used_memory)) : undefined,
        peakMemory: map.used_memory_peak ? bytes(Number(map.used_memory_peak)) : undefined,
        clients: map.connected_clients,
        commands: map.total_commands_processed,
        keyspace
    };
};
const getRedisState = async () => {
    try {
        return parseRedisInfo(await getRedis().info());
    }
    catch {
        return undefined;
    }
};
const getRuntimeSeconds = () => {
    try {
        const createdAt = getRuntimeApp('alemonjs-xiangling')?.createdAt;
        if (typeof createdAt === 'number' && createdAt > 0) {
            return Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
        }
    }
    catch {
    }
    return Math.floor(process.uptime());
};
const getSystemInfo = () => ({
    os: platform(),
    kernel: release(),
    arch: arch(),
    host: hostname(),
    node: process.version,
    processUptime: formatDuration(Math.floor(process.uptime())),
    osUptime: formatDuration(Math.floor(uptime())),
    load: loadavg().map(item => item.toFixed(2)).join(' / ')
});
const buildStateData = async (params) => {
    const memory = process.memoryUsage();
    const login = pickObject(params.loginInfo);
    const botGroupMember = pickObject(params.botGroupMemberInfo);
    const botStranger = pickObject(params.botStrangerInfo);
    const status = pickObject(params.status);
    const version = pickObject(params.versionInfo);
    const stats = await getMessageStats({ userId: params.userId, groupId: params.groupId });
    const statsTables = await getMessageStatsTables({ userId: params.userId, groupId: params.groupId });
    const heapPercent = memory.heapTotal > 0 ? Math.round(memory.heapUsed / memory.heapTotal * 100) : 0;
    const platformName = titleCasePlatform(params.platform);
    const online = status.online ?? status.good ?? status.stat ?? status.status ?? status.connected;
    const platformVersion = pickOneBotVersion(version, platformName);
    const loginId = pickIdText(login.user_id, login.userId, login.self_id, login.selfId, login.id, params.botId);
    const loginName = pickText(login.nickname, login.nick, login.user_name, login.userName, login.name, botGroupMember.card, botGroupMember.nickname, botGroupMember.nick, botGroupMember.user_name, botGroupMember.userName, botStranger.nickname, botStranger.nick, botStranger.user_name, botStranger.userName) || platformName;
    const account = loginId || platformName;
    const title = loginId ? `账号ID ${loginId}` : `${platformName}账号`;
    const totalMemory = totalmem();
    const freeMemory = freemem();
    const cpuInfo = readCpuTimes();
    const cpuPercent = await getCpuPercent();
    const usedMemory = Math.max(0, totalMemory - freeMemory);
    return {
        botName: loginName,
        title,
        version: `alemonjs-xiangling ${appVersion}`,
        migrationStage,
        accountId: loginId || "",
        account,
        platformName,
        oneBotStatus: statusText(online, platformName),
        oneBotVersion: platformVersion,
        uptime: formatDuration(getRuntimeSeconds()),
        memory: {
            rss: mb(memory.rss),
            heapUsed: mb(memory.heapUsed),
            heapTotal: mb(memory.heapTotal),
            heapPercent
        },
        contacts: {
            groups: normalizeGroupList(params.groupList).length || undefined,
            friends: normalizeFriendList(params.friendList).length || undefined,
            groupMembers: normalizeGroupMemberList(params.groupMembers).length || undefined
        },
        stats,
        statsTables,
        metrics: [
            { title: 'CPU', percent: cpuPercent, detail: `${cpuInfo.count} 核`, sub: cpuInfo.model },
            { title: 'RAM', percent: totalMemory > 0 ? Math.round(usedMemory / totalMemory * 100) : 0, detail: `${bytes(usedMemory)} / ${bytes(totalMemory)}`, sub: `可用 ${bytes(freeMemory)}` },
            await getSwapMetric(),
            { title: 'Node', percent: heapPercent, detail: process.version, sub: `${mb(memory.heapUsed)} / ${mb(memory.heapTotal)}` }
        ],
        disks: await getDiskMetrics(),
        network: await getNetworkMetrics(),
        redis: await getRedisState(),
        system: getSystemInfo(),
        monitorJson: params.monitor ? JSON.stringify(status).slice(0, 400) : undefined,
        generatedAt: new Date().toLocaleString('zh-CN', { hour12: false })
    };
};
const formatStateText = (data) => {
    return [
        data.title,
        `版本：${data.version}`,
        `迁移阶段：${data.migrationStage}`,
        `OneBot账号：${data.account}`,
        `OneBot状态：${data.oneBotStatus}`,
        `OneBot版本：${data.oneBotVersion}`,
        `进程运行：${data.uptime}`,
        `内存：RSS ${data.memory.rss} / Heap ${data.memory.heapUsed} / ${data.memory.heapTotal}`,
        '',
        '消息统计',
        formatMessageStats(data.stats),
        data.monitorJson ? `\n监控原始状态：${data.monitorJson}` : ''
    ].filter(Boolean).join('\n');
};
const buildStateText = async (params) => {
    return formatStateText(await buildStateData(params));
};
const buildMonitorText = async (params) => {
    return formatStateText(await buildStateData({ ...params, monitor: true }));
};

export { buildMonitorText, buildStateData, buildStateText, formatStateText };
