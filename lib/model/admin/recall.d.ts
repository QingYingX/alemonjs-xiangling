export type RecallMessageSnapshot = {
    messageId: string;
    userId?: string | number;
    userName?: string;
    groupId?: string | number;
    groupName?: string;
    text: string;
    mediaText?: string;
    time: number;
};
export type RecallRecord = RecallMessageSnapshot & {
    operatorId?: string | number;
    recallTime: number;
};
export declare const saveMessageSnapshot: (snapshot: RecallMessageSnapshot) => Promise<void>;
export declare const buildSnapshotFromEvent: (event: {
    MessageId?: string;
    MessageText?: string;
    MessageMedia?: unknown;
    UserId?: string | number;
    UserName?: string;
    GuildId?: string | number;
    GuildName?: string;
    value?: unknown;
}) => RecallMessageSnapshot | null;
export declare const recordRecall: (params: {
    messageId?: string | number;
    scope: "group" | "private";
    groupId?: string | number;
    operatorId?: string | number;
    fallbackUserId?: string | number;
}) => Promise<RecallRecord | null>;
export declare const listRecallRecords: (scope: "group" | "private", id?: string | number) => Promise<RecallRecord[]>;
export declare const formatRecallRecords: (records: RecallRecord[], title: string) => string;
