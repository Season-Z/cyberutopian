import { Logger } from '@cyberutopian/logger';
import axios from 'axios';
import chalk from 'chalk';
import path from 'node:path';
import ora from 'ora';
import semver from 'semver';

// spinning
export const spinner = (text: string = '操作中...') =>
  ora({
    text: `${text}`,
    color: 'yellow',
    spinner: {
      interval: 80, // Optional
      frames: ['-', '\\', '|', '/', '-'],
    },
  });

const latestVersion = async (packageName: string, isBeta?: boolean) => {
  const response = await axios.get(`https://nexus.shuyilink.com/repository/npm-group/${packageName}`, {
    timeout: 3000 * 10,
  });
  const versionsList = Object.keys(response.data.versions);
  for (let i = versionsList.length - 1; i >= 0; i--) {
    if (isBeta) {
      return versionsList[i];
    }
    if (versionsList[i].indexOf('beta') === -1) {
      return versionsList[i];
    }
  }
};

export const version = async () => {
  const packageJson = require(path.resolve(__dirname, '../package.json'));
  const patchVersion: string = packageJson.version;
  Logger.info(`${packageJson.name} 当前版本：${chalk.grey(patchVersion)}`);

  const sp = spinner('开始检查更新版本');
  sp.start();
  /** 检查版本，给出升级提示 */
  try {
    const newVersion = await latestVersion(packageJson.name);
    if (semver.lt(patchVersion, newVersion as string)) {
      sp.warn(chalk.yellow('patcher 升级提示: '));
      console.log(`  当前版本: ${chalk.grey(patchVersion)}`);
      console.log(`  最新版本: ${chalk.cyan(newVersion)}`);
    } else {
      sp.succeed(chalk.green(`${packageJson.name}: 当前已是最新版本`));
    }
  } catch (err: any) {
    sp.warn(`patcher 版本检查失败，${err.message}`);
  }
};
