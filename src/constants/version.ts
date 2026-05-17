export const appVersion = '0.1.0';

export const migrationStage = 'P2 migrated group management beta';

export const versionNotes = [
  '主链群管命令已迁到 AlemonJS Router。',
  '帮助图、状态图、列表图、设置图已接入 jsxp。',
  '黑白名单、违禁词、欢迎/退出、投票、定时禁言、入群验证、申请处理、撤回记录已迁基础链路。',
  'QQ Web Cookie、点赞、公告推送、TG/DC 聚合不进入当前稳定路由。'
];

export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  tags: string[];
  changes: string[];
};

export const changelogEntries: ChangelogEntry[] = [
  {
    version: '0.1.0',
    date: '2026-05-17',
    title: 'RobotManagement -> AlemonJS Xiangling 迁移版',
    tags: ['AlemonJS', 'OneBot', '迁移版'],
    changes: [
      '建立 packages/alemonjs-xiangling 独立包结构，插件由 alemon.config.yaml 加载。',
      '迁移帮助图、状态图、机器人信息、版本信息、指令表与通知设置。',
      '迁移群列表、好友列表、群信息、搜索群、群员统计、退群、批量退群等群工具。',
      '迁移禁言、解禁、踢人、全体禁言、设置管理、群名片、群名、头衔、撤回、精华、自闭、禁言列表等标准 OneBot 群管能力。',
      '迁移黑白名单、违禁词、头衔屏蔽词、欢迎/退出、加群通知、申请处理、谁艾特我、撤回记录、投票、定时禁言、入群验证基础链路。',
      '明确暂不迁移 QQ Web Cookie、公告推送、点赞、TG/DC、云崽历史系统消息拉取等旧宿主能力。'
    ]
  },
  {
    version: '2.5.2',
    date: '2026-05-13',
    title: '旧版 RobotManagement 最近上游变更对照',
    tags: ['旧版对照', '入群验证', '锅巴'],
    changes: [
      '旧版修复入群验证超时提示与踢出同时执行的问题。',
      '旧版整理入群验证配置与锅巴面板嵌套字段回显。',
      '旧版优化提交 Hash 验证、欢迎/验证联动和设置管理员提示图资源目录。',
      '香菱迁移版已迁计算验证和批量重新验证；提交 Hash 验证仍列为待迁移增强项。'
    ]
  },
  {
    version: '2.4.x',
    date: '2026-01-21 ~ 2026-03-28',
    title: '旧版状态页、公告和多平台能力对照',
    tags: ['旧版对照', '状态页', '暂不迁移'],
    changes: [
      '旧版新增公告推送模块、状态页多账号头像、TG/DC API 与更多系统采集。',
      '香菱迁移版已实现 AlemonJS/OneBot 状态图和消息统计基础展示。',
      '公告推送、Telegram/Discord 聚合与 QQ Web Cookie 能力按当前迁移策略暂不迁移。'
    ]
  }
];
