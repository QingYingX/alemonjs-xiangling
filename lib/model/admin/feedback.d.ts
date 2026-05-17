import type { EventKeys, Events } from 'alemonjs';
export type FeedbackRecord = {
    code: string;
    userId: string;
    userName: string;
    groupId?: string;
    content: string;
    createdAt: string;
    isPrivate: boolean;
    botId?: string;
};
export declare const createFeedback: <T extends EventKeys>(event: Events[T], content: string) => Promise<FeedbackRecord>;
export declare const getFeedback: (code: string) => Promise<FeedbackRecord | null>;
export declare const deleteFeedback: (code: string) => Promise<boolean>;
export declare const clearFeedback: () => Promise<number>;
export declare const listFeedback: (page?: number, pageSize?: number) => Promise<{
    total: number;
    pages: number;
    records: FeedbackRecord[];
}>;
export declare const formatFeedbackRecord: (record: FeedbackRecord) => string;
export declare const formatFeedbackList: (page: number, totalPages: number, total: number, records: FeedbackRecord[]) => string;
