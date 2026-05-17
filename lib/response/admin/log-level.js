import { useEvent, useMessage, Format } from 'alemonjs';
import { getRawArgText } from '../../model/group/admin.js';

const knownLevels = new Set(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']);
var logLevel = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const level = getRawArgText(event.current).toLowerCase();
    if (!level || !knownLevels.has(level)) {
        await message.send({ format: Format.create().addText('请使用：#设置日志等级 <trace|debug|info|warn|error|fatal|silent>') });
        return false;
    }
    process.env.LOG_LEVEL = level;
    await message.send({ format: Format.create().addText('已记录日志等级为 ' + level + '。如果宿主 logger 不支持运行时热切换，重启后按环境配置生效。') });
    return false;
};

export { logLevel as default };
