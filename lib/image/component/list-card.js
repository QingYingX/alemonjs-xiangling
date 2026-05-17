import React from 'react';

const bg = new URL('../../assets/legacy/resources/help/imgs/default/bg.jpg', import.meta.url).href;
const fzbFont = new URL('../../assets/legacy/resources/common/font/FZB.ttf', import.meta.url).href;
const nzbzFont = new URL('../../assets/legacy/resources/common/font/NZBZ.ttf', import.meta.url).href;
function ListCardImage({ data }) {
    return (React.createElement("html", null,
        React.createElement("head", null,
            React.createElement("meta", { charSet: 'utf-8' }),
            React.createElement("style", null, `
          @font-face { font-family: 'FZB'; src: url('${fzbFont}') format('truetype'); font-weight: normal; font-style: normal; }
          @font-face { font-family: 'NZBZ'; src: url('${nzbzFont}') format('truetype'); font-weight: normal; font-style: normal; }
          * { box-sizing: border-box; }
          html, body { margin: 0; padding: 0; }
          body {
            width: 960px;
            color: #f7f2e8;
            font-family: 'FZB', 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
            background: #252734 url('${bg}') center top / cover no-repeat;
          }
          .page {
            width: 960px;
            padding: 38px 36px 24px;
            background: linear-gradient(180deg, rgba(20,23,32,.1), rgba(20,23,32,.46));
          }
          .header {
            padding: 20px 24px 16px;
            border-radius: 16px;
            background: rgba(34, 41, 51, .82);
            box-shadow: 0 10px 28px rgba(0,0,0,.26);
            border: 1px solid rgba(255,255,255,.12);
          }
          .title {
            font-family: 'NZBZ', 'FZB', sans-serif;
            font-size: 46px;
            line-height: 1.08;
            letter-spacing: 0;
            color: #fff;
            text-shadow: 0 2px 5px rgba(0,0,0,.72);
          }
          .subtitle {
            margin-top: 8px;
            color: rgba(255,255,255,.82);
            font-size: 18px;
            line-height: 1.35;
          }
          .summary {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 14px;
          }
          .summary span, .tag {
            display: inline-flex;
            align-items: center;
            min-height: 28px;
            padding: 3px 11px;
            border-radius: 8px;
            background: rgba(211,188,142,.24);
            color: #f4d7a4;
            border: 1px solid rgba(211,188,142,.36);
            font-size: 16px;
            line-height: 1.25;
          }
          .list {
            margin-top: 22px;
            display: grid;
            gap: 14px;
          }
          .item {
            padding: 16px 20px;
            border-radius: 15px;
            background: rgba(43,52,61,.84);
            box-shadow: 0 6px 16px rgba(0,0,0,.18);
            border: 1px solid rgba(255,255,255,.1);
          }
          .item-head {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 16px;
            align-items: start;
          }
          .item-title {
            color: #d3bc8e;
            font-size: 22px;
            line-height: 1.25;
            word-break: break-word;
          }
          .item-subtitle {
            margin-top: 3px;
            color: rgba(255,255,255,.62);
            font-size: 16px;
            line-height: 1.3;
            word-break: break-word;
          }
          .tags {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 6px;
            max-width: 260px;
          }
          .tag {
            min-height: 24px;
            font-size: 14px;
            background: rgba(97,130,190,.28);
            color: #dce7ff;
            border-color: rgba(148,172,220,.32);
          }
          .content {
            margin-top: 10px;
            color: rgba(255,255,255,.9);
            font-size: 18px;
            line-height: 1.45;
            white-space: pre-wrap;
            word-break: break-word;
          }
          .empty {
            margin-top: 22px;
            padding: 34px 24px;
            text-align: center;
            border-radius: 15px;
            background: rgba(43,52,61,.82);
            color: rgba(255,255,255,.76);
            font-size: 20px;
          }
          .footer {
            margin-top: 24px;
            text-align: center;
            color: rgba(255,255,255,.75);
            font-size: 16px;
            text-shadow: 0 2px 4px rgba(0,0,0,.58);
          }
        `)),
        React.createElement("body", null,
            React.createElement("div", { className: 'page' },
                React.createElement("header", { className: 'header' },
                    React.createElement("div", { className: 'title' }, data.title),
                    React.createElement("div", { className: 'subtitle' }, data.subTitle),
                    data.summary?.length ? (React.createElement("div", { className: 'summary' }, data.summary.map(item => React.createElement("span", { key: item }, item)))) : null),
                data.items.length ? (React.createElement("main", { className: 'list' }, data.items.map((item, index) => (React.createElement("section", { className: 'item', key: `${item.title}-${index}` },
                    React.createElement("div", { className: 'item-head' },
                        React.createElement("div", null,
                            React.createElement("div", { className: 'item-title' }, item.title),
                            item.subtitle ? React.createElement("div", { className: 'item-subtitle' }, item.subtitle) : null),
                        item.tags?.length ? React.createElement("div", { className: 'tags' }, item.tags.map(tag => React.createElement("span", { className: 'tag', key: tag }, tag))) : null),
                    React.createElement("div", { className: 'content' }, item.content)))))) : (React.createElement("div", { className: 'empty' }, data.emptyText || '暂无记录')),
                React.createElement("div", { className: 'footer' }, data.footer || 'AlemonJS & Xiangling')))));
}

export { ListCardImage as default };
