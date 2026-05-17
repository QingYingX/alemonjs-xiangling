import React from 'react';
import fileUrl$2 from '../../assets/legacy/resources/help/imgs/default/bg.jpg.js';
import fileUrl$3 from '../../assets/legacy/resources/help/imgs/default/main.png.js';
import fileUrl$4 from '../../assets/legacy/resources/help/imgs/default/icon.png.js';
import fileUrl from '../../assets/legacy/resources/common/font/FZB.ttf.js';
import fileUrl$1 from '../../assets/legacy/resources/common/font/NZBZ.ttf.js';

const COLUMN_GAP = 20;
const SIDE_PADDING = 30;
const authLabel = (auth) => {
    if (!auth || auth === 'all')
        return '';
    const names = {
        master: '主人',
        owner: '群主',
        admin: '管理'
    };
    return names[auth] ? ` · ${names[auth]}` : ` · ${auth}`;
};
const getPageWidth = (page) => {
    const tableWidth = page.colCount * page.colWidth;
    if (page.twoColumnLayout)
        return tableWidth * 2 + COLUMN_GAP + SIDE_PADDING;
    return tableWidth + SIDE_PADDING;
};
const getIconStyle = (item) => {
    if (!item.icon)
        return { display: 'none' };
    const x = (item.icon - 1) % 10;
    const y = (item.icon - x - 1) / 10;
    return {
        backgroundImage: `url(${fileUrl$4})`,
        backgroundPosition: `-${x * 50}px -${y * 50}px`
    };
};
const chunkItems = (items, size) => {
    const rows = [];
    for (let index = 0; index < items.length; index += size) {
        rows.push(items.slice(index, index + size));
    }
    return rows;
};
function HelpTable({ group, colCount }) {
    const rows = chunkItems(group.items, colCount);
    const cellWidth = `${100 / colCount}%`;
    return (React.createElement("div", { className: 'help-table' }, rows.map((row, rowIndex) => (React.createElement("div", { className: 'tr', key: `${group.group}-${rowIndex}` },
        row.map(item => (React.createElement("div", { className: 'td', key: `${group.group}-${item.title}`, style: { width: cellWidth } },
            React.createElement("span", { className: 'help-icon', style: getIconStyle(item) }),
            React.createElement("strong", { className: 'help-title' }, item.title),
            React.createElement("span", { className: 'help-desc' }, item.desc)))),
        Array.from({ length: colCount - row.length }).map((_, index) => (React.createElement("div", { className: 'td empty', key: `${group.group}-${rowIndex}-empty-${index}`, style: { width: cellWidth } }))))))));
}
function HelpGroupBox({ group, colCount }) {
    return (React.createElement("section", { className: 'cont-box' },
        React.createElement("div", { className: 'help-group' },
            group.group,
            authLabel(group.auth)),
        React.createElement(HelpTable, { group: group, colCount: colCount })));
}
function HelpGroups({ groups, colCount }) {
    return (React.createElement(React.Fragment, null, groups.map(group => (React.createElement(HelpGroupBox, { group: group, colCount: colCount, key: group.group })))));
}
function HelpImage({ page }) {
    const width = getPageWidth(page);
    const groups = page.twoColumnLayout ? [] : page.groups;
    return (React.createElement("html", null,
        React.createElement("head", null,
            React.createElement("meta", { charSet: 'utf-8' }),
            React.createElement("style", null, `
          @font-face { font-family: 'FZB'; src: url('${fileUrl}') format('truetype'); font-weight: normal; font-style: normal; }
          @font-face { font-family: 'NZBZ'; src: url('${fileUrl$1}') format('truetype'); font-weight: normal; font-style: normal; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { min-height: 100%; }
          body {
            width: ${width}px;
            margin: 0;
            color: #1e1f20;
            font-family: 'FZB', 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
            font-size: 18px;
            background-image: url('${fileUrl$2}');
            background-repeat: no-repeat;
            background-size: cover;
            background-position: top left;
          }
          .container {
            width: ${width}px;
            min-height: 900px;
            padding: 20px 15px 10px 15px;
            background-image: url('${fileUrl$3}');
            background-position: top left;
            background-repeat: no-repeat;
            background-size: cover;
          }
          .head-box {
            border-radius: 15px;
            padding: 10px 20px;
            position: relative;
            color: #fff;
            margin: 60px 0 0 0;
            padding-bottom: 0;
          }
          .head-box .title {
            font-family: 'NZBZ', 'FZB', 'Microsoft YaHei', sans-serif;
            font-size: 50px;
            line-height: 1.15;
            color: #fff;
            text-shadow: 0 0 1px #000, 1px 1px 3px rgba(0, 0, 0, .9);
            letter-spacing: 0;
          }
          .head-box .label {
            margin-top: 4px;
            font-size: 16px;
            line-height: 1.4;
            color: #fff;
            text-shadow: 0 0 1px #000, 1px 1px 3px rgba(0, 0, 0, .9);
          }
          .cont-box {
            border-radius: 15px;
            margin-top: 20px;
            margin-bottom: 20px;
            overflow: hidden;
            box-shadow: 0 5px 10px 0 rgb(0 0 0 / 15%);
            position: relative;
            background: rgba(43, 52, 61, .8);
            backdrop-filter: blur(3px);
          }
          .help-group {
            font-size: 18px;
            line-height: 1.3;
            font-weight: bold;
            padding: 15px 15px 10px 20px;
            color: #ceb78b;
            background: rgba(34, 41, 51, .4);
            text-shadow: none;
          }
          .help-table {
            text-align: center;
            border-collapse: collapse;
            margin: 0;
            border-radius: 0 0 10px 10px;
            display: table;
            overflow: hidden;
            width: 100%;
            color: #fff;
          }
          .help-table .tr { display: table-row; }
          .help-table .tr:nth-child(odd) { background: rgba(34, 41, 51, .2); }
          .help-table .tr:nth-child(even) { background: rgba(34, 41, 51, .4); }
          .help-table .td {
            font-size: 14px;
            display: table-cell;
            box-shadow: 0 0 1px 0 #888 inset;
            padding: 12px 8px 12px 50px;
            line-height: 24px;
            position: relative;
            text-align: left;
            vertical-align: top;
            min-height: 64px;
            color: #fff;
          }
          .help-table .td.empty { padding-left: 0; }
          .help-icon {
            width: 40px;
            height: 40px;
            display: block;
            position: absolute;
            background-size: 500px auto;
            background-repeat: no-repeat;
            border-radius: 5px;
            left: 6px;
            top: 12px;
            transform: scale(.85);
            transform-origin: center;
          }
          .help-title {
            display: block;
            color: #d3bc8e;
            font-size: 16px;
            line-height: 24px;
            font-weight: bold;
            word-break: break-word;
          }
          .help-desc {
            display: block;
            color: #eee;
            font-size: 13px;
            line-height: 18px;
            word-break: break-word;
          }
          .help-content-wrapper {
            display: flex;
            gap: ${COLUMN_GAP}px;
            width: 100%;
            align-items: flex-start;
          }
          .help-column { flex: 1; min-width: 0; }
          .help-column .cont-box { width: 100%; }
          .copyright {
            font-size: 20px;
            text-align: center;
            color: #fff;
            position: relative;
            padding-left: 10px;
            text-shadow: 1px 1px 1px #000;
            margin: 10px 0;
          }
          .copyright .version {
            color: #d3bc8e;
            display: inline-block;
            padding: 0 3px;
          }
        `)),
        React.createElement("body", null,
            React.createElement("div", { className: 'container' },
                React.createElement("div", { className: 'info-box' },
                    React.createElement("div", { className: 'head-box' },
                        React.createElement("div", { className: 'title' }, page.title),
                        React.createElement("div", { className: 'label' }, page.subTitle))),
                page.twoColumnLayout ? (React.createElement(React.Fragment, null,
                    React.createElement(HelpGroups, { groups: page.topFullWidthGroups, colCount: page.colCount }),
                    React.createElement("div", { className: 'help-content-wrapper' },
                        React.createElement("div", { className: 'help-column' },
                            React.createElement(HelpGroups, { groups: page.leftGroups, colCount: page.colCount })),
                        React.createElement("div", { className: 'help-column' },
                            React.createElement(HelpGroups, { groups: page.rightGroups, colCount: page.colCount }))),
                    React.createElement(HelpGroups, { groups: page.bottomFullWidthGroups, colCount: page.colCount }))) : (React.createElement(HelpGroups, { groups: groups, colCount: page.colCount })),
                React.createElement("div", { className: 'copyright' },
                    "Created By ",
                    React.createElement("span", { className: 'version' }, "Xiangling"),
                    " \u00B7 AlemonJS")))));
}

export { HelpImage as default };
