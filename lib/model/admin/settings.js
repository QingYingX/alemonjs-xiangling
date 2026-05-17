import { migrationStage, appVersion } from '../../constants/version.js';
import { getRedis, createStoreKey } from '../../adapter/storage.js';
import { getXianglingConfig } from '../../config/xiangling.js';
import { getNoticeSettings } from './notice-settings.js';
import { getGroupLists } from '../group/lists.js';
import { getVoteConfig } from '../group/vote.js';
import { getVerifyConfig } from '../group/verify.js';
import { getGroupAddNoticeConfig } from '../group/group-add-notice.js';

const getDefaultSettings = () => {
    const config = getXianglingConfig();
    return {
        stateAsDefault: config.admin.state_as_default,
        renderScale: config.admin.render_scale
    };
};
const settingsKey = () => createStoreKey('admin', 'settings.json');
const normalizeSettings = (value = {}, fallback = getDefaultSettings()) => ({
    stateAsDefault: value.stateAsDefault ?? fallback.stateAsDefault,
    renderScale: Number.isFinite(Number(value.renderScale))
        ? Math.min(200, Math.max(50, Math.round(Number(value.renderScale))))
        : fallback.renderScale
});
const getAdminSettings = async () => {
    const raw = await getRedis().get(settingsKey());
    if (!raw)
        return getDefaultSettings();
    try {
        return normalizeSettings(JSON.parse(raw));
    }
    catch {
        return getDefaultSettings();
    }
};
const saveAdminSettings = async (settings) => {
    const normalized = normalizeSettings(settings);
    await getRedis().set(settingsKey(), JSON.stringify(normalized));
    return normalized;
};
const setStateAsDefault = async (enabled) => {
    const settings = await getAdminSettings();
    settings.stateAsDefault = enabled;
    return saveAdminSettings(settings);
};
const setRenderScale = async (value) => {
    const settings = await getAdminSettings();
    settings.renderScale = value;
    return saveAdminSettings(settings);
};
const statusText = (enabled) => enabled ? '开启' : '关闭';
const statusFlag = (enabled) => enabled ? 'on' : 'off';
const enabledCount = (settings) => {
    const keys = Object.keys(settings).filter(key => typeof settings[key] === 'boolean');
    return keys.filter(key => settings[key] === true).length;
};
const buildSettingsImageData = async () => {
    const [settings, notice, lists, vote, verify, groupAddNotice] = await Promise.all([
        getAdminSettings(),
        getNoticeSettings(),
        getGroupLists(),
        getVoteConfig(),
        getVerifyConfig(),
        getGroupAddNoticeConfig()
    ]);
    const voteSummary = (config) => [
        `禁言${statusText(config.voteBan)}`,
        `踢人${statusText(config.voteKick)}`,
        `${config.minNum}票`,
        `${config.outTime}秒`
    ].join(' / ');
    const verifySummary = (config) => {
        const count = Object.keys(config.enabledGroups).length;
        return count ? `${count}个群 / ${config.time}秒 / ${config.times}次` : '未启用';
    };
    return {
        label: '#群管设置',
        version: appVersion,
        migrationStage,
        generatedAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
        sections: [
            {
                title: '系统设置',
                items: [
                    {
                        key: '群管状态页偏好',
                        value: statusText(settings.stateAsDefault),
                        status: statusFlag(settings.stateAsDefault),
                        hint: '#群管设置状态开启 / #群管设置状态关闭',
                        desc: '保存香菱状态图偏好；AlemonJS 版不接管宿主默认状态命令。'
                    },
                    {
                        key: '渲染精度',
                        value: String(settings.renderScale),
                        status: 'number',
                        hint: '#群管设置渲染精度100',
                        desc: '可选值 50~200，用于香菱设置页图片渲染比例。'
                    },
                    {
                        key: '通知设置',
                        value: `${enabledCount(notice)}项开启`,
                        status: 'link',
                        hint: '#管理设置通知',
                        desc: '查看或修改好友、群、申请、撤回等通知转发。'
                    }
                ]
            },
            {
                title: '群管模块',
                items: [
                    {
                        key: '黑白名单',
                        value: `黑${lists.black.length} / 白${lists.white.length}`,
                        status: lists.black.length || lists.white.length ? 'on' : 'off',
                        hint: '#黑名单列表 / #白名单列表',
                        desc: `授权管理 ${lists.blackManagers.length} 人，白名单自动解禁 ${statusText(lists.whiteAutoUnban)}。`
                    },
                    {
                        key: '投票管理',
                        value: voteSummary(vote),
                        status: vote.voteBan || vote.voteKick ? 'on' : 'off',
                        hint: '#投票设置',
                        desc: `禁言 ${vote.banTime} 秒，管理员一票权 ${statusText(vote.veto)}。`
                    },
                    {
                        key: '入群验证',
                        value: verifySummary(verify),
                        status: Object.keys(verify.enabledGroups).length ? 'on' : 'off',
                        hint: '#开启验证 / #关闭验证',
                        desc: '计算验证已迁移；复杂旧策略继续按 AlemonJS 能力补强。'
                    },
                    {
                        key: '加群通知',
                        value: `${groupAddNotice.openGroups.length}个群`,
                        status: groupAddNotice.openGroups.length ? 'on' : 'off',
                        hint: '#开启加群通知 / #查看加群通知',
                        desc: '收到加群申请后转发给管理员。'
                    }
                ]
            },
            {
                title: '暂不迁移',
                items: [
                    {
                        key: '陌生人点赞',
                        value: '已移除',
                        status: 'disabled',
                        hint: '不提供新命令',
                        desc: '点赞链路按当前迁移策略不迁移。'
                    },
                    {
                        key: 'QQ Web Cookie',
                        value: '已搁置',
                        status: 'disabled',
                        hint: '群公告/群数据/说说等暂不迁移',
                        desc: '这些能力依赖旧 QQ Web Cookie 或云崽专有能力。'
                    }
                ]
            }
        ]
    };
};
const formatSettingsText = (data) => {
    const lines = [`${data.label} v${data.version}`, `迁移阶段：${data.migrationStage}`, `生成时间：${data.generatedAt}`];
    for (const section of data.sections) {
        lines.push('', `【${section.title}】`);
        for (const item of section.items) {
            lines.push(`${item.key}: ${item.value}`, `用法: ${item.hint}`, item.desc);
        }
    }
    return lines.join('\n');
};

export { buildSettingsImageData, formatSettingsText, getAdminSettings, setRenderScale, setStateAsDefault };
