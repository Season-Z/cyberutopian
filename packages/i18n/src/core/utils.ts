import { Logger } from '@cyberutopian/logger';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

export const fileName = 'translations.xlsx';

export const getConfig = async () => {
  const configPath = path.resolve(process.cwd(), 'patcher.config.json');
  const config = require(configPath);

  const { dir } = config.i18n;

  if (!dir) {
    Logger.error(`${chalk.yellow('patcher.config.json')} 的 i18n 配置不完整`);
    process.exit(-1);
  }

  return dir;
};

export const existFile = () => {
  const inputPath = path.resolve(process.cwd(), fileName);
  return fs.existsSync(inputPath);
};

export const getInputFile = async () => {
  const inputPath = path.resolve(process.cwd(), fileName);
  if (!existFile()) {
    Logger.error(`未找到 ${chalk.yellow(fileName)}`);
    process.exit(-1);
  }
  return inputPath;
};
