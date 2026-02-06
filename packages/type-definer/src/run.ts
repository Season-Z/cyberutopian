import { Logger } from '@cyberutopian/logger';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import prettier from 'prettier';
import pak from '../package.json';
import { PROJECT_ROOT } from './config';
import { generator } from './core/generator';
import { getSwagger, swaggerToOpenApi } from './core/get-swagger';
import { entry } from './template/entry';
import { SwaggerJson, TypingEntryType } from './types';
import { getConfigFile, majorVersionsCheck, replaceSpecialChars, spinner } from './utils';

const task = async (u: TypingEntryType, index: number, token?: string) => {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    let input: SwaggerJson;

    const search = spinner('正在获取swagger文件...').start();
    try {
      const url = typeof u === 'string' ? u : u.url;

      // 确保 url 是有效的字符串
      if (typeof url !== 'string' || !url.trim()) {
        throw new Error(`Invalid url: ${url}, expected non-empty string`);
      }

      input = await getSwagger(url, token);
      search.succeed('数据获取成功');

      // @ts-ignore
      const { openapi, info } = input;

      Logger.info(`openapi version: ${openapi}`);

      console.log('');
      console.info('------ info start --------');

      console.info(`url: ${url}`);
      console.info(`title: ${info?.title}`);
      console.info(`doc version: ${info?.version}`);

      console.info('------ info end --------');
      console.log('');

      if (input.swagger) {
        majorVersionsCheck('2.0.0', input.swagger);
        // convert swagger v2 to openApi v3
        input = await swaggerToOpenApi(input);
      } else if (input.openapi) {
        majorVersionsCheck('3.0.0', input.openapi);
      } else {
        // input = yaml.load(await postmanToOpenApi(JSON.stringify(input), undefined)) as SwaggerJson;
      }

      const regex = /api-docs\/([^/]+)/;
      const name = typeof u === 'string' ? url.match(regex)?.[1] || index || 'base_api' : u.name;

      const data = await generator(input, name);

      resolve({ ...data, name });
    } catch (error) {
      Logger.error(error as string);
      reject(error);
    }
  });
};

export const run = async (typing: boolean) => {
  console.log('--------------- CLI Version -----------------');
  Logger.info(chalk.blueBright(`Typing Version: ${pak.version}`));
  console.log();

  if (!typing) {
    Logger.error('输入参数错误');
    process.exit(-1);
  }

  const cfg = getConfigFile();
  const { url: urls, dir, token } = cfg?.types || {};

  if (!urls) {
    Logger.error(`请确认 ${chalk.yellow('types.url')} 是否存在`);
    process.exit(-1);
  }

  const url = Array.isArray(urls) ? urls : [urls];

  const dirs = typeof dir === 'string' ? [dir] : dir;

  dirs.forEach((item: string) => {
    const d = path.join(PROJECT_ROOT, item);
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    } else {
      fs.rmSync(d, { recursive: true, force: true });
      fs.mkdirSync(d, { recursive: true });
    }
  });

  const tasks = await Promise.allSettled(url.map((u: TypingEntryType, i: number) => task(u, i, token)));

  for (const [index, item] of tasks.entries()) {
    if (item.status === 'rejected') {
      Logger.error(item.reason);
      process.exit(-1);
    }

    const { value } = item as any;

    for (const d of dirs) {
      fs.writeFileSync(
        `${d}/services-${replaceSpecialChars(value?.name || index)}.ts`,
        await prettier.format(value.code, { parser: 'typescript' }),
      );
      Logger.success(chalk.yellowBright('services 生成成功'));

      fs.writeFileSync(
        `${d}/types-${replaceSpecialChars(value?.name || index)}.ts`,
        await prettier.format(value.type, { parser: 'typescript' }),
      );
      Logger.success(chalk.yellowBright('types 生成成功'));
    }
  }

  for (const d of dirs) {
    fs.writeFileSync(`${d}/index.ts`, await prettier.format(entry(tasks), { parser: 'typescript' }));
    Logger.success(chalk.yellowBright('index 生成成功'));
    console.log(`位置：${d}`);
  }
};
