import { type EventKeys, type Events } from 'alemonjs';
export type OneBotGroupInfo = {
    group_id: number;
    group_name?: string;
    member_count?: number;
    max_member_count?: number;
};
export type OneBotFriendInfo = {
    user_id: number;
    nickname?: string;
    remark?: string;
};
export type OneBotGroupMemberInfo = {
    user_id: number;
    nickname?: string;
    card?: string;
    role?: string;
    shut_up_timestamp?: number;
    join_time?: number;
    last_sent_time?: number;
};
export type OneBotGroupHonorInfo = {
    current_talkative?: {
        user_id?: number;
        nickname?: string;
        avatar?: string;
        day_count?: number;
    };
};
export declare const normalizeGroupInfo: (value: unknown) => OneBotGroupInfo | null;
export declare const normalizeGroupList: (value: unknown) => OneBotGroupInfo[];
export declare const normalizeFriendList: (value: unknown) => OneBotFriendInfo[];
export declare const normalizeGroupMemberInfo: (value: unknown) => OneBotGroupMemberInfo | null;
export declare const normalizeGroupMemberList: (value: unknown) => OneBotGroupMemberInfo[];
export declare const warnUnsupportedShape: (name: string, data: unknown) => void;
export declare const sendOneBotAction: <T extends EventKeys>(event: Events[T], action: string, params?: Record<string, unknown>) => Promise<any>;
export declare const setGroupPortrait: <T extends EventKeys>(event: Events[T], groupId: number, file: string) => Promise<any>;
export declare const deleteFriend: <T extends EventKeys>(event: Events[T], userId: number) => Promise<any>;
export declare const ocrImage: <T extends EventKeys>(event: Events[T], image: string) => Promise<any>;
