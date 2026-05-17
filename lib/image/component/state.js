import React from 'react';

const bg = new URL('../../assets/legacy/resources/state/img/bg/2.jpg', import.meta.url).href;
const avatar = new URL('../../assets/legacy/resources/state/img/default_avatar.jpg', import.meta.url).href;
const harmonyFont = new URL('../../assets/legacy/resources/state/font/HarmonyOS_SansSC_Bold.ttf', import.meta.url).href;
const botIcon = new URL('../../assets/legacy/resources/state/icon/screenshot.png', import.meta.url).href;
const groupIcon = new URL('../../assets/legacy/resources/state/icon/group.png', import.meta.url).href;
const friendIcon = new URL('../../assets/legacy/resources/state/icon/friend.png', import.meta.url).href;
const recvIcon = new URL('../../assets/legacy/resources/state/icon/recv.png', import.meta.url).href;
const sentIcon = new URL('../../assets/legacy/resources/state/icon/sent.png', import.meta.url).href;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
function Pill({ label, value, icon }) {
    return (React.createElement("div", { className: 'pill' },
        icon ? React.createElement("img", { src: icon }) : null,
        React.createElement("span", null, label),
        React.createElement("strong", null, value)));
}
function CircleMetric({ item }) {
    const percent = clamp(item.percent, 0, 100);
    const dash = 283 - percent / 100 * 283;
    return (React.createElement("div", { className: 'circle-metric' },
        React.createElement("div", { className: 'circle' },
            React.createElement("svg", { viewBox: '0 0 100 100' },
                React.createElement("circle", { className: 'track', cx: '50', cy: '50', r: '45' }),
                React.createElement("circle", { className: 'bar', cx: '50', cy: '50', r: '45', style: { strokeDashoffset: dash } })),
            React.createElement("strong", null,
                percent,
                "%")),
        React.createElement("h3", null, item.title),
        React.createElement("p", null, item.sub || ''),
        React.createElement("p", null, item.detail)));
}
function Card({ title, icon, children, className = '' }) {
    return (React.createElement("section", { className: `card ${className}` },
        React.createElement("h2", null,
            icon ? React.createElement("img", { src: icon }) : null,
            title),
        children));
}
function DiskList({ disks }) {
    if (!disks.length)
        return React.createElement("div", { className: 'empty' }, "\u6682\u65E0\u78C1\u76D8\u4FE1\u606F");
    return (React.createElement("div", { className: 'disk-list' }, disks.map(disk => (React.createElement("div", { className: 'disk-row', key: disk.mount },
        React.createElement("div", { className: 'disk-head' },
            React.createElement("strong", null, disk.mount),
            React.createElement("span", null,
                disk.used,
                " / ",
                disk.size),
            React.createElement("b", null,
                disk.percent,
                "%")),
        React.createElement("div", { className: 'progress' },
            React.createElement("i", { style: { width: `${clamp(disk.percent, 1, 100)}%` } })))))));
}
function NetworkList({ network }) {
    if (!network.length)
        return React.createElement("div", { className: 'empty' }, "\u6682\u65E0\u7F51\u7EDC\u4FE1\u606F");
    return (React.createElement("div", { className: 'simple-list' }, network.map(item => (React.createElement("div", { className: 'kv', key: item.name },
        React.createElement("strong", null, item.name),
        React.createElement("span", null,
            "\u6536 ",
            item.rx,
            " / \u53D1 ",
            item.tx))))));
}
function StatsTable({ table }) {
    return (React.createElement(Card, { title: table.title, icon: recvIcon, className: 'stats-card' },
        React.createElement("div", { className: 'stats-table' },
            React.createElement("div", { className: 'stats-row stats-head' },
                React.createElement("span", null, "\u65E5\u671F"),
                React.createElement("span", null, "\u6536"),
                React.createElement("span", null, "\u53D1")),
            table.rows.map(row => (React.createElement("div", { className: 'stats-row', key: `${table.title}-${row.label}` },
                React.createElement("strong", null, row.label),
                React.createElement("span", null, row.receive),
                React.createElement("span", null, row.send)))))));
}
function RedisCard({ data }) {
    if (!data.redis)
        return null;
    return (React.createElement(Card, { title: '\u670D\u52A1\u5668 / Redis', icon: botIcon },
        React.createElement("div", { className: 'triple' },
            React.createElement("div", { className: 'info-block' },
                React.createElement("span", null, "Redis\u7248\u672C"),
                React.createElement("strong", null, data.redis.version || '未知')),
            React.createElement("div", { className: 'info-block' },
                React.createElement("span", null, "\u8FD0\u884C\u65F6\u95F4"),
                React.createElement("strong", null, data.redis.uptime || '未知')),
            React.createElement("div", { className: 'info-block' },
                React.createElement("span", null, "\u5BA2\u6237\u7AEF\u8FDE\u63A5"),
                React.createElement("strong", null, data.redis.clients || '未知')),
            React.createElement("div", { className: 'info-block' },
                React.createElement("span", null, "\u5DF2\u7528\u5185\u5B58"),
                React.createElement("strong", null, data.redis.usedMemory || '未知')),
            React.createElement("div", { className: 'info-block' },
                React.createElement("span", null, "\u5185\u5B58\u5CF0\u503C"),
                React.createElement("strong", null, data.redis.peakMemory || '未知')),
            React.createElement("div", { className: 'info-block' },
                React.createElement("span", null, "\u5386\u53F2\u547D\u4EE4"),
                React.createElement("strong", null, data.redis.commands || '未知'))),
        data.redis.keyspace.length ? (React.createElement("div", { className: 'keyspace' },
            React.createElement("div", { className: 'key-row key-head' },
                React.createElement("span", null, "DB"),
                React.createElement("span", null, "Keys"),
                React.createElement("span", null, "Expires"),
                React.createElement("span", null, "Avg ttl")),
            data.redis.keyspace.map(item => (React.createElement("div", { className: 'key-row', key: item.db },
                React.createElement("strong", null, item.db),
                React.createElement("span", null, item.keys),
                React.createElement("span", null, item.expires),
                React.createElement("span", null, item.avgTtl)))))) : null));
}
function StateImage({ data }) {
    const total = data.stats.find(item => item.label === '总消息') || data.stats[0];
    const user = data.stats.find(item => item.label.startsWith('用户'));
    const group = data.stats.find(item => item.label.startsWith('群'));
    return (React.createElement("html", null,
        React.createElement("head", null,
            React.createElement("meta", { charSet: 'utf-8' }),
            React.createElement("style", null, `
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
        `)),
        React.createElement("body", null,
            React.createElement("div", { className: 'page' },
                React.createElement("section", { className: 'hero glass' },
                    React.createElement("div", { className: 'avatar-wrap' },
                        React.createElement("img", { className: 'avatar', src: avatar }),
                        React.createElement("div", { className: 'dot' })),
                    React.createElement("div", { className: 'hero-main' },
                        React.createElement("div", { className: 'title-line' },
                            React.createElement("h1", null, data.botName),
                            React.createElement("span", { className: 'sub-title' }, data.title),
                            React.createElement("span", { className: 'badge' }, data.oneBotVersion)),
                        React.createElement("div", { className: 'pills' },
                            React.createElement(Pill, { label: 'Bot\u5DF2\u8FD0\u884C', value: data.uptime }),
                            React.createElement(Pill, { label: '\u8D26\u53F7ID', value: data.account }),
                            React.createElement(Pill, { label: '\u72B6\u6001', value: data.oneBotStatus }),
                            React.createElement(Pill, { icon: friendIcon, label: '', value: `${data.contacts.friends ?? '未知'} 好友` }),
                            React.createElement(Pill, { icon: groupIcon, label: '', value: `${data.contacts.groups ?? '未知'} 群组` }),
                            React.createElement(Pill, { icon: groupIcon, label: '', value: `${data.contacts.groupMembers ?? '未知'} 群员` }),
                            React.createElement(Pill, { icon: recvIcon, label: '', value: `${total?.today ?? 0} 收` }),
                            React.createElement(Pill, { icon: sentIcon, label: '', value: `${total?.total ?? 0} 总` })))),
                React.createElement("div", { className: 'layout' },
                    React.createElement("main", { className: 'left' },
                        React.createElement(Card, { title: '\u4E3B\u786C\u4EF6', icon: botIcon },
                            React.createElement("div", { className: 'metrics' }, data.metrics.map(item => React.createElement(CircleMetric, { item: item, key: item.title })))),
                        React.createElement(Card, { title: '\u78C1\u76D8\u4FE1\u606F', icon: botIcon },
                            React.createElement(DiskList, { disks: data.disks })),
                        React.createElement(Card, { title: '\u7F51\u7EDC\u72B6\u6001', icon: botIcon },
                            React.createElement(NetworkList, { network: data.network })),
                        React.createElement(RedisCard, { data: data }),
                        React.createElement(Card, { title: '\u6E32\u67D3\u7EDF\u8BA1', icon: recvIcon },
                            React.createElement("div", { className: 'summary' },
                                React.createElement("div", { className: 'summary-item' },
                                    React.createElement("span", null, "\u4ECA\u65E5\u6E32\u67D3"),
                                    React.createElement("strong", null, "\u72B6\u6001\u9875")),
                                React.createElement("div", { className: 'summary-item' },
                                    React.createElement("span", null, "\u6D88\u606F\u7EDF\u8BA1\u8303\u56F4"),
                                    React.createElement("strong", null, data.stats.length)),
                                React.createElement("div", { className: 'summary-item' },
                                    React.createElement("span", null, "\u56FE\u7247\u6A21\u5F0F"),
                                    React.createElement("strong", null, "jsxp")),
                                React.createElement("div", { className: 'summary-item' },
                                    React.createElement("span", null, "\u964D\u7EA7"),
                                    React.createElement("strong", null, "\u6587\u672C")))),
                        React.createElement(Card, { title: '\u7CFB\u7EDF\u4FE1\u606F', icon: botIcon },
                            React.createElement("div", { className: 'simple-list' },
                                React.createElement("div", { className: 'kv' },
                                    React.createElement("span", null, "\u7CFB\u7EDF"),
                                    React.createElement("strong", null, data.system.os)),
                                React.createElement("div", { className: 'kv' },
                                    React.createElement("span", null, "\u5185\u6838"),
                                    React.createElement("strong", null, data.system.kernel)),
                                React.createElement("div", { className: 'kv' },
                                    React.createElement("span", null, "\u67B6\u6784"),
                                    React.createElement("strong", null, data.system.arch)),
                                React.createElement("div", { className: 'kv' },
                                    React.createElement("span", null, "\u4E3B\u673A\u540D"),
                                    React.createElement("strong", null, data.system.host)),
                                React.createElement("div", { className: 'kv' },
                                    React.createElement("span", null, "Node.js"),
                                    React.createElement("strong", null, data.system.node)),
                                React.createElement("div", { className: 'kv' },
                                    React.createElement("span", null, "\u8FDB\u7A0B\u8FD0\u884C"),
                                    React.createElement("strong", null, data.system.processUptime)),
                                React.createElement("div", { className: 'kv' },
                                    React.createElement("span", null, "\u7CFB\u7EDF\u8FD0\u884C"),
                                    React.createElement("strong", null, data.system.osUptime)),
                                React.createElement("div", { className: 'kv' },
                                    React.createElement("span", null, "\u8D1F\u8F7D"),
                                    React.createElement("strong", null, data.system.load))))),
                    React.createElement("aside", { className: 'right' },
                        data.statsTables.map(table => React.createElement(StatsTable, { table: table, key: table.title })),
                        React.createElement(Card, { title: '\u4ECA\u65E5\u6982\u89C8', icon: recvIcon },
                            React.createElement("div", { className: 'today' },
                                React.createElement("div", { className: 'summary-item' },
                                    React.createElement("span", null, "\u6536\u6D88\u606F"),
                                    React.createElement("strong", null, total?.today ?? 0)),
                                React.createElement("div", { className: 'summary-item' },
                                    React.createElement("span", null, "\u53D1\u6D88\u606F"),
                                    React.createElement("strong", null, data.statsTables[0]?.rows[0]?.send ?? 0)),
                                React.createElement("div", { className: 'summary-item' },
                                    React.createElement("span", null, "\u5F53\u524D\u7FA4\u4ECA\u65E5"),
                                    React.createElement("strong", null, group?.today ?? 0)),
                                React.createElement("div", { className: 'summary-item' },
                                    React.createElement("span", null, "\u5F53\u524D\u7528\u6237\u4ECA\u65E5"),
                                    React.createElement("strong", null, user?.today ?? 0)))),
                        data.monitorJson ? React.createElement(Card, { title: 'OneBot\u72B6\u6001', icon: botIcon },
                            React.createElement("div", { className: 'monitor-json' }, data.monitorJson)) : null)),
                React.createElement("div", { className: 'footer' },
                    "Created By AlemonJS & Xiangling \u00B7 ",
                    data.version,
                    " \u00B7 ",
                    data.generatedAt)))));
}

export { StateImage as default };
