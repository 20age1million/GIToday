import { CronJob } from 'cron';

let count = 0;
const job = new CronJob('*/2 * * * * *', () => {
  console.log('tick', ++count);
});

// 第一次启动
job.start();

// 再次启动
job.start();

// 过几秒后停止
setTimeout(() => {
  job.stop();
  console.log('Final count =', count);
}, 10000);