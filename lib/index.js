import { Router, defineChildren, logger } from 'alemonjs';

const router = Router.create();
const middlewareRouter = Router.create();
middlewareRouter.res({ events: ['message.create', 'private.message.create'] }, () => import('./middleware/message-stats.js'));
middlewareRouter.res({ events: ['message.create', 'private.message.create', 'message.delete', 'private.message.delete'] }, () => import('./middleware/recall-recorder.js'));
middlewareRouter.res({
    events: [
        'message.create',
        'private.message.create',
        'message.delete',
        'private.message.delete',
        'private.friend.add',
        'private.friend.remove',
        'private.guild.add',
        'member.add',
        'member.remove',
        'member.ban',
        'member.unban',
        'member.update',
        'notice.create'
    ]
}, () => import('./middleware/notice-forwarder.js'));
middlewareRouter.res({ events: ['message.create'] }, () => import('./middleware/who-at-recorder.js'));
router.res({ events: ['private.guild.add'] }, () => import('./response/request/blacklist-auto-reject.js'));
router.res({ events: ['private.guild.add'] }, () => import('./response/request/auto-approve-group-invite.js'));
router.res({ events: ['private.guild.add'] }, () => import('./response/request/group-add-notice.js'));
router.res({ events: ['private.friend.add', 'private.guild.add'] }, () => import('./response/request/record.js'));
router.res({ events: ['member.add', 'member.ban'] }, () => import('./response/group/list-events.js'));
router.res({ events: ['member.update'] }, () => import('./response/group/group-admin-guide.js'));
router.res({ events: ['member.add', 'member.remove'] }, () => import('./response/group/verify-events.js'));
router.res({ events: ['member.add', 'member.remove'] }, () => import('./response/group/welcome-events.js'));
router.res({ events: ['message.create'] }, () => import('./response/group/welcome-collector.js'));
router.res({ events: ['message.create'], regular: /^\s*[0-9a-f]{7}(?:[0-9a-f]{33})?\s*$/i }, () => import('./response/group/verify-events.js'));
router.res({ events: ['message.create'], regular: /^\s*\d+\s*$/ }, () => import('./response/group/verify-events.js'));
router.res({ events: ['message.create'], regular: /^\s*[#＃!！]?新增(模糊|精确|正则1|正则2|正则)?(踢黑|踢撤|禁撤|踢|禁|撤)?违禁词/ }, () => import('./middleware/group-admin.js'), () => import('./response/group/banned-words.js'));
router.res({ events: ['private.message.create'], regular: /^\s*[#＃!！]?禁言\s*\d+\s+\d+(?:\s+.+)?$/ }, () => import('./middleware/master.js'), () => import('./response/group/admin-mute.js'));
router.res({ events: ['private.message.create'], regular: /^\s*[#＃!！]?解禁\s*\d+\s+\d+$/ }, () => import('./middleware/master.js'), () => import('./response/group/admin-unmute.js'));
router.res({ events: ['private.message.create'], regular: /^\s*[#＃!！]?踢黑?\s*\d+\s+\d+$/ }, () => import('./middleware/master.js'), () => import('./response/group/admin-kick.js'));
router.res({ events: ['private.message.create'], regular: /^\s*[#＃!！]?全体(禁言|解禁)\d+$/ }, () => import('./middleware/master.js'), () => import('./response/group/admin-whole-ban.js'));
router.res({ events: ['message.create'], regular: /^\s*[#＃!！]?(删除违禁词|查看违禁词|设置违禁词禁言时间|增加头衔屏蔽词|减少头衔屏蔽词)/ }, () => import('./middleware/group-admin.js'), () => import('./response/group/banned-words.js'));
router.res({ events: ['message.create'], regular: /^\s*[#＃!！]?((加|删)(黑|白)|黑名单(授权|取消授权))/ }, () => import('./response/group/lists.js'));
router.res({ events: ['message.create', 'private.message.create'], regular: /^\s*[#＃!！]?群管设置(状态|渲染精度|陌生人点赞)/ }, () => import('./middleware/master.js'), () => import('./response/admin/settings.js'));
router.res({ events: ['message.create', 'private.message.create'], regular: /^\s*[#＃!！]?(管理设置通知|群管通知设置).*(开启|关闭|取消|\d+秒?)\s*$/ }, () => import('./middleware/master.js'), () => import('./response/admin/notice-settings.js'));
router.res({ events: ['message.create', 'private.message.create'], regular: /^\s*[#＃!！]?(?:(机器人管理|管理)设置通知全部(开启|关闭)|(机器人管理|管理)(启用|禁用)全部通知)\s*$/ }, () => import('./middleware/master.js'), () => import('./response/admin/notice-settings.js'));
router.res({ events: ['message.create'], regular: /^\s*[#＃!！]?(查看|清理|获取)\d+\s*(分钟|小时|天|月)(没|未)发言的人/ }, () => import('./middleware/group-admin.js'), () => import('./response/group/activity.js'));
router.res({ events: ['message.create'], regular: /^\s*(谁(艾特|@|at)(我|他|她|它)|哪个逼(艾特|@|at)我)\s*$/i }, () => import('./response/group/who-at.js'));
router.res({ events: ['message.create'], regular: /^\s*[#＃!！]?(清除(全部)?(艾特|at)数据|clear_(all|at))\s*$/i }, () => import('./response/group/who-at.js'));
const appGroup = router.group({
    routeText: {
        prefixes: ['/', '#', '＃', '!', '！'],
        stripPrefix: true,
        allowBare: false
    },
    events: ['message.create', 'private.message.create', 'interaction.create', 'private.interaction.create'],
    keyPolicy: { maxWords: 2 },
    duplicateKey: 'warn'
}, () => import('./response/group/list-guard.js'));
appGroup.use(['管理帮助', '群组管理帮助', '群管帮助'], () => import('./response/help.js'));
appGroup.use(['香菱信息', '群管信息', '机器人信息'], () => import('./response/admin/bot-info.js'));
appGroup.use(['状态', '香菱状态', '管理状态', '状态pro', '香菱状态pro', '管理状态pro', '状态debug', '香菱状态debug', '管理状态debug', '监控', '香菱监控', '管理监控', '原图'], () => import('./middleware/master.js'), () => import('./response/admin/state.js'));
appGroup.use('群管设置', () => import('./middleware/master.js'), () => import('./response/admin/settings.js'));
appGroup.use(['管理设置', '管理设置通知', '管理通知设置', '机器人管理设置', '机器人管理设置通知', '机器人管理通知设置'], () => import('./middleware/master.js'), () => import('./response/admin/notice-settings.js'));
appGroup.use(['指令表', '指令查询', '指令导出'], () => import('./middleware/master.js'), () => import('./response/admin/command-list.js'));
appGroup.use(['设置日志等级', '修改日志等级'], () => import('./middleware/master.js'), () => import('./response/admin/log-level.js'));
appGroup.use(['改头像', '换头像', '改昵称', '换昵称', '改名称', '换名称', '改签名', '改状态', '改性别'], () => import('./middleware/master.js'), () => import('./response/admin/bot-manage.js'));
appGroup.use(['管理版本', '机器人管理版本', '管理插件版本', '机器人管理插件版本', '管理插件更新日志', '机器人管理插件更新日志'], () => import('./response/admin/version.js'));
appGroup.use(['群列表', '获取群列表'], () => import('./middleware/master.js'), () => import('./response/group/group-list.js'));
appGroup.use(['好友列表', '获取好友列表'], () => import('./middleware/master.js'), () => import('./response/group/friend-list.js'));
appGroup.use('群信息', () => import('./middleware/master.js'), () => import('./response/group/group-info.js'));
appGroup.use('搜索群', () => import('./middleware/master.js'), () => import('./response/group/search-group.js'));
appGroup.use('群员统计', () => import('./middleware/master.js'), () => import('./response/group/member-stats.js'));
appGroup.use('重载群列表', () => import('./middleware/master.js'), () => import('./response/group/reload-group-list.js'));
appGroup.use('禁言', () => import('./middleware/group-admin.js'), () => import('./response/group/admin-mute.js'));
appGroup.use('解禁', () => import('./middleware/group-admin.js'), () => import('./response/group/admin-unmute.js'));
appGroup.use(['踢', '踢黑'], () => import('./middleware/group-admin.js'), () => import('./response/group/admin-kick.js'));
appGroup.use(['全体禁言', '全员禁言', '全体解禁', '全员解禁'], () => import('./middleware/group-admin.js'), () => import('./response/group/admin-whole-ban.js'));
appGroup.use(['设置管理', '取消管理'], () => import('./middleware/group-owner.js'), () => import('./response/group/admin-set-admin.js'));
appGroup.use('改群名片', () => import('./middleware/master.js'), () => import('./response/group/admin-card.js'));
appGroup.use(['修改头衔', '设置头衔'], () => import('./middleware/group-owner.js'), () => import('./response/group/admin-title.js'));
appGroup.use(['申请头衔', '我要头衔'], () => import('./response/group/admin-title.js'));
appGroup.use('退群', () => import('./middleware/master.js'), () => import('./response/group/group-leave.js'));
appGroup.use('批量退群', () => import('./middleware/master.js'), () => import('./response/group/batch-leave.js'));
appGroup.use(['改群名称', '改群昵称'], () => import('./middleware/group-admin.js'), () => import('./response/group/group-name.js'));
appGroup.use('改群头像', () => import('./middleware/group-admin.js'), () => import('./response/group/group-portrait.js'));
appGroup.use('撤回', () => import('./response/group/message-recall.js'));
appGroup.use(['加精', '设精', '移精'], () => import('./middleware/group-admin.js'), () => import('./response/group/essence-message.js'));
appGroup.use(['禁言列表', '获取禁言列表', '查看禁言列表', '解除全部禁言'], () => import('./response/group/mute-list.js'));
appGroup.use(['我要自闭', '我要禅定'], () => import('./response/group/self-mute.js'));
appGroup.use('发好友', () => import('./middleware/master.js'), () => import('./response/group/send-friend-message.js'));
appGroup.use('发群聊', () => import('./middleware/master.js'), () => import('./response/group/send-group-message.js'));
appGroup.use('发群列表', () => import('./middleware/master.js'), () => import('./response/group/send-group-list-message.js'));
appGroup.use('发通知', () => import('./middleware/group-admin.js'), () => import('./response/group/send-notice.js'));
appGroup.use(['取头像', '查看头像', '取群头像', '查看群头像'], () => import('./response/group/avatar.js'));
appGroup.use(['谁是龙王', '哪个吊毛是龙王', '哪个屌毛是龙王', '哪个叼毛是龙王'], () => import('./response/group/dragon-king.js'));
appGroup.use('删好友', () => import('./middleware/master.js'), () => import('./response/friend/delete-friend.js'));
appGroup.use('取直链', () => import('./response/tools/image-link.js'));
appGroup.use('取face', () => import('./response/tools/face.js'));
appGroup.use(['ocr', '提取文字', '取文字'], () => import('./response/tools/ocr.js'));
appGroup.use(['反馈', '回复反馈', '反馈列表', '删除反馈', '移除反馈', '清空反馈'], () => import('./response/admin/feedback.js'));
appGroup.use('查看好友申请', () => import('./middleware/master.js'), () => import('./response/request/list-friend.js'));
appGroup.use(['同意', '拒绝'], () => import('./middleware/master.js'), () => import('./response/request/handle-latest.js'));
appGroup.use(['同意好友申请', '拒绝好友申请'], () => import('./middleware/master.js'), () => import('./response/request/handle-friend.js'));
appGroup.use('查看全部请求', () => import('./middleware/master.js'), () => import('./response/request/list-all.js'));
appGroup.use('查看群邀请', () => import('./middleware/master.js'), () => import('./response/request/list-group.js'));
appGroup.use(['查看加群申请', '查看入群申请'], () => import('./middleware/group-admin.js'), () => import('./response/request/list-group.js'));
appGroup.use(['同意群邀请', '拒绝群邀请'], () => import('./middleware/master.js'), () => import('./response/request/handle-group.js'));
appGroup.use(['同意加群申请', '拒绝加群申请', '同意入群申请', '拒绝入群申请'], () => import('./middleware/group-admin.js'), () => import('./response/request/handle-group.js'));
appGroup.use(['同意全部好友申请', '拒绝全部好友申请', '同意全部群邀请', '拒绝全部群邀请'], () => import('./middleware/master.js'), () => import('./response/request/handle-all.js'));
appGroup.use(['同意全部加群申请', '拒绝全部加群申请'], () => import('./middleware/group-admin.js'), () => import('./response/request/handle-all.js'));
appGroup.use('回复', () => import('./middleware/master.js'), () => import('./response/request/reply.js'));
appGroup.use(['加为好友', '添加好友'], () => import('./middleware/master.js'), () => import('./response/request/add-friend.js'));
appGroup.use(['新增违禁词', '新增模糊违禁词', '新增精确违禁词', '新增正则违禁词', '新增正则1违禁词', '新增正则2违禁词'], () => import('./middleware/group-admin.js'), () => import('./response/group/banned-words.js'));
appGroup.use(['新增踢违禁词', '新增禁违禁词', '新增撤违禁词', '新增踢撤违禁词', '新增禁撤违禁词', '新增踢黑违禁词'], () => import('./middleware/group-admin.js'), () => import('./response/group/banned-words.js'));
appGroup.use(['新增模糊踢违禁词', '新增模糊禁违禁词', '新增模糊撤违禁词', '新增模糊踢撤违禁词', '新增模糊禁撤违禁词', '新增模糊踢黑违禁词'], () => import('./middleware/group-admin.js'), () => import('./response/group/banned-words.js'));
appGroup.use(['新增正则踢违禁词', '新增正则禁违禁词', '新增正则撤违禁词', '新增正则踢撤违禁词', '新增正则禁撤违禁词', '新增正则踢黑违禁词'], () => import('./middleware/group-admin.js'), () => import('./response/group/banned-words.js'));
appGroup.use(['新增正则1踢违禁词', '新增正则1禁违禁词', '新增正则1撤违禁词', '新增正则1踢撤违禁词', '新增正则1禁撤违禁词', '新增正则1踢黑违禁词'], () => import('./middleware/group-admin.js'), () => import('./response/group/banned-words.js'));
appGroup.use(['新增正则2踢违禁词', '新增正则2禁违禁词', '新增正则2撤违禁词', '新增正则2踢撤违禁词', '新增正则2禁撤违禁词', '新增正则2踢黑违禁词'], () => import('./middleware/group-admin.js'), () => import('./response/group/banned-words.js'));
appGroup.use(['删除违禁词', '查看违禁词', '违禁词列表', '违禁词列表原始', '设置违禁词禁言时间', '违禁词帮助'], () => import('./middleware/group-admin.js'), () => import('./response/group/banned-words.js'));
appGroup.use(['增加头衔屏蔽词', '减少头衔屏蔽词', '查看头衔屏蔽词', '切换头衔屏蔽词匹配', '切换头衔屏蔽词匹配模式'], () => import('./middleware/group-admin.js'), () => import('./response/group/banned-words.js'));
appGroup.use(['加黑', '删黑', '加白', '删白'], () => import('./response/group/lists.js'));
appGroup.use(['黑名单列表', '白名单列表', '查黑', '全群查黑', '黑名单授权', '黑名单取消授权', '黑名单管理列表', '开启白名单解禁', '关闭白名单解禁', '开启白名单自动解禁', '关闭白名单自动解禁'], () => import('./response/group/lists.js'));
appGroup.use(['设置欢迎', '设置退出', '结束设置', '取消设置', '查看欢迎', '查看退出', '重置欢迎', '重置退出', '群聊通知帮助'], () => import('./middleware/group-admin.js'), () => import('./response/group/welcome-settings.js'));
appGroup.use(['开启加群通知', '关闭加群通知', '查看加群通知'], () => import('./middleware/group-admin.js'), () => import('./response/group/group-add-notice.js'));
appGroup.use(['启用投票禁言', '禁用投票禁言', '启用投票踢人', '禁用投票踢人', '启用管理员一票权', '禁用管理员一票权', '开启管理员一票权', '关闭管理员一票权', '启用投票管理员', '禁用投票管理员', '开启投票管理员', '关闭投票管理员', '投票设置', '投票设置超时时间', '投票设置最低票数', '投票设置禁言时间', '投票禁言', '投票踢人', '发起投票禁言', '发起投票踢人', '支持投票', '反对投票'], () => import('./response/group/vote.js'));
appGroup.use(['定时禁言', '设置定时禁言', '定时解禁', '设置定时解禁', '定时禁言任务', '取消定时禁言', '取消定时解禁'], () => import('./middleware/group-admin.js'), () => import('./response/group/scheduled-mute.js'));
appGroup.use(['查看验证', '验证状态', '开启验证', '关闭验证', '重新验证', '重新验证从未发言的人', '绕过验证', '切换验证模式', '设置验证模式计算', '设置验证模式提交', '设置验证超时时间'], () => import('./middleware/group-admin.js'), () => import('./response/group/verify-settings.js'));
appGroup.use(['查看从未发言的人', '清理从未发言的人', '查看不活跃排行榜', '获取不活跃排行榜', '查看潜水排行榜', '获取潜水排行榜', '查看最近入群情况', '获取最近入群情况', '查看最近入群记录', '获取最近入群记录', '确认清理', '取消清理'], () => import('./middleware/group-admin.js'), () => import('./response/group/activity.js'));
appGroup.use(['谁艾特我', '谁艾特他', '谁艾特她', '谁艾特它', '谁@我', '谁@他', '谁@她', '谁@它', '清除艾特数据', '清除全部艾特数据'], () => import('./response/group/who-at.js'));
appGroup.use(['查看群聊撤回', '查看好友撤回', '查看私聊撤回'], () => import('./middleware/master.js'), () => import('./response/admin/recall-record.js'));
var index = defineChildren({
    register() {
        return {
            middlewareRouter: middlewareRouter.define,
            responseRouter: router.define
        };
    },
    onCreated() {
        logger.info('alemonjs-xiangling loaded');
    }
});

export { index as default };
