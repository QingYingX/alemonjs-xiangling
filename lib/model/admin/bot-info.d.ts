export type BotInfoView = {
    botName: string;
    officialWebsite: string;
    officialGroup: string;
    operator: string;
    version: string;
    migrationStage: string;
};
export declare const getBotInfoView: () => BotInfoView;
