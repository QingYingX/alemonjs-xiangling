import { getXianglingConfig } from '../../config/xiangling.js';
import { migrationStage, appVersion } from '../../constants/version.js';

const getBotInfoView = () => {
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

export { getBotInfoView };
