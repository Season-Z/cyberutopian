#!/usr/bin/env node

import { Logger } from '@cyberutopian/logger';
import { program } from 'commander';
import run from './run';

const config = require('../package.json');

program
  .version(`version: ${config.version}`, '-V, --version', '版本名称')
  .option('-export', '导出i18n文件')
  .option('-import', '导入i18n文件')
  .parse();

const options = program.opts();

run(options);

const onError = (err: string) => {
  Logger.error(err);
  process.exit(1);
};

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);
