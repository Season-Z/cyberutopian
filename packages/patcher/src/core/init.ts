import { Logger } from '@cyberutopian/logger';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'node:path';
import { cfg } from '../config/linker.config';

export const initPatch = async () => {
  await fs.writeFile(path.resolve(process.cwd(), 'patcher.config.json'), cfg);

  Logger.success(`成功生成 ${chalk.yellow('patcher.config.json')} 文件`);
};
