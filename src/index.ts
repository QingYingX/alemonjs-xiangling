import { Router, defineChildren, logger } from 'alemonjs';

const router = Router.create();
const middlewareRouter = Router.create();

middlewareRouter.res({ events: ['message.create', 'private.message.create'] }, () => import('./middleware/message-stats'));
middlewareRouter.res({ events: ['message.create', 'private.message.create', 'message.delete', 'private.message.delete'] }, () => import('./middleware/recall-recorder'));
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
}, () => import('./middleware/notice-forwarder'));
middlewareRouter.res({ events: ['message.create'] }, () => import('./middleware/who-at-recorder'));

router.res({ events: ['private.guild.add'] }, () => import('./response/request/blacklist-auto-reject'));
router.res({ events: ['private.guild.add'] }, () => import('./response/request/auto-approve-group-invite'));
router.res({ events: ['private.guild.add'] }, () => import('./response/request/group-add-notice'));
router.res({ events: ['private.friend.add', 'private.guild.add'] }, () => import('./response/request/record'));
router.res({ events: ['member.add', 'member.ban'] }, () => import('./response/group/list-events'));
router.res({ events: ['member.update'] }, () => import('./response/group/group-admin-guide'));
router.res({ events: ['member.add', 'member.remove'] }, () => import('./response/group/verify-events'));
router.res({ events: ['member.add', 'member.remove'] }, () => import('./response/group/welcome-events'));
router.res({ events: ['message.create'] }, () => import('./response/group/welcome-collector'));
router.res({ events: ['message.create'], regular: /^\s*[0-9a-f]{7}(?:[0-9a-f]{33})?\s*$/i }, () => import('./response/group/verify-events'));
router.res({ events: ['message.create'], regular: /^\s*\d+\s*$/ }, () => import('./response/group/verify-events'));
router.res({ events: ['message.create'], regular: /^\s*[#＃!！]?新增(模糊|精确|正则1|正则2|正则)?(踢黑|踢撤|禁撤|踢|禁|撤)?违禁词/ }, () => import('./middleware/group-admin'), () => import('./response/group/banned-words'));
router.res({ events: ['private.message.create'], regular: /^\s*[#＃!！]?禁言\s*\d+\s+\d+(?:\s+.+)?$/ }, () => import('./middleware/master'), () => import('./response/group/admin-mute'));
router.res({ events: ['private.message.create'], regular: /^\s*[#＃!！]?解禁\s*\d+\s+\d+$/ }, () => import('./middleware/master'), () => import('./response/group/admin-unmute'));
router.res({ events: ['private.message.create'], regular: /^\s*[#＃!！]?踢黑?\s*\d+\s+\d+$/ }, () => import('./middleware/master'), () => import('./response/group/admin-kick'));
router.res({ events: ['private.message.create'], regular: /^\s*[#＃!！]?全体(禁言|解禁)\d+$/ }, () => import('./middleware/master'), () => import('./response/group/admin-whole-ban'));
router.res({ events: ['message.create'], regular: /^\s*[#＃!！]?(删除违禁词|查看违禁词|设置违禁词禁言时间|增加头衔屏蔽词|减少头衔屏蔽词)/ }, () => import('./middleware/group-admin'), () => import('./response/group/banned-words'));
router.res({ events: ['message.create'], regular: /^\s*[#＃!！]?((加|删)(黑|白)|黑名单(授权|取消授权))/ }, () => import('./response/group/lists'));
router.res({ events: ['message.create', 'private.message.create'], regular: /^\s*[#＃!！]?群管设置(状态|渲染精度|陌生人点赞)/ }, () => import('./middleware/master'), () => import('./response/admin/settings'));
router.res({ events: ['message.create', 'private.message.create'], regular: /^\s*[#＃!！]?(管理设置通知|群管通知设置).*(开启|关闭|取消|\d+秒?)\s*$/ }, () => import('./middleware/master'), () => import('./response/admin/notice-settings'));
router.res({ events: ['message.create', 'private.message.create'], regular: /^\s*[#＃!！]?(?:(机器人管理|管理)设置通知全部(开启|关闭)|(机器人管理|管理)(启用|禁用)全部通知)\s*$/ }, () => import('./middleware/master'), () => import('./response/admin/notice-settings'));
router.res({ events: ['message.create'], regular: /^\s*[#＃!！]?(查看|清理|获取)\d+\s*(分钟|小时|天|月)(没|未)发言的人/ }, () => import('./middleware/group-admin'), () => import('./response/group/activity'));
router.res({ events: ['message.create'], regular: /^\s*(谁(艾特|@|at)(我|他|她|它)|哪个逼(艾特|@|at)我)\s*$/i }, () => import('./response/group/who-at'));
router.res({ events: ['message.create'], regular: /^\s*[#＃!！]?(清除(全部)?(艾特|at)数据|clear_(all|at))\s*$/i }, () => import('./response/group/who-at'));

const appGroup = router.group(
  {
    routeText: {
      prefixes: ['/', '#', '＃', '!', '！'],
      stripPrefix: true,
      allowBare: false
    },
    events: ['message.create', 'private.message.create', 'interaction.create', 'private.interaction.create'],
    keyPolicy: { maxWords: 2 },
    duplicateKey: 'warn'
  },
  () => import('./response/group/list-guard')
);

appGroup.use(['管理帮助', '群组管理帮助', '群管帮助'], () => import('./response/help'));
appGroup.use(['香菱信息', '群管信息', '机器人信息'], () => import('./response/admin/bot-info'));
appGroup.use(['状态', '香菱状态', '管理状态', '状态pro', '香菱状态pro', '管理状态pro', '状态debug', '香菱状态debug', '管理状态debug', '监控', '香菱监控', '管理监控', '原图'], () => import('./middleware/master'), () => import('./response/admin/state'));
appGroup.use('群管设置', () => import('./middleware/master'), () => import('./response/admin/settings'));
appGroup.use(['管理设置', '管理设置通知', '管理通知设置', '机器人管理设置', '机器人管理设置通知', '机器人管理通知设置'], () => import('./middleware/master'), () => import('./response/admin/notice-settings'));
appGroup.use(['指令表', '指令查询', '指令导出'], () => import('./middleware/master'), () => import('./response/admin/command-list'));
appGroup.use(['设置日志等级', '修改日志等级'], () => import('./middleware/master'), () => import('./response/admin/log-level'));
appGroup.use(['改头像', '换头像', '改昵称', '换昵称', '改名称', '换名称', '改签名', '改状态', '改性别'], () => import('./middleware/master'), () => import('./response/admin/bot-manage'));
appGroup.use(['管理版本', '机器人管理版本', '管理插件版本', '机器人管理插件版本', '管理插件更新日志', '机器人管理插件更新日志'], () => import('./response/admin/version'));

appGroup.use(['群列表', '获取群列表'], () => import('./middleware/master'), () => import('./response/group/group-list'));
appGroup.use(['好友列表', '获取好友列表'], () => import('./middleware/master'), () => import('./response/group/friend-list'));
appGroup.use('群信息', () => import('./middleware/master'), () => import('./response/group/group-info'));
appGroup.use('搜索群', () => import('./middleware/master'), () => import('./response/group/search-group'));
appGroup.use('群员统计', () => import('./middleware/master'), () => import('./response/group/member-stats'));
appGroup.use('重载群列表', () => import('./middleware/master'), () => import('./response/group/reload-group-list'));

appGroup.use('禁言', () => import('./middleware/group-admin'), () => import('./response/group/admin-mute'));
appGroup.use('解禁', () => import('./middleware/group-admin'), () => import('./response/group/admin-unmute'));
appGroup.use(['踢', '踢黑'], () => import('./middleware/group-admin'), () => import('./response/group/admin-kick'));
appGroup.use(['全体禁言', '全员禁言', '全体解禁', '全员解禁'], () => import('./middleware/group-admin'), () => import('./response/group/admin-whole-ban'));
appGroup.use(['设置管理', '取消管理'], () => import('./middleware/group-owner'), () => import('./response/group/admin-set-admin'));
appGroup.use('改群名片', () => import('./middleware/master'), () => import('./response/group/admin-card'));
appGroup.use(['修改头衔', '设置头衔'], () => import('./middleware/group-owner'), () => import('./response/group/admin-title'));
appGroup.use(['申请头衔', '我要头衔'], () => import('./response/group/admin-title'));
appGroup.use('退群', () => import('./middleware/master'), () => import('./response/group/group-leave'));
appGroup.use('批量退群', () => import('./middleware/master'), () => import('./response/group/batch-leave'));
appGroup.use(['改群名称', '改群昵称'], () => import('./middleware/group-admin'), () => import('./response/group/group-name'));
appGroup.use('改群头像', () => import('./middleware/group-admin'), () => import('./response/group/group-portrait'));
appGroup.use('撤回', () => import('./response/group/message-recall'));
appGroup.use(['加精', '设精', '移精'], () => import('./middleware/group-admin'), () => import('./response/group/essence-message'));
appGroup.use(['禁言列表', '获取禁言列表', '查看禁言列表', '解除全部禁言'], () => import('./response/group/mute-list'));
appGroup.use(['我要自闭', '我要禅定'], () => import('./response/group/self-mute'));
appGroup.use('发好友', () => import('./middleware/master'), () => import('./response/group/send-friend-message'));
appGroup.use('发群聊', () => import('./middleware/master'), () => import('./response/group/send-group-message'));
appGroup.use('发群列表', () => import('./middleware/master'), () => import('./response/group/send-group-list-message'));
appGroup.use('发通知', () => import('./middleware/group-admin'), () => import('./response/group/send-notice'));
appGroup.use(['取头像', '查看头像', '取群头像', '查看群头像'], () => import('./response/group/avatar'));
appGroup.use(['谁是龙王', '哪个吊毛是龙王', '哪个屌毛是龙王', '哪个叼毛是龙王'], () => import('./response/group/dragon-king'));

appGroup.use('删好友', () => import('./middleware/master'), () => import('./response/friend/delete-friend'));
appGroup.use('取直链', () => import('./response/tools/image-link'));
appGroup.use('取face', () => import('./response/tools/face'));
appGroup.use(['ocr', '提取文字', '取文字'], () => import('./response/tools/ocr'));
appGroup.use(['反馈', '回复反馈', '反馈列表', '删除反馈', '移除反馈', '清空反馈'], () => import('./response/admin/feedback'));

appGroup.use('查看好友申请', () => import('./middleware/master'), () => import('./response/request/list-friend'));
appGroup.use(['同意', '拒绝'], () => import('./middleware/master'), () => import('./response/request/handle-latest'));
appGroup.use(['同意好友申请', '拒绝好友申请'], () => import('./middleware/master'), () => import('./response/request/handle-friend'));
appGroup.use('查看全部请求', () => import('./middleware/master'), () => import('./response/request/list-all'));
appGroup.use('查看群邀请', () => import('./middleware/master'), () => import('./response/request/list-group'));
appGroup.use(['查看加群申请', '查看入群申请'], () => import('./middleware/group-admin'), () => import('./response/request/list-group'));
appGroup.use(['同意群邀请', '拒绝群邀请'], () => import('./middleware/master'), () => import('./response/request/handle-group'));
appGroup.use(['同意加群申请', '拒绝加群申请', '同意入群申请', '拒绝入群申请'], () => import('./middleware/group-admin'), () => import('./response/request/handle-group'));
appGroup.use(['同意全部好友申请', '拒绝全部好友申请', '同意全部群邀请', '拒绝全部群邀请'], () => import('./middleware/master'), () => import('./response/request/handle-all'));
appGroup.use(['同意全部加群申请', '拒绝全部加群申请'], () => import('./middleware/group-admin'), () => import('./response/request/handle-all'));
appGroup.use('回复', () => import('./middleware/master'), () => import('./response/request/reply'));
appGroup.use(['加为好友', '添加好友'], () => import('./middleware/master'), () => import('./response/request/add-friend'));

appGroup.use(['新增违禁词', '新增模糊违禁词', '新增精确违禁词', '新增正则违禁词', '新增正则1违禁词', '新增正则2违禁词'], () => import('./middleware/group-admin'), () => import('./response/group/banned-words'));
appGroup.use(['新增踢违禁词', '新增禁违禁词', '新增撤违禁词', '新增踢撤违禁词', '新增禁撤违禁词', '新增踢黑违禁词'], () => import('./middleware/group-admin'), () => import('./response/group/banned-words'));
appGroup.use(['新增模糊踢违禁词', '新增模糊禁违禁词', '新增模糊撤违禁词', '新增模糊踢撤违禁词', '新增模糊禁撤违禁词', '新增模糊踢黑违禁词'], () => import('./middleware/group-admin'), () => import('./response/group/banned-words'));
appGroup.use(['新增正则踢违禁词', '新增正则禁违禁词', '新增正则撤违禁词', '新增正则踢撤违禁词', '新增正则禁撤违禁词', '新增正则踢黑违禁词'], () => import('./middleware/group-admin'), () => import('./response/group/banned-words'));
appGroup.use(['新增正则1踢违禁词', '新增正则1禁违禁词', '新增正则1撤违禁词', '新增正则1踢撤违禁词', '新增正则1禁撤违禁词', '新增正则1踢黑违禁词'], () => import('./middleware/group-admin'), () => import('./response/group/banned-words'));
appGroup.use(['新增正则2踢违禁词', '新增正则2禁违禁词', '新增正则2撤违禁词', '新增正则2踢撤违禁词', '新增正则2禁撤违禁词', '新增正则2踢黑违禁词'], () => import('./middleware/group-admin'), () => import('./response/group/banned-words'));
appGroup.use(['删除违禁词', '查看违禁词', '违禁词列表', '违禁词列表原始', '设置违禁词禁言时间', '违禁词帮助'], () => import('./middleware/group-admin'), () => import('./response/group/banned-words'));
appGroup.use(['增加头衔屏蔽词', '减少头衔屏蔽词', '查看头衔屏蔽词', '切换头衔屏蔽词匹配', '切换头衔屏蔽词匹配模式'], () => import('./middleware/group-admin'), () => import('./response/group/banned-words'));

appGroup.use(['加黑', '删黑', '加白', '删白'], () => import('./response/group/lists'));
appGroup.use(['黑名单列表', '白名单列表', '查黑', '全群查黑', '黑名单授权', '黑名单取消授权', '黑名单管理列表', '开启白名单解禁', '关闭白名单解禁', '开启白名单自动解禁', '关闭白名单自动解禁'], () => import('./response/group/lists'));
appGroup.use(['设置欢迎', '设置退出', '结束设置', '取消设置', '查看欢迎', '查看退出', '重置欢迎', '重置退出', '群聊通知帮助'], () => import('./middleware/group-admin'), () => import('./response/group/welcome-settings'));
appGroup.use(['开启加群通知', '关闭加群通知', '查看加群通知'], () => import('./middleware/group-admin'), () => import('./response/group/group-add-notice'));
appGroup.use(['启用投票禁言', '禁用投票禁言', '启用投票踢人', '禁用投票踢人', '启用管理员一票权', '禁用管理员一票权', '开启管理员一票权', '关闭管理员一票权', '启用投票管理员', '禁用投票管理员', '开启投票管理员', '关闭投票管理员', '投票设置', '投票设置超时时间', '投票设置最低票数', '投票设置禁言时间', '投票禁言', '投票踢人', '发起投票禁言', '发起投票踢人', '支持投票', '反对投票'], () => import('./response/group/vote'));
appGroup.use(['定时禁言', '设置定时禁言', '定时解禁', '设置定时解禁', '定时禁言任务', '取消定时禁言', '取消定时解禁'], () => import('./middleware/group-admin'), () => import('./response/group/scheduled-mute'));
appGroup.use(['查看验证', '验证状态', '开启验证', '关闭验证', '重新验证', '重新验证从未发言的人', '绕过验证', '切换验证模式', '设置验证模式计算', '设置验证模式提交', '设置验证超时时间'], () => import('./middleware/group-admin'), () => import('./response/group/verify-settings'));
appGroup.use(['查看从未发言的人', '清理从未发言的人', '查看不活跃排行榜', '获取不活跃排行榜', '查看潜水排行榜', '获取潜水排行榜', '查看最近入群情况', '获取最近入群情况', '查看最近入群记录', '获取最近入群记录', '确认清理', '取消清理'], () => import('./middleware/group-admin'), () => import('./response/group/activity'));
appGroup.use(['谁艾特我', '谁艾特他', '谁艾特她', '谁艾特它', '谁@我', '谁@他', '谁@她', '谁@它', '清除艾特数据', '清除全部艾特数据'], () => import('./response/group/who-at'));
appGroup.use(['查看群聊撤回', '查看好友撤回', '查看私聊撤回'], () => import('./middleware/master'), () => import('./response/admin/recall-record'));

export default defineChildren({
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
