# alemonjs-xiangling

`alemonjs-xiangling` 是 `RobotManagement-plugin` 的 AlemonJS / OneBot 迁移版。

## 安装

```bash
yarn add alemonjs-xiangling @alemonjs/onebot @alemonjs/db jsxp -W
```

在宿主 `alemon.config.yaml` 启用应用：

```yaml
apps:
  - 'alemonjs-xiangling'

onebot:
  reverse_enable: true
  reverse_port: 17158
  master_id:
    - '123456789'

db:
  redis:
    host: '127.0.0.1'
    port: 6379
    db: 0

alemonjs-xiangling:
  bot_name: '香菱'
```

启动：

```bash
node index.js --login onebot
```

## 配置

基础配置从 `alemon.config.yaml` 读取，运行时命令写入 Redis。Redis 中的运行时配置优先生效。

常用配置项：

```yaml
alemonjs-xiangling:
  bot_name: '香菱'
  official_website: ''
  official_group: ''
  operator: ''

  admin:
    state_as_default: false
    render_scale: 100

  notice:
    private_message: false
    group_message: false
    group_temporary_message: false
    group_recall: false
    private_recall: false
    friend_request: false
    group_invite_request: false
    add_group_application: false
    group_admin_change: false
    friend_number_change: false
    group_number_change: false
    group_member_number_change: false
    bot_been_banned: false
    msg_save_deltime: 7200
    notifications_all: false

  group_lists:
    black: []
    white: []
    black_managers: []
    white_auto_unban: false

  group_vote:
    vote_ban: true
    vote_kick: false
    out_time: 180
    min_num: 4
    ban_time: 3600
    veto: true
    vote_admin: false

  group_verify:
    groups: {}
    time: 300
    times: 7
    delay_time: 2
    remind_at_last_minute: true
    range:
      min: 10
      max: 100

  group_add_notice:
    open_groups: []
    message: '有一个加群通知，管理员快去看看吧~'

  welcome:
    enabled: true
    welcome_text: []
    exit_text: []
    welcome_cooldown: 30
    default_welcome: '欢迎加入本群，请遵守群规'
    default_exit: '乘着西风出发咯~'
    default_kick: '被一脚踹了出去~'
    bot_join_text: |-
      ===机器人已加入本群===
      使用 #管理帮助 查看功能列表
      ==================

  feedback:
    enabled: true
    groups: []

  group_recall:
    bot: 'all'
    member: 'admin'

  group_manage:
    auto_approve_group_invite: false
```

## 已迁移功能

帮助与状态：

- `#管理帮助`、`#群管帮助`、`#群组管理帮助`
- `#香菱信息`、`#机器人信息`
- `#管理版本`、`#管理插件更新日志`
- `#状态`、`#状态pro`、`#状态debug`、`#监控`、`#原图`
- `#群管设置`、`#管理设置`、`#指令表`、`#指令查询`、`#指令导出`

群与好友查询：

- `#群列表`、`#重载群列表`
- `#好友列表`
- `#群信息 <群号>`
- `#搜索群 <关键词>`
- `#群员统计`

基础群管：

- `#禁言`、`#解禁`
- `#踢`、`#踢黑`
- `#全体禁言`、`#全体解禁`
- `#设置管理`、`#取消管理`
- `#改群名片`、`#修改头衔`、`#设置头衔`、`#申请头衔`
- `#退群`、`#批量退群`
- `#改群名称`、`#改群头像`
- `#撤回`、`#加精`、`#设精`、`#移精`
- `#禁言列表`、`#解除全部禁言`
- `#我要自闭`

消息发送与工具：

- `#发好友 <QQ> <消息>`
- `#发群聊 <群号> <消息>`
- `#发群列表 <序号列表> <消息>`
- `#发通知 <消息>`
- `#取头像`、`#取群头像`
- `#取直链`
- `#取face`
- `#ocr`、`#提取文字`
- `#谁是龙王`
- `谁艾特我`、`谁@我`、`谁艾特他`

黑白名单：

- `#加黑`、`#删黑`
- `#加白`、`#删白`
- `#黑名单列表`、`#白名单列表`
- `#查黑`、`#全群查黑`
- `#黑名单授权`、`#黑名单取消授权`、`#黑名单管理列表`
- `#开启白名单解禁`、`#关闭白名单解禁`

违禁词：

- `#新增违禁词`
- `#新增模糊违禁词`
- `#新增正则违禁词`
- `#新增踢违禁词`
- `#新增禁违禁词`
- `#新增撤违禁词`
- `#新增踢撤违禁词`
- `#新增禁撤违禁词`
- `#新增踢黑违禁词`
- `#删除违禁词`
- `#违禁词列表`
- `#违禁词列表原始`
- `#设置违禁词禁言时间 <秒>`
- `#增加头衔屏蔽词`、`#减少头衔屏蔽词`、`#查看头衔屏蔽词`
- `#切换头衔屏蔽词匹配模式`

欢迎、退出和加群通知：

- `#设置欢迎`
- `#设置退出`
- `#结束设置`
- `#取消设置`
- `#查看欢迎`
- `#查看退出`
- `#重置欢迎`
- `#重置退出`
- `#群聊通知帮助`
- `#开启加群通知`
- `#关闭加群通知`
- `#查看加群通知`

入群验证：

- `#查看验证`
- `#开启验证`
- `#关闭验证`
- `#重新验证 <QQ>`
- `#重新验证从未发言的人`
- `#绕过验证 <QQ>`
- `#切换验证模式`
- `#设置验证模式计算`
- `#设置验证模式提交`
- `#设置验证超时时间 <秒>`

入群验证行为：

- 开启验证的群不会先发送普通欢迎。
- 验证成功后发送“验证成功 + 欢迎语”的合并文本。
- `#绕过验证` 会走验证成功欢迎流程。
- 用户答题后会尝试撤回用户答案、上一条验证提示、失败提示和提醒提示。
- 多次失败只保留最新失败提示。
- 超时或次数耗尽时先发送最终提示，再延迟踢出。
- 验证踢出不会触发普通退群或被踢通知。
- 计算验证可直接使用；提交验证会读取 GitHub / Gitee 仓库最新提交 Hash，失败时回退到计算验证。

投票：

- `#投票设置`
- `#投票设置超时时间 <秒>`
- `#投票设置最低票数 <票数>`
- `#投票设置禁言时间 <秒>`
- `#启用投票禁言`、`#禁用投票禁言`
- `#启用投票踢人`、`#禁用投票踢人`
- `#启用管理员一票权`、`#禁用管理员一票权`
- `#启用投票管理员`、`#禁用投票管理员`
- `#投票禁言 <@QQ>`
- `#投票踢人 <@QQ>`
- `#支持投票 <QQ>`
- `#反对投票 <QQ>`

定时任务和活跃统计：

- `#定时禁言`
- `#定时解禁`
- `#定时禁言任务`
- `#取消定时禁言`
- `#取消定时解禁`
- `#查看从未发言的人`
- `#清理从未发言的人`
- `#确认清理`、`#取消清理`
- `#查看不活跃排行榜`
- `#查看潜水排行榜`
- `#查看最近入群情况`
- `#查看最近入群记录`

申请处理：

- `#查看好友申请`
- `#查看群邀请`
- `#查看加群申请`
- `#查看全部请求`
- `#同意`、`#拒绝`
- `#同意好友申请 <QQ>`、`#拒绝好友申请 <QQ>`
- `#同意群邀请 <群号>`、`#拒绝群邀请 <群号>`
- `#同意加群申请 <QQ>`、`#拒绝加群申请 <QQ>`
- `#同意全部好友申请`、`#拒绝全部好友申请`
- `#同意全部群邀请`、`#拒绝全部群邀请`
- `#同意全部加群申请`、`#拒绝全部加群申请`
- `#回复 <QQ> <消息>`
- `#加为好友`

反馈：

- `#反馈 <内容>`
- `#反馈列表 [页码]`
- `#回复反馈 <识别码> <内容>`
- `#删除反馈 <识别码>`
- `#移除反馈 <识别码>`
- `#清空反馈`

撤回记录：

- `#查看群聊撤回`
- `#查看好友撤回`
- `#查看私聊撤回`

## 权限

- `master`：`onebot.master_id` 或 `onebot.master_key` 中配置的主人。
- `admin`：群主、群管理员或主人。
- `owner`：群主或主人。

涉及全局数据、跨群操作、好友私聊的命令通常要求主人权限。涉及本群管理的命令通常要求群管理员权限。

## 存储

运行时数据写入 Redis，key 前缀为：

```text
data:alemonjs-xiangling:*
```

主要数据：

- `group-lists.json`：黑白名单、授权与白名单自动解禁。
- `group:<群号>:welcome.json`：本群欢迎、退出、被踢文案。
- `group:<群号>:banned-words.json`：本群违禁词与头衔屏蔽词。
- `group-verify:*`：入群验证配置和临时验证状态。
- `group-vote:*`：投票配置和投票状态。
- `scheduled-mute:*`：定时禁言、定时解禁任务。
- `requests:*`：好友申请、群邀请、加群申请记录。
- `feedback:*`：反馈记录与反馈设置。

## 开发

在 `packages/alemonjs-xiangling` 内构建：

```bash
yarn build
yarn pack:check
```

在仓库根目录做类型检查：

```bash
yarn tsc -p packages/alemonjs-xiangling/tsconfig.json --noEmit --pretty false
```

如果本仓库通过 workspace / file 方式安装到宿主，构建后可在根目录同步运行包：

```bash
yarn install --force
```