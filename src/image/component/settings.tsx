import React from 'react';
import type { SettingsImageData, SettingsItem } from '../../model/admin/settings';

const bg = new URL('../../assets/legacy/resources/help/imgs/default/bg.jpg', import.meta.url).href;
const fzbFont = new URL('../../assets/legacy/resources/common/font/FZB.ttf', import.meta.url).href;
const nzbzFont = new URL('../../assets/legacy/resources/common/font/NZBZ.ttf', import.meta.url).href;

const statusClass = (item: SettingsItem): string => item.status || 'number';

export default function SettingsImage({ data }: { data: SettingsImageData }) {
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
            width: 980px;
            min-height: 1120px;
            font-family: 'FZB', 'Microsoft YaHei', 'PingFang SC', Arial, sans-serif;
            color: #f6f2e8;
            background: #202734 url('${bg}') center top / cover no-repeat;
          }
          .page {
            width: 980px;
            min-height: 1120px;
            padding: 58px 34px 30px;
            background: linear-gradient(180deg, rgba(22,27,36,.18), rgba(22,27,36,.48));
          }
          .header {
            padding: 26px 34px 22px;
            border-radius: 18px;
            background: rgba(32, 39, 49, .82);
            box-shadow: 0 12px 28px rgba(0, 0, 0, .25);
            border: 1px solid rgba(255, 255, 255, .10);
          }
          h1 {
            margin: 0;
            font-family: 'NZBZ', 'FZB', sans-serif;
            font-size: 54px;
            line-height: 1.1;
            letter-spacing: 0;
            color: #fff;
            text-shadow: 0 2px 5px rgba(0, 0, 0, .7);
          }
          .meta {
            display: flex;
            gap: 14px;
            flex-wrap: wrap;
            margin-top: 12px;
            font-size: 18px;
            color: rgba(246, 242, 232, .78);
          }
          .meta span {
            padding: 6px 12px;
            border-radius: 10px;
            background: rgba(255, 255, 255, .08);
          }
          .section {
            margin-top: 22px;
            border-radius: 18px;
            overflow: hidden;
            background: rgba(32, 39, 49, .84);
            box-shadow: 0 12px 28px rgba(0, 0, 0, .24);
            border: 1px solid rgba(255, 255, 255, .10);
          }
          .section-title {
            padding: 18px 24px 14px;
            color: #d3bc8e;
            font-size: 24px;
            font-weight: bold;
            background: rgba(20, 25, 32, .42);
          }
          .item {
            display: grid;
            grid-template-columns: 210px 150px 1fr;
            min-height: 92px;
            border-top: 1px solid rgba(255, 255, 255, .08);
          }
          .item:first-of-type { border-top: 0; }
          .name, .value, .body {
            padding: 16px 18px;
          }
          .name {
            display: flex;
            align-items: center;
            color: #f2deb4;
            font-size: 22px;
          }
          .value {
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .badge {
            min-width: 92px;
            padding: 8px 14px;
            border-radius: 14px;
            text-align: center;
            font-size: 20px;
            color: #fff;
            background: rgba(255, 255, 255, .15);
          }
          .badge.on { background: #2fa56a; }
          .badge.off { background: #7b8492; }
          .badge.number { background: #5d7ec8; }
          .badge.link { background: #9a6dc6; }
          .badge.disabled { background: #8b6060; }
          .hint {
            color: #f3d28b;
            font-size: 18px;
            line-height: 1.35;
            margin-bottom: 8px;
            word-break: break-word;
          }
          .desc {
            color: rgba(246, 242, 232, .78);
            font-size: 17px;
            line-height: 1.45;
            word-break: break-word;
          }
          .footer {
            margin-top: 22px;
            padding: 16px 22px;
            text-align: center;
            color: rgba(255,255,255,.78);
            font-size: 18px;
            text-shadow: 0 2px 4px rgba(0,0,0,.55);
          }
        `}</style>
      </head>
      <body>
        <div className='page'>
          <header className='header'>
            <h1>{data.label}</h1>
            <div className='meta'>
              <span>v{data.version}</span>
              <span>{data.migrationStage}</span>
              <span>{data.generatedAt}</span>
            </div>
          </header>

          {data.sections.map(section => (
            <section className='section' key={section.title}>
              <div className='section-title'>{section.title}</div>
              {section.items.map(item => (
                <div className='item' key={`${section.title}-${item.key}`}>
                  <div className='name'>{item.key}</div>
                  <div className='value'><span className={`badge ${statusClass(item)}`}>{item.value}</span></div>
                  <div className='body'>
                    <div className='hint'>{item.hint}</div>
                    <div className='desc'>{item.desc}</div>
                  </div>
                </div>
              ))}
            </section>
          ))}

          <div className='footer'>AlemonJS & Xiangling</div>
        </div>
      </body>
    </html>
  );
}
