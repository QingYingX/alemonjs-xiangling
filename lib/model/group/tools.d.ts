import type { OneBotFriendInfo, OneBotGroupInfo } from '../../adapter/onebot';
export declare const toNumberId: (value: unknown) => number | null;
export declare const formatGroupList: (groups: OneBotGroupInfo[]) => string;
export declare const formatFriendList: (friends: OneBotFriendInfo[]) => string;
export declare const formatGroupInfo: (group: OneBotGroupInfo) => string;
export declare const formatGroupMemberStats: (groups: OneBotGroupInfo[]) => string;
export declare const parseIdAndText: (args: string[]) => {
    id: number;
    text: string;
} | null;
export declare const getUserAvatarUrl: (userId: number) => string;
export declare const getGroupAvatarUrl: (groupId: number) => string;
export declare const searchGroups: (groups: OneBotGroupInfo[], keyword: string) => OneBotGroupInfo[];
