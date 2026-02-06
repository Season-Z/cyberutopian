import { Logger } from '@cyberutopian/logger';
import spawn from 'cross-spawn';
import { exec } from 'node:child_process';

export const isInstalled = (command: string) => {
  return new Promise((resolve) => {
    exec(`command -v ${command}`, (error) => {
      console.log(command, error);
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

export const executeCommand = async (command: string, args: string[], error?: boolean) => {
  if (error) {
    Logger.error(`参数错误！，请参考：`);
  } else {
    Logger.info(`正在执行: npx ${command} ${args.join(' ')}`);
  }

  // const installed = await isInstalled(command);
  // console.log('installed', installed, command);
  // try {
  //   const pro = spawn(command, ['-h']);
  //   // console.log(pro);

  //   pro.on('message', (msg) => {
  //     console.log(msg);
  //   });
  // } catch (error) {}

  const process = spawn('npx', [command, ...args], { stdio: 'inherit' });

  // 捕获进程退出
  process.on('close', (code) => {
    if (code !== 0) {
      console.log(`Command failed with code ${code}`);
    }
  });
};
