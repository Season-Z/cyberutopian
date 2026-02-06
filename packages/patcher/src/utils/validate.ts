import { Logger } from '@cyberutopian/logger';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'node:path';
import { handleEnvironment } from './environment';
import { version } from './version';

export const validateCfg = async () => {
  const configPath = path.resolve(process.cwd(), 'patcher.config.json');
  const exist = fs.existsSync(configPath);

  if (!exist) {
    Logger.error(`未找到 ${chalk.yellow('patcher.config.json')}`);
    Logger.error(`请执行 ${chalk.blue('patcher -i')}，初始化脚手架`);

    process.exit(-1);
  }
};

export const validate = async () => {
  await validateCfg();
  await handleEnvironment();
  await version();
};

export const validateBk = async () => {
  await handleEnvironment();
  await version();
};
