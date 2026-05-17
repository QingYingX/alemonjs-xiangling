export type NoticeSettingKey = 'privateMessage' | 'groupMessage' | 'groupTemporaryMessage' | 'groupRecall' | 'privateRecall' | 'friendRequest' | 'groupInviteRequest' | 'addGroupApplication' | 'groupAdminChange' | 'friendNumberChange' | 'groupNumberChange' | 'groupMemberNumberChange' | 'botBeenBanned';
export type NoticeSettings = Record<NoticeSettingKey, boolean> & {
    msgSaveDeltime: number;
    notificationsAll: boolean;
};
export declare const noticeKeyMap: Record<string, NoticeSettingKey | 'msgSaveDeltime' | 'notificationsAll'>;
export declare const getDefaultNoticeSettings: () => NoticeSettings;
export declare const getNoticeSettings: (scope?: string) => Promise<NoticeSettings>;
export declare const setNoticeSettings: (settings: Partial<NoticeSettings>, scope?: string) => Promise<NoticeSettings>;
export declare const setNoticeSetting: (name: string, value: boolean | number) => Promise<string>;
export declare const formatNoticeSettings: (settings: NoticeSettings) => string;
