import { Logger } from '@cyberutopian/logger';
import { spawn } from 'node:child_process';

const fetcher = async (name: string, dir: string) => {
  return new Promise((resolve, reject) => {
    Logger.info('正在拉取项目...\n');

    const process = spawn('git', ['clone', '-b', name, 'ssh://git@gitlab.shuyilink.com:20022/web/templates.git', dir], {
      stdio: 'inherit',
    });

    process.on('close', (code) => {
      if (code !== 0) {
        console.log(`Command failed with code ${code}`);
      }
      Logger.success('拉取成功');
      resolve(true);
    });
    process.on('error', (err) => {
      Logger.error('拉取失败');
      reject(err);
    });
  });
};

export default fetcher;
