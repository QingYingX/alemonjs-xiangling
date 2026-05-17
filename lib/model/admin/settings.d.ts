export type XianglingAdminSettings = {
    stateAsDefault: boolean;
    renderScale: number;
};
export type SettingsItem = {
    key: string;
    value: string;
    hint: string;
    desc: string;
    status?: 'on' | 'off' | 'number' | 'link' | 'disabled';
};
export type SettingsSection = {
    title: string;
    items: SettingsItem[];
};
export type SettingsImageData = {
    label: string;
    version: string;
    migrationStage: string;
    generatedAt: string;
    sections: SettingsSection[];
};
export declare const getAdminSettings: () => Promise<XianglingAdminSettings>;
export declare const setStateAsDefault: (enabled: boolean) => Promise<XianglingAdminSettings>;
export declare const setRenderScale: (value: number) => Promise<XianglingAdminSettings>;
export declare const buildSettingsImageData: () => Promise<SettingsImageData>;
export declare const formatSettingsText: (data: SettingsImageData) => string;
