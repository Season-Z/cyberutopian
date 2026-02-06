#!/usr/bin/env node

import { Logger } from '@cyberutopian/logger';
import { program } from 'commander';
import run from './run';

const config = require('../package.json');

program
  .version(`version: ${config.version}`, '-V, --version', '版本名称')
  .option('--project', '生成vue3工程')
  .option('--package', '生成package工程')
  .option('--view', '生成vue3页面')
  .parse();

const options = program.opts();

run(options);

const onError = (err: string) => {
  Logger.error(err);
  process.exit(1);
};

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);
