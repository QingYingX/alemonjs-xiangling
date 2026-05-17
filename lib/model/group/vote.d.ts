export type VoteType = 'ban' | 'kick';
export type VoteConfig = {
    voteBan: boolean;
    voteKick: boolean;
    outTime: number;
    minNum: number;
    banTime: number;
    veto: boolean;
    voteAdmin: boolean;
};
export type VoteState = {
    groupId: number;
    targetUserId: number;
    creatorUserId: number;
    type: VoteType;
    support: string[];
    oppose: string[];
    createdAt: number;
    expireAt: number;
    ended: boolean;
};
export declare const getVoteConfig: () => Promise<VoteConfig>;
export declare const setVoteConfig: (value: Partial<VoteConfig>) => Promise<VoteConfig>;
export declare const setVoteSwitch: (type: VoteType, enabled: boolean) => Promise<{
    changed: boolean;
    config: VoteConfig;
}>;
export declare const setVoteNumberConfig: (name: "outTime" | "minNum" | "banTime", value: number) => Promise<VoteConfig>;
export declare const setVoteBooleanConfig: (name: "veto" | "voteAdmin", value: boolean) => Promise<{
    changed: boolean;
    config: VoteConfig;
}>;
export declare const formatVoteConfig: (config: VoteConfig) => string;
export declare const getVoteState: (groupId: number, targetUserId: number) => Promise<VoteState | null>;
export declare const createVoteState: (state: VoteState, ttlSeconds: number) => Promise<VoteState>;
export declare const updateVoteState: (state: VoteState) => Promise<VoteState>;
export declare const endVoteState: (groupId: number, targetUserId: number) => Promise<VoteState | null>;
export declare const addVote: (state: VoteState, userId: number | string, support: boolean) => {
    changed: boolean;
    state: VoteState;
};
export declare const isVoteSuccess: (state: VoteState, config: VoteConfig) => boolean;
export declare const formatVoteResult: (state: VoteState, config: VoteConfig) => string;
