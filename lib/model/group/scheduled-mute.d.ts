import type { Events } from 'alemonjs';
export type ScheduledMuteTask = {
    groupId: number;
    cron: string;
    type: 'mute' | 'unmute';
    scheduleId?: string;
    createdAt: string;
};
export declare const getScheduledMuteTasks: () => Promise<ScheduledMuteTask[]>;
export declare const toCronExpression: (input: string) => string | null;
export declare const scheduleMuteTask: (event: Events["message.create"], task: ScheduledMuteTask) => string;
export declare const addScheduledMuteTask: (event: Events["message.create"], groupId: number, type: "mute" | "unmute", cron: string) => Promise<{
    changed: boolean;
    task: ScheduledMuteTask;
}>;
export declare const removeScheduledMuteTask: (groupId: number, type: "mute" | "unmute") => Promise<boolean>;
export declare const formatScheduledMuteTasks: (tasks: ScheduledMuteTask[]) => string;
