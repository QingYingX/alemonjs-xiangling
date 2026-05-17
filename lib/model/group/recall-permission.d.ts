import type { EventKeys, Events } from 'alemonjs';
export type RecallPermissionLevel = 'all' | 'admin' | 'owner' | 'master';
export type RecallPermissionConfig = {
    bot: RecallPermissionLevel;
    member: RecallPermissionLevel;
};
export declare const getRecallPermissionConfig: () => Promise<RecallPermissionConfig>;
export declare const setRecallPermissionConfig: (value: Partial<RecallPermissionConfig>) => Promise<RecallPermissionConfig>;
export declare const hasRecallPermission: <T extends EventKeys>(event: Events[T], level: RecallPermissionLevel) => Promise<boolean>;
