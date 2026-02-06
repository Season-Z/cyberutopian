#!/usr/bin/env node

// @ts-ignore
import { Logger, setPrefix } from '@cyberutopian/logger';
import { program } from 'commander';
import { run } from './run';
import { executeCommand } from './utils/execute-command';
import { validate, validateBk } from './utils/validate';

const pkg = require('../package.json');

setPrefix('patcher');

// // icon 命令
// program
//   .command('iconer')
//   .description('运行生成icon')
//   .option('-a, --add [iconName] [icons...]', '添加指定名称的icon，多个icon请以空格分开；使用 . 则全部添加')
//   .action(async (options) => {
//     await validate();

//     const argsArray = [];

//     // 将选项转换为数组参数
//     if (options.init) {
//       argsArray.push('-i');
//       typeof options.init !== 'boolean' && argsArray.push(options.init);
//     }
//     if (options.add) {
//       argsArray.push('-a', ...options.add);
//     }
//     if (options.version) {
//       argsArray.push('-V');
//     }

//     await executeCommand('@cyberutopian/iconer', argsArray);
//   });

// typing 命令
program
  .command('typing')
  .description('根据接口出入参，生成接口的Typescript声明类型')
  .option('-t, --typing', '生成API的typing类型')
  .action(async (options) => {
    await validate();

    const argsArray = [];

    if (options.typing) {
      argsArray.push('-t');
    }

    await executeCommand('@cyberutopian/type-definer', argsArray);
  });

// ui 命令
program
  .command('ui')
  .description('根据Design Token生成样式文件')
  .option('-u, --ui [path] [path...]', '生成UI规范')
  .action(async (options) => {
    await validate();

    const argsArray = [];

    if (options.ui) {
      if (!options?.ui || !Array.isArray(options?.ui)) {
        await executeCommand('@cyberutopian/ui-definer', ['-h'], true);
        return;
      }
      argsArray.push('-u', ...(options?.ui || []));
    }

    await executeCommand('@cyberutopian/ui-definer', argsArray);
  });

// generator 命令
program
  .command('gen')
  .description('生成工程项目')
  .option('-g, --generator', '生成工程项目')
  .action(async (options) => {
    await validateBk();

    const argsArray = [];

    if (options.generator) {
      argsArray.push('-g');
    }

    await executeCommand('@cyberutopian/generator', argsArray);
  });

// i18n 命令
program
  .command('i18n')
  .description('i18n 导入导出')
  .option('--import', '导入i18n文件')
  .option('--export', '导出i18n文件')
  .action(async (options) => {
    await validateBk();

    const argsArray = [];

    if (options.import) {
      argsArray.push('-import');
    }
    if (options.export) {
      argsArray.push('-export');
    }

    await executeCommand('@cyberutopian/i18n', argsArray);
  });

program.version(`version: ${pkg.version}`, '-V, --version', '版本名称').option('-i, --init', '生成初始化配置文件');

program.action(() => {
  const opts = program.opts();
  if (opts) {
    Logger.info('正在生成初始化配置文件...');
    run(opts);
  } else {
    program.help(); // 如果没有顶层选项，显示帮助信息
  }
});

program.parse();

const onError = (err: string) => {
  Logger.error(err);
  process.exit(1);
};

process.on('uncaughtException', onError);
process.on('unhandledRejection', onError);
