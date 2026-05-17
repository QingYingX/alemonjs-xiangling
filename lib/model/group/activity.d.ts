import type { OneBotGroupMemberInfo } from '../../adapter/onebot';
export type ActivityUnit = '分钟' | '小时' | '天' | '月';
export type PendingActivityCleanup = {
    groupId: number;
    operatorId: number;
    label: string;
    userIds: number[];
    createdAt: number;
    expireAt: number;
};
export declare const parseActivityDuration: (text: string) => {
    count: number;
    unit: ActivityUnit;
} | null;
export declare const parseTrailingNumber: (text: string, fallback?: number) => number;
export declare const savePendingCleanup: (state: Omit<PendingActivityCleanup, "createdAt" | "expireAt">, ttlSeconds?: number) => Promise<PendingActivityCleanup>;
export declare const takePendingCleanup: (groupId: number, operatorId: number) => Promise<PendingActivityCleanup | null>;
export declare const cancelPendingCleanup: (groupId: number, operatorId: number) => Promise<boolean>;
export declare const applyLocalActivity: (members: OneBotGroupMemberInfo[], activity: Map<string, number>) => OneBotGroupMemberInfo[];
export declare const getInactiveMembers: (members: OneBotGroupMemberInfo[], count: number, unit: ActivityUnit, nowSeconds?: number) => OneBotGroupMemberInfo[];
export declare const getNeverSpeakMembers: (members: OneBotGroupMemberInfo[]) => OneBotGroupMemberInfo[];
export declare const formatInactiveMembers: (members: OneBotGroupMemberInfo[], count: number, unit: ActivityUnit, page?: number) => string;
export declare const formatNeverSpeakMembers: (members: OneBotGroupMemberInfo[], page?: number) => string;
export declare const formatInactiveRank: (members: OneBotGroupMemberInfo[], limit: number) => string;
export declare const formatRecentlyJoined: (members: OneBotGroupMemberInfo[], limit: number) => string;
