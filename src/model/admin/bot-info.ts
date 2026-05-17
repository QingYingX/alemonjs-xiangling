import { getXianglingConfig } from '../../config/xiangling';
import { appVersion, migrationStage } from '../../constants/version';

export type BotInfoView = {
  botName: string;
  officialWebsite: string;
  officialGroup: string;
  operator: string;
  version: string;
  migrationStage: string;
};

export const getBotInfoView = (): BotInfoView => {
  const config = getXianglingConfig();

  return {
    botName: config.bot_name,
    officialWebsite: config.official_website,
    officialGroup: config.official_group,
    operator: config.operator,
    version: appVersion,
    migrationStage
  };
};
