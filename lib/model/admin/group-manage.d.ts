export type GroupManageConfig = {
    autoApproveGroupInvite: boolean;
};
export declare const getGroupManageConfig: () => Promise<GroupManageConfig>;
export declare const setGroupManageConfig: (value: Partial<GroupManageConfig>) => Promise<GroupManageConfig>;
