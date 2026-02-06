#!/usr/bin/env node

// @ts-ignore
import { Logger, setPrefix } from '@cyberutopian/logger';
import { program } from 'commander';
import { run } from './run';

const config = require('../package.json');

setPrefix('typings');

program
  .version(`version: ${config.version}`, '-V, --version', '版本名称')
  .option('-t, --typing', '生成API的typing类型')
  .parse();

const options = program.opts();

run(options.typing);

const onError = (err: string) => {
  Logger.error(err);
  process.exit(1);
};

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);
