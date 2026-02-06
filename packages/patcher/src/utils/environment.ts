import { Logger } from '@cyberutopian/logger';
import chalk from 'chalk';
import { exec, spawn } from 'child_process';
import semver from 'semver';

const TARGET_VERSION = '18.20.4';

const checkNodeVersion = () => {
  return new Promise((resolve, reject) => {
    exec('node -v', (error, stdout) => {
      if (error) {
        Logger.error('未检测到 Node，请安装后重试。');
        reject();
        return;
      }
      const currentVersion = stdout.trim().replace(/^v/, ''); // 去掉版本号前的 "v"
      Logger.info(`当前 Node 版本为：${chalk.yellow(currentVersion)}`);
      resolve(currentVersion);
    });
  });
};

const switchNodeVersion = (version: string) => {
  return new Promise((resolve, reject) => {
    const nvmScriptPath = process.env.NVM_DIR ? `${process.env.NVM_DIR}/nvm.sh` : '~/.nvm/nvm.sh';

    // 输出 nvmScriptPath 以调试
    Logger.info(`nvm script path: ${nvmScriptPath}`);

    const command = `source ${nvmScriptPath} && nvm use ${version} && exec $SHELL`;

    const shell = spawn('/bin/bash', ['-c', command], { stdio: 'inherit', shell: '/bin/bash' });

    shell.on('close', (code) => {
      if (code === 0) {
        Logger.info(`已成功切换到 Node 版本 ${chalk.yellow(version)}`);
        resolve(true);
      } else {
        Logger.error(
          `切换 Node 版本失败，请确保 nvm 和目标版本已正确安装。请手动切换：\n${chalk.yellow(`nvm install ${TARGET_VERSION} \nnvm use ${TARGET_VERSION}`)}`,
        );

        reject();
      }
    });

    shell.on('error', (err) => {
      Logger.error(`发生错误: ${err}`);
      reject();
    });
  });
};

export const handleEnvironment = async () => {
  try {
    const currentVersion = (await checkNodeVersion()) as string;
    if (semver.satisfies(currentVersion, `>=${TARGET_VERSION}`)) {
      Logger.info('当前 Node 版本满足要求。');
    } else {
      Logger.info(`当前 Node 版本低于目标版本 (${TARGET_VERSION})，尝试切换...`);

      await switchNodeVersion(TARGET_VERSION);
    }
  } catch (error) {
    if (error) {
      Logger.error(error as string);
    }
    process.exit(-1);
  }
};
