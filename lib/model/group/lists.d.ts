export type ListKind = 'black' | 'white' | 'blackManagers';
type GroupLists = {
    black: string[];
    white: string[];
    blackManagers: string[];
    whiteAutoUnban: boolean;
};
export declare const getGroupLists: () => Promise<GroupLists>;
export declare const setGroupLists: (value: Partial<GroupLists>) => Promise<GroupLists>;
export declare const isInList: (kind: ListKind, userId: unknown) => Promise<boolean>;
export declare const updateList: (kind: ListKind, userId: unknown, action: "add" | "del") => Promise<{
    changed: boolean;
    list: string[];
}>;
export declare const setWhiteAutoUnban: (enable: boolean) => Promise<boolean>;
export declare const formatList: (title: string, list: string[]) => string;
export {};
