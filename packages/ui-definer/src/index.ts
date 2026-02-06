#!/usr/bin/env node

import { Logger } from '@cyberutopian/logger';
import { program } from 'commander';
import run from './run';

const config = require('../package.json');

program
  .version(`version: ${config.version}`, '-V, --version', '版本名称')
  .option('-u, --ui [path] [path...]', '生成UI规范')
  .parse();

const options = program.opts();

run(options);

const onError = (err: string) => {
  Logger.error(err);
  process.exit(1);
};

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);
