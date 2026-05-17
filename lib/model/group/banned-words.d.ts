export type BannedMatchType = 'exact' | 'fuzzy' | 'regex';
export type BannedPenaltyType = 'kick' | 'mute' | 'recall' | 'kickRecall' | 'muteRecall' | 'kickBlack';
export type BannedWord = {
    word: string;
    matchType: BannedMatchType;
    penaltyType: BannedPenaltyType;
    addedBy?: string;
    date: string;
};
export type GroupBannedWordsConfig = {
    muteTime: number;
    words: BannedWord[];
    titleWords: string[];
    titleExactMode: boolean;
};
export declare const matchTypeLabels: Record<BannedMatchType, string>;
export declare const penaltyTypeLabels: Record<BannedPenaltyType, string>;
export declare const getBannedWordsConfig: (groupId: number) => Promise<GroupBannedWordsConfig>;
export declare const replaceBannedWordsConfig: (groupId: number, value: Partial<GroupBannedWordsConfig>) => Promise<GroupBannedWordsConfig>;
export declare const parseBannedMode: (messageText: string) => {
    matchType: BannedMatchType;
    penaltyType: BannedPenaltyType;
};
export declare const addBannedWord: (groupId: number, word: string, matchType: BannedMatchType, penaltyType: BannedPenaltyType, addedBy?: string) => Promise<BannedWord>;
export declare const deleteBannedWord: (groupId: number, word: string) => Promise<boolean>;
export declare const setBannedMuteTime: (groupId: number, seconds: number) => Promise<number>;
export declare const findTriggeredBannedWord: (config: GroupBannedWordsConfig, text: string) => BannedWord | null;
export declare const maskWord: (word: string) => string;
export declare const formatBannedWord: (item: BannedWord, raw?: boolean) => string;
export declare const formatBannedWordList: (config: GroupBannedWordsConfig, raw?: boolean) => string;
export declare const updateTitleWords: (groupId: number, words: string[], action: "add" | "del") => Promise<string[]>;
export declare const toggleTitleExactMode: (groupId: number) => Promise<boolean>;
