import type { OneBotGroupMemberInfo } from '../../adapter/onebot';
export type WhoAtRecord = {
    userId: string;
    senderName: string;
    message: string;
    messageId?: string;
    time: number;
};
export declare const extractAtUserIds: (rawMessage: unknown) => string[];
export declare const extractRawMessageText: (rawMessage: unknown) => string;
export declare const recordWhoAt: (groupId: string | number, targetUserId: string | number, record: WhoAtRecord) => Promise<void>;
export declare const listWhoAt: (groupId: string | number, userId: string | number) => Promise<WhoAtRecord[]>;
export declare const clearWhoAt: (groupId: string | number, userId: string | number) => Promise<boolean>;
export declare const clearAllWhoAt: (groupId?: string | number) => Promise<number>;
export declare const formatWhoAtRecords: (records: WhoAtRecord[], targetUserId: string | number, member?: OneBotGroupMemberInfo | null) => string;
