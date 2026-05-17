import type { EventKeys, Events } from 'alemonjs';
export type TargetParseResult = {
    groupId: number;
    userId: number;
};
export type GroupOnlyParseResult = {
    groupId: number;
};
export type GroupTextParseResult = GroupOnlyParseResult & {
    text: string;
};
export type TargetTextParseResult = TargetParseResult & {
    text: string;
};
export type CardParseResult = TargetTextParseResult;
export declare const toSafeInteger: (value: unknown) => number | null;
export declare const parseDurationSeconds: (value: unknown, fallback?: number) => number;
export declare const parseDurationArg: (args: string[], fallback?: number) => number;
export declare const getEventGroupId: <T extends EventKeys>(event: Events[T]) => number | null;
export declare const getRawArgs: <T extends EventKeys>(event: Events[T]) => string[];
export declare const getRawArgText: <T extends EventKeys>(event: Events[T]) => string;
export declare const parseTargetArgs: <T extends EventKeys>(event: Events[T], mentionedUserId?: string) => TargetParseResult | null;
export declare const parseGroupOnlyArgs: <T extends EventKeys>(event: Events[T]) => GroupOnlyParseResult | null;
export declare const parseGroupTextArgs: <T extends EventKeys>(event: Events[T]) => GroupTextParseResult | null;
export declare const parseMessageIdArg: <T extends EventKeys>(event: Events[T]) => number | null;
export declare const parseRejectAddRequest: <T extends EventKeys>(event: Events[T]) => boolean;
export declare const parseCardArgs: <T extends EventKeys>(event: Events[T], mentionedUserId?: string) => CardParseResult | null;
export declare const parseTitleArgs: <T extends EventKeys>(event: Events[T], mentionedUserId?: string) => TargetTextParseResult | null;
export declare const parseSelfTitleArgs: <T extends EventKeys>(event: Events[T]) => TargetTextParseResult | null;
export declare const formatMutedMembers: (members: Array<{
    user_id: number;
    nickname?: string;
    card?: string;
    shut_up_timestamp?: number;
}>, now?: number) => string;
