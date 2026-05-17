import { useMessage, Format } from 'alemonjs';
import { getBotInfoView } from '../../model/admin/bot-info.js';

const formatOptional = (label, value) => {
    return value ? `${label}: ${value}` : `${label}: 未配置`;
};
var botInfo = async () => {
    const [message] = useMessage();
    const info = getBotInfoView();
    const text = [
        `${info.botName} 信息`,
        `版本: ${info.version}`,
        `迁移阶段: ${info.migrationStage}`,
        formatOptional('官网', info.officialWebsite),
        formatOptional('官方群', info.officialGroup),
        formatOptional('运营者', info.operator)
    ].join('\n');
    await message.send({
        format: Format.create().addText(text)
    });
};

export { botInfo as default };
