import { type EventKeys, type Events } from 'alemonjs';
export type VerifyMode = '计算' | '提交';
export type RepoVerifyConfig = {
    platform: 'github' | 'gitee';
    owner: string;
    repo: string;
    branch: string;
};
export type VerifyGroupConfig = {
    mode: VerifyMode;
    repoVerify?: Partial<RepoVerifyConfig>;
};
export type VerifyConfig = {
    enabledGroups: Record<string, VerifyGroupConfig>;
    time: number;
    times: number;
    delayTime: number;
    remindAtLastMinute: boolean;
    repoVerify: RepoVerifyConfig;
    range: {
        min: number;
        max: number;
    };
};
export type VerifyState = {
    groupId: number;
    userId: number;
    mode: VerifyMode;
    verifyCode: string;
    fullCode?: string;
    questionText: string;
    remainTimes: number;
    expireAt: number;
    verifyMsgId?: number | null;
    failMsgId?: number | null;
    remindMsgId?: number | null;
    lastFailAt?: number;
};
export declare const getVerifyConfig: () => Promise<VerifyConfig>;
export declare const setVerifyConfig: (value: Partial<VerifyConfig>) => Promise<VerifyConfig>;
export declare const isVerifyGroup: (groupId: number) => Promise<boolean>;
export declare const setVerifyGroup: (groupId: number, enabled: boolean) => Promise<{
    changed: boolean;
    config: VerifyConfig;
}>;
export declare const getVerifyMode: (groupId: number) => Promise<VerifyMode>;
export declare const setVerifyMode: (groupId: number, mode: VerifyMode) => Promise<VerifyConfig>;
export declare const setVerifyTimeout: (seconds: number) => Promise<VerifyConfig>;
export declare const buildCalcVerifyState: (groupId: number, userId: number) => Promise<VerifyState>;
export declare const buildVerifyState: (groupId: number, userId: number) => Promise<VerifyState>;
export declare const saveVerifyState: (state: VerifyState) => Promise<VerifyState>;
export declare const getVerifyState: (groupId: number, userId: number) => Promise<VerifyState | null>;
export declare const deleteVerifyState: (groupId: number, userId: number) => Promise<void>;
export declare const markVerifyKick: (groupId: number, userId: number) => Promise<void>;
export declare const consumeVerifyKick: (groupId: number, userId: number) => Promise<boolean>;
export declare const checkVerifyAnswer: (message: string, state: VerifyState) => boolean;
export declare const shouldVerifyJoin: <T extends EventKeys>(event: Events[T], groupId: number, userId: number) => Promise<boolean>;
