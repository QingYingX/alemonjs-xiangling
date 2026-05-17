export type HelpItem = {
    title: string;
    desc: string;
    icon?: number;
};
export type HelpGroup = {
    group: string;
    auth?: 'all' | 'admin' | 'owner' | 'master';
    order: number;
    items: HelpItem[];
};
export type HelpPage = {
    title: string;
    subTitle: string;
    colWidth: number;
    colCount: number;
    twoColumnLayout: boolean;
    groups: HelpGroup[];
    leftGroups: HelpGroup[];
    rightGroups: HelpGroup[];
    topFullWidthGroups: HelpGroup[];
    bottomFullWidthGroups: HelpGroup[];
};
export declare const getHelpPage: (key: "general" | "groupAdmin") => HelpPage;
export declare const formatHelpText: (key?: "general" | "groupAdmin") => string;
