type MessageStatsScope = {
    userId?: string | number;
    groupId?: string | number;
    botId?: string | number;
};
type MessageStatsOptions = MessageStatsScope & {
    time?: number;
    direction?: 'receive' | 'send';
};
export type MessageStatsRecord = {
    label: string;
    today: number;
    yesterday: number;
    month: number;
    total: number;
};
export type MessageStatsTableRow = {
    label: string;
    receive: number;
    send: number;
};
export type MessageStatsTable = {
    title: string;
    rows: MessageStatsTableRow[];
};
export type GroupUserActivityRecord = {
    userId: string;
    lastTime: number;
};
export declare const recordMessageStats: (options: MessageStatsOptions) => Promise<void>;
export declare const getGroupUserActivity: (groupId: string | number) => Promise<Map<string, number>>;
export declare const listGroupUserActivity: (groupId: string | number) => Promise<GroupUserActivityRecord[]>;
export declare const getMessageStats: (scope?: MessageStatsScope, direction?: "receive" | "send") => Promise<MessageStatsRecord[]>;
export declare const getMessageStatsTables: (scope?: MessageStatsScope) => Promise<MessageStatsTable[]>;
export declare const formatMessageStats: (records: MessageStatsRecord[]) => string;
export {};
