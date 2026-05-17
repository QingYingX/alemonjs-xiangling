export type FeedbackSettings = {
    enabled: boolean;
    groups: string[];
};
export declare const getFeedbackSettings: () => Promise<FeedbackSettings>;
export declare const setFeedbackSettings: (value: Partial<FeedbackSettings>) => Promise<FeedbackSettings>;
