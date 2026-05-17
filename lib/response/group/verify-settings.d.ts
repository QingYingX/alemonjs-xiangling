import { useEvent } from 'alemonjs';
export declare const clearVerifyTimer: (groupId: number, userId: number) => void;
export declare const startVerify: (event: ReturnType<typeof useEvent<"message.create" | "member.add">>[0]["current"], groupId: number, userId: number) => Promise<import("../../model/group/verify").VerifyState>;
declare const _default: () => Promise<boolean>;
export default _default;
