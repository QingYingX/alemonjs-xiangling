import { type MessageStatsRecord, type MessageStatsTable } from './stats';
export type { MessageStatsTable } from './stats';
export type ProgressMetric = {
    title: string;
    percent: number;
    detail: string;
    sub?: string;
};
export type DiskMetric = {
    mount: string;
    used: string;
    size: string;
    percent: number;
};
export type NetworkMetric = {
    name: string;
    rx: string;
    tx: string;
};
export type RedisStateData = {
    version?: string;
    processId?: string;
    uptime?: string;
    usedMemory?: string;
    peakMemory?: string;
    clients?: string;
    commands?: string;
    keyspace: Array<{
        db: string;
        keys: string;
        expires: string;
        avgTtl: string;
    }>;
};
export type SystemInfoData = {
    os: string;
    kernel: string;
    arch: string;
    host: string;
    node: string;
    processUptime: string;
    osUptime: string;
    load: string;
};
export type StateImageData = {
    botName: string;
    title: string;
    accountId: string;
    version: string;
    migrationStage: string;
    account: string;
    platformName: string;
    oneBotStatus: string;
    oneBotVersion: string;
    uptime: string;
    memory: {
        rss: string;
        heapUsed: string;
        heapTotal: string;
        heapPercent: number;
    };
    contacts: {
        groups?: number;
        friends?: number;
        groupMembers?: number;
    };
    stats: MessageStatsRecord[];
    statsTables: MessageStatsTable[];
    metrics: ProgressMetric[];
    disks: DiskMetric[];
    network: NetworkMetric[];
    redis?: RedisStateData;
    system: SystemInfoData;
    monitorJson?: string;
    generatedAt: string;
};
export declare const buildStateData: (params: {
    botName: string;
    userId?: string | number;
    groupId?: string | number;
    loginInfo?: unknown;
    status?: unknown;
    versionInfo?: unknown;
    groupList?: unknown;
    friendList?: unknown;
    groupMembers?: unknown;
    botGroupMemberInfo?: unknown;
    botStrangerInfo?: unknown;
    monitor?: boolean;
    platform?: string;
    botId?: string | number;
}) => Promise<StateImageData>;
export declare const formatStateText: (data: StateImageData) => string;
export declare const buildStateText: (params: Parameters<typeof buildStateData>[0]) => Promise<string>;
export declare const buildMonitorText: (params: Parameters<typeof buildStateData>[0]) => Promise<string>;
