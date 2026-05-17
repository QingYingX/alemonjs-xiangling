import { Format, useMessage } from 'alemonjs';

export default async () => {
  const [message] = useMessage();
  await message.send({
    format: Format.create().addText('当前 @alemonjs/onebot 未暴露稳定的主动加好友 API，#加为好友 暂不迁移。可先使用好友申请记录里的 #同意好友申请 处理对方发起的申请。')
  });
  return false;
};
