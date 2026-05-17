import { useEvent, useMessage, Format, logger } from 'alemonjs';
import { renderComponentIsHtmlToBuffer } from 'jsxp';
import ListCardImage from '../../image/component/list-card.js';
import { appVersion, migrationStage, versionNotes, changelogEntries } from '../../constants/version.js';

const buildChangelogCard = () => ({
    title: '香菱插件更新日志',
    subTitle: 'RobotManagement 迁移记录与上游对照',
    summary: [`当前版本 ${appVersion}`, migrationStage, `${changelogEntries.length} 条记录`],
    items: changelogEntries.map(entry => ({
        title: `${entry.version} · ${entry.title}`,
        subtitle: entry.date,
        content: entry.changes.map(item => `- ${item}`).join('\n'),
        tags: entry.tags
    }))
});
const renderChangelogImage = async () => {
    try {
        return await renderComponentIsHtmlToBuffer(ListCardImage, { data: buildChangelogCard() }, { screenshot: { encoding: 'base64', fullPage: true }, bufferFromEncoding: 'base64' });
    }
    catch (error) {
        logger.warn(`version changelog image render failed: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
};
const formatChangelogText = () => [
    '香菱插件更新日志',
    `当前版本: ${appVersion}`,
    `迁移阶段: ${migrationStage}`,
    '',
    ...changelogEntries.flatMap(entry => [
        `${entry.version} - ${entry.title} (${entry.date})`,
        ...entry.changes.map(item => `- ${item}`),
        ''
    ])
].join('\n').trim();
var version = async () => {
    const [event] = useEvent();
    const [message] = useMessage();
    const text = event.current.MessageText || '';
    if (/更新日志/.test(text)) {
        const img = await renderChangelogImage();
        await message.send({ format: img ? Format.create().addImage(img) : Format.create().addText(formatChangelogText()) });
        return false;
    }
    const body = [`alemonjs-xiangling ${appVersion}`, `迁移阶段: ${migrationStage}`, '', ...versionNotes.map(note => `- ${note}`)].join('\n');
    await message.send({
        format: Format.create().addText(body)
    });
    return false;
};

export { version as default };
