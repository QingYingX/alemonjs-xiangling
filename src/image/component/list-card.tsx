import React from 'react';
import bg from '../../assets/legacy/resources/help/imgs/default/bg.jpg';
import fzbFont from '../../assets/legacy/resources/common/font/FZB.ttf';
import nzbzFont from '../../assets/legacy/resources/common/font/NZBZ.ttf';

export type ListCardItem = {
  title: string;
  subtitle?: string;
  content: string;
  tags?: string[];
};

export type ListCardData = {
  title: string;
  subTitle: string;
  summary?: string[];
  emptyText?: string;
  items: ListCardItem[];
  footer?: string;
};

export default function ListCardImage({ data }: { data: ListCardData }) {
  return (
    <html>
      <head>
        <meta charSet='utf-8' />
        <style>{`
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
        `}</style>
      </head>
      <body>
        <div className='page'>
          <header className='header'>
            <div className='title'>{data.title}</div>
            <div className='subtitle'>{data.subTitle}</div>
            {data.summary?.length ? (
              <div className='summary'>{data.summary.map(item => <span key={item}>{item}</span>)}</div>
            ) : null}
          </header>

          {data.items.length ? (
            <main className='list'>
              {data.items.map((item, index) => (
                <section className='item' key={`${item.title}-${index}`}>
                  <div className='item-head'>
                    <div>
                      <div className='item-title'>{item.title}</div>
                      {item.subtitle ? <div className='item-subtitle'>{item.subtitle}</div> : null}
                    </div>
                    {item.tags?.length ? <div className='tags'>{item.tags.map(tag => <span className='tag' key={tag}>{tag}</span>)}</div> : null}
                  </div>
                  <div className='content'>{item.content}</div>
                </section>
              ))}
            </main>
          ) : (
            <div className='empty'>{data.emptyText || '暂无记录'}</div>
          )}

          <div className='footer'>{data.footer || 'AlemonJS & Xiangling'}</div>
        </div>
      </body>
    </html>
  );
}
