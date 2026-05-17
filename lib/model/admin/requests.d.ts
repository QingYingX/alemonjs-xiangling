import type { EventKeys, Events } from 'alemonjs';
export type RequestKind = 'friend' | 'group';
export type RequestRecord = {
    kind: RequestKind;
    flag: string;
    userId: string;
    groupId?: string;
    subType?: string;
    comment?: string;
    createdAt: string;
    botId?: string;
};
export declare const saveRequest: <T extends EventKeys>(event: Events[T], kind: RequestKind) => Promise<RequestRecord | null>;
export declare const getRequest: (kind: RequestKind, flag: string) => Promise<RequestRecord | null>;
export declare const removeRequest: (kind: RequestKind, flag: string) => Promise<void>;
export declare const findRequest: (kind: RequestKind, keyword: string) => Promise<RequestRecord | null>;
export declare const listRequests: (kind: RequestKind) => Promise<RequestRecord[]>;
export declare const formatRequestList: (kind: RequestKind, records: RequestRecord[]) => string;
