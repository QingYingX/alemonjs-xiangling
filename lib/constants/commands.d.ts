export type CommandEntry = {
    command: string;
    module: string;
    description: string;
    auth?: 'all' | 'admin' | 'master' | 'owner';
};
export declare const commandEntries: CommandEntry[];
export declare const findCommands: (keyword: string) => CommandEntry[];
