import React from 'react';
import type { DiskMetric, MessageStatsTable, NetworkMetric, ProgressMetric, StateImageData } from '../../model/admin/state';
import bg from '../../assets/legacy/resources/state/img/bg/2.jpg';
import avatar from '../../assets/legacy/resources/state/img/default_avatar.jpg';
import harmonyFont from '../../assets/legacy/resources/state/font/HarmonyOS_SansSC_Bold.ttf';
import botIcon from '../../assets/legacy/resources/state/icon/screenshot.png';
import groupIcon from '../../assets/legacy/resources/state/icon/group.png';
import friendIcon from '../../assets/legacy/resources/state/icon/friend.png';
import recvIcon from '../../assets/legacy/resources/state/icon/recv.png';
import sentIcon from '../../assets/legacy/resources/state/icon/sent.png';

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

function Pill({ label, value, icon }: { label: string; value: string | number; icon?: string }) {
  return (
    <div className='pill'>
      {icon ? <img src={icon} /> : null}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function CircleMetric({ item }: { item: ProgressMetric }) {
  const percent = clamp(item.percent, 0, 100);
  const dash = 283 - percent / 100 * 283;
  return (
    <div className='circle-metric'>
      <div className='circle'>
        <svg viewBox='0 0 100 100'>
          <circle className='track' cx='50' cy='50' r='45' />
          <circle className='bar' cx='50' cy='50' r='45' style={{ strokeDashoffset: dash }} />
        </svg>
        <strong>{percent}%</strong>
      </div>
      <h3>{item.title}</h3>
      <p>{item.sub || ''}</p>
      <p>{item.detail}</p>
    </div>
  );
}

function Card({ title, icon, children, className = '' }: { title: string; icon?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      <h2>{icon ? <img src={icon} /> : null}{title}</h2>
      {children}
    </section>
  );
}

function DiskList({ disks }: { disks: DiskMetric[] }) {
  if (!disks.length) return <div className='empty'>暂无磁盘信息</div>;
  return (
    <div className='disk-list'>
      {disks.map(disk => (
        <div className='disk-row' key={disk.mount}>
          <div className='disk-head'>
            <strong>{disk.mount}</strong>
            <span>{disk.used} / {disk.size}</span>
            <b>{disk.percent}%</b>
          </div>
          <div className='progress'><i style={{ width: `${clamp(disk.percent, 1, 100)}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function NetworkList({ network }: { network: NetworkMetric[] }) {
  if (!network.length) return <div className='empty'>暂无网络信息</div>;
  return (
    <div className='simple-list'>
      {network.map(item => (
        <div className='kv' key={item.name}>
          <strong>{item.name}</strong>
          <span>收 {item.rx} / 发 {item.tx}</span>
        </div>
      ))}
    </div>
  );
}

function StatsTable({ table }: { table: MessageStatsTable }) {
  return (
    <Card title={table.title} icon={recvIcon} className='stats-card'>
      <div className='stats-table'>
        <div className='stats-row stats-head'><span>日期</span><span>收</span><span>发</span></div>
        {table.rows.map(row => (
          <div className='stats-row' key={`${table.title}-${row.label}`}>
            <strong>{row.label}</strong>
            <span>{row.receive}</span>
            <span>{row.send}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function RedisCard({ data }: { data: StateImageData }) {
  if (!data.redis) return null;
  return (
    <Card title='服务器 / Redis' icon={botIcon}>
      <div className='triple'>
        <div className='info-block'><span>Redis版本</span><strong>{data.redis.version || '未知'}</strong></div>
        <div className='info-block'><span>运行时间</span><strong>{data.redis.uptime || '未知'}</strong></div>
        <div className='info-block'><span>客户端连接</span><strong>{data.redis.clients || '未知'}</strong></div>
        <div className='info-block'><span>已用内存</span><strong>{data.redis.usedMemory || '未知'}</strong></div>
        <div className='info-block'><span>内存峰值</span><strong>{data.redis.peakMemory || '未知'}</strong></div>
        <div className='info-block'><span>历史命令</span><strong>{data.redis.commands || '未知'}</strong></div>
      </div>
      {data.redis.keyspace.length ? (
        <div className='keyspace'>
          <div className='key-row key-head'><span>DB</span><span>Keys</span><span>Expires</span><span>Avg ttl</span></div>
          {data.redis.keyspace.map(item => (
            <div className='key-row' key={item.db}><strong>{item.db}</strong><span>{item.keys}</span><span>{item.expires}</span><span>{item.avgTtl}</span></div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export default function StateImage({ data }: { data: StateImageData }) {
  const total = data.stats.find(item => item.label === '总消息') || data.stats[0];
  const user = data.stats.find(item => item.label.startsWith('用户'));
  const group = data.stats.find(item => item.label.startsWith('群'));

  return (
    <html>
      <head>
        <meta charSet='utf-8' />
        <style>{`
          @font-face { font-family: 'HarmonyState'; src: url('${harmonyFont}') format('truetype'); font-weight: 700; font-style: normal; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body { width: 2060px; min-height: 3200px; font-family: 'HarmonyState', 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif; color: #171b2b; background: #1b1720; }
          .page { width: 2060px; min-height: 3200px; padding: 48px; background-image: linear-gradient(90deg, rgba(255,242,232,.34), rgba(240,238,250,.28)), url('${bg}'); background-size: cover; background-position: center top; }
          .glass { border-radius: 26px; background: rgba(255,255,255,.42); border: 2px solid rgba(255,255,255,.42); box-shadow: 0 16px 50px rgba(10,12,20,.18), inset 0 1px 0 rgba(255,255,255,.65); backdrop-filter: blur(18px); }
          .hero { min-height: 250px; padding: 34px 60px; display: flex; align-items: center; gap: 40px; }
          .avatar-wrap { position: relative; width: 160px; height: 160px; flex: 0 0 auto; }
          .avatar { width: 160px; height: 160px; border-radius: 50%; object-fit: cover; box-shadow: 0 10px 28px rgba(20,20,35,.22); }
          .dot { position: absolute; right: 12px; bottom: 14px; width: 36px; height: 36px; border-radius: 50%; border: 7px solid rgba(255,255,255,.8); background: #28d89c; }
          .hero-main { flex: 1; min-width: 0; }
          .title-line { display: flex; align-items: center; gap: 20px; border-bottom: 1px solid rgba(25,28,38,.12); padding-bottom: 18px; }
          h1 { margin: 0; font-size: 42px; line-height: 1.1; letter-spacing: 0; }
          .sub-title { color: rgba(23,27,43,.58); font-size: 20px; margin-left: 4px; }
          .badge { margin-left: auto; color: #fff; background: #7e72c7; border-radius: 14px; padding: 8px 20px; font-size: 22px; }
          .pills { margin-top: 16px; display: flex; flex-wrap: wrap; gap: 10px 16px; }
          .pill { display: inline-flex; align-items: center; gap: 10px; padding: 8px 18px; border-radius: 18px; background: rgba(255,255,255,.32); color: #22283a; font-size: 22px; }
          .pill img { width: 22px; height: 22px; object-fit: contain; }
          .pill span { color: rgba(22,27,40,.72); }
          .layout { display: grid; grid-template-columns: 1286px 690px; gap: 36px; margin-top: 32px; align-items: start; }
          .left, .right { display: grid; gap: 28px; }
          .card { border-radius: 26px; background: rgba(255,255,255,.42); border: 2px solid rgba(255,255,255,.42); box-shadow: 0 14px 42px rgba(10,12,20,.16), inset 0 1px 0 rgba(255,255,255,.6); backdrop-filter: blur(18px); padding: 34px 54px; }
          .card h2 { display: flex; align-items: center; gap: 16px; margin: 0 0 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(20,24,36,.12); font-size: 30px; }
          .card h2 img { width: 30px; height: 30px; object-fit: contain; }
          .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 34px; }
          .circle-metric { text-align: center; min-width: 0; }
          .circle { position: relative; width: 210px; height: 210px; margin: 0 auto 18px; }
          .circle svg { width: 210px; height: 210px; transform: rotate(-90deg); filter: drop-shadow(0 4px 8px rgba(0,0,0,.08)); }
          .circle circle { fill: rgba(255,255,255,.54); stroke-width: 9; stroke-linecap: round; }
          .track { stroke: rgba(40,45,58,.10); }
          .bar { stroke: #83a7eb; stroke-dasharray: 283; }
          .circle strong { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 38px; }
          .circle-metric h3 { margin: 0 0 10px; font-size: 38px; }
          .circle-metric p { margin: 6px 0; min-height: 24px; color: rgba(25,28,40,.66); font-size: 20px; line-height: 1.25; }
          .disk-list { display: grid; gap: 20px; }
          .disk-head { display: grid; grid-template-columns: 1fr 300px 80px; gap: 16px; align-items: baseline; font-size: 24px; }
          .disk-head strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .disk-head span { color: rgba(25,28,40,.72); text-align: right; }
          .disk-head b { text-align: right; }
          .progress { height: 22px; margin-top: 10px; border-radius: 18px; background: rgba(30,35,50,.10); overflow: hidden; }
          .progress i { display: block; height: 100%; border-radius: 18px; background: linear-gradient(90deg, #6aa9ef, #91b5f2); }
          .simple-list, .triple { display: grid; gap: 14px; }
          .kv, .info-block { display: flex; justify-content: space-between; align-items: center; gap: 22px; min-height: 52px; padding: 12px 18px; border-radius: 16px; background: rgba(255,255,255,.28); font-size: 24px; }
          .kv span, .info-block span { color: rgba(25,28,40,.66); }
          .triple { grid-template-columns: repeat(3, 1fr); }
          .info-block { flex-direction: column; align-items: flex-start; min-height: 92px; }
          .info-block strong { align-self: flex-end; color: #3f66c8; }
          .keyspace { margin-top: 24px; display: grid; gap: 10px; }
          .key-row { display: grid; grid-template-columns: 120px 1fr 1fr 1fr; gap: 12px; padding: 12px 18px; border-radius: 14px; background: rgba(255,255,255,.24); font-size: 22px; }
          .key-head { color: rgba(25,28,40,.55); }
          .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
          .summary-item { padding: 16px 22px; border-radius: 16px; background: rgba(255,255,255,.28); font-size: 24px; display: flex; justify-content: space-between; }
          .summary-item span { color: rgba(25,28,40,.62); }
          .stats-card { padding: 34px 50px; }
          .stats-table { display: grid; gap: 10px; }
          .stats-row { display: grid; grid-template-columns: 1fr 130px 130px; gap: 18px; padding: 12px 16px; border-radius: 14px; background: rgba(255,255,255,.25); font-size: 24px; align-items: center; }
          .stats-head { color: rgba(25,28,40,.52); background: transparent; border-bottom: 1px solid rgba(25,28,40,.1); border-radius: 0; }
          .stats-row span:nth-child(n+2), .stats-row strong:nth-child(n+2) { text-align: right; }
          .today { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
          .today .summary-item { min-height: 58px; }
          .monitor-json { word-break: break-all; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 18px; line-height: 1.55; color: #22283a; }
          .empty { color: rgba(25,28,40,.58); font-size: 22px; }
          .footer { margin: 34px 0 0; text-align: center; color: #fff; font-size: 30px; text-shadow: 0 2px 6px rgba(0,0,0,.45); }
        `}</style>
      </head>
      <body>
        <div className='page'>
          <section className='hero glass'>
            <div className='avatar-wrap'><img className='avatar' src={avatar} /><div className='dot' /></div>
            <div className='hero-main'>
              <div className='title-line'><h1>{data.botName}</h1><span className='sub-title'>{data.title}</span><span className='badge'>{data.oneBotVersion}</span></div>
              <div className='pills'>
                <Pill label='Bot已运行' value={data.uptime} />
                <Pill label='账号ID' value={data.account} />
                <Pill label='状态' value={data.oneBotStatus} />
                <Pill icon={friendIcon} label='' value={`${data.contacts.friends ?? '未知'} 好友`} />
                <Pill icon={groupIcon} label='' value={`${data.contacts.groups ?? '未知'} 群组`} />
                <Pill icon={groupIcon} label='' value={`${data.contacts.groupMembers ?? '未知'} 群员`} />
                <Pill icon={recvIcon} label='' value={`${total?.today ?? 0} 收`} />
                <Pill icon={sentIcon} label='' value={`${total?.total ?? 0} 总`} />
              </div>
            </div>
          </section>

          <div className='layout'>
            <main className='left'>
              <Card title='主硬件' icon={botIcon}>
                <div className='metrics'>{data.metrics.map(item => <CircleMetric item={item} key={item.title} />)}</div>
              </Card>

              <Card title='磁盘信息' icon={botIcon}><DiskList disks={data.disks} /></Card>
              <Card title='网络状态' icon={botIcon}><NetworkList network={data.network} /></Card>
              <RedisCard data={data} />

              <Card title='渲染统计' icon={recvIcon}>
                <div className='summary'>
                  <div className='summary-item'><span>今日渲染</span><strong>状态页</strong></div>
                  <div className='summary-item'><span>消息统计范围</span><strong>{data.stats.length}</strong></div>
                  <div className='summary-item'><span>图片模式</span><strong>jsxp</strong></div>
                  <div className='summary-item'><span>降级</span><strong>文本</strong></div>
                </div>
              </Card>

              <Card title='系统信息' icon={botIcon}>
                <div className='simple-list'>
                  <div className='kv'><span>系统</span><strong>{data.system.os}</strong></div>
                  <div className='kv'><span>内核</span><strong>{data.system.kernel}</strong></div>
                  <div className='kv'><span>架构</span><strong>{data.system.arch}</strong></div>
                  <div className='kv'><span>主机名</span><strong>{data.system.host}</strong></div>
                  <div className='kv'><span>Node.js</span><strong>{data.system.node}</strong></div>
                  <div className='kv'><span>进程运行</span><strong>{data.system.processUptime}</strong></div>
                  <div className='kv'><span>系统运行</span><strong>{data.system.osUptime}</strong></div>
                  <div className='kv'><span>负载</span><strong>{data.system.load}</strong></div>
                </div>
              </Card>
            </main>

            <aside className='right'>
              {data.statsTables.map(table => <StatsTable table={table} key={table.title} />)}
              <Card title='今日概览' icon={recvIcon}>
                <div className='today'>
                  <div className='summary-item'><span>收消息</span><strong>{total?.today ?? 0}</strong></div>
                  <div className='summary-item'><span>发消息</span><strong>{data.statsTables[0]?.rows[0]?.send ?? 0}</strong></div>
                  <div className='summary-item'><span>当前群今日</span><strong>{group?.today ?? 0}</strong></div>
                  <div className='summary-item'><span>当前用户今日</span><strong>{user?.today ?? 0}</strong></div>
                </div>
              </Card>
              {data.monitorJson ? <Card title='OneBot状态' icon={botIcon}><div className='monitor-json'>{data.monitorJson}</div></Card> : null}
            </aside>
          </div>

          <div className='footer'>Created By AlemonJS & Xiangling · {data.version} · {data.generatedAt}</div>
        </div>
      </body>
    </html>
  );
}
