export type GroupAddNoticeConfig = {
    openGroups: string[];
    message: string;
};
export declare const getGroupAddNoticeConfig: () => Promise<GroupAddNoticeConfig>;
export declare const setGroupAddNoticeConfig: (value: Partial<GroupAddNoticeConfig>) => Promise<GroupAddNoticeConfig>;
export declare const isGroupAddNoticeOpen: (groupId: number | string) => Promise<boolean>;
export declare const setGroupAddNoticeOpen: (groupId: number | string, open: boolean) => Promise<{
    changed: boolean;
    config: GroupAddNoticeConfig;
}>;
export declare const formatGroupAddNotice: (config: GroupAddNoticeConfig) => string;
