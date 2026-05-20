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
import { SwaggerJson, TypingConfig, TypingEntryType } from './types';
import {
  getConfigFile,
  majorVersionsCheck,
  replaceSpecialChars,
  spinner,
} from './utils';

type TypeTaskConfig = {
  url: TypingEntryType;
  dirs: string[];
  token?: string;
};

type TypeTaskResult = Awaited<ReturnType<typeof generator>> & {
  name: string;
};

const toArray = <T>(value?: T | T[]) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && Boolean(value.trim());

const isValidTypingEntry = (value: TypingEntryType) => {
  return typeof value === 'string'
    ? isNonEmptyString(value)
    : isNonEmptyString(value.url);
};

const getTypesConfigs = (cfg: unknown): TypingConfig[] => {
  const configs = Array.isArray(cfg) ? cfg : [cfg];

  return configs.reduce<TypingConfig[]>((prev, item) => {
    if (!isRecord(item)) {
      return prev;
    }

    const types = item.types as TypingConfig | TypingConfig[] | undefined;

    if (types) {
      return [...prev, ...toArray(types)];
    }

    if ('url' in item || 'dir' in item) {
      return [...prev, item as TypingConfig];
    }

    return prev;
  }, []);
};

const getTypesFieldName = (
  field: 'url' | 'dir',
  index: number,
  total: number,
) => {
  return total > 1 ? `types[${index}].${field}` : `types.${field}`;
};

const getTypeTaskConfigs = (typeConfigs: TypingConfig[]) => {
  return typeConfigs.reduce<TypeTaskConfig[]>(
    (prev, { url: urls, dir, token }, index) => {
      const urlList = toArray(urls);
      const dirs = toArray(dir);

      if (!urlList.length || urlList.some((url) => !isValidTypingEntry(url))) {
        Logger.error(
          `请确认 ${chalk.yellow(getTypesFieldName('url', index, typeConfigs.length))} 是否存在`,
        );
        process.exit(-1);
      }

      if (!dirs.length || dirs.some((dir) => !isNonEmptyString(dir))) {
        Logger.error(
          `请确认 ${chalk.yellow(getTypesFieldName('dir', index, typeConfigs.length))} 是否存在`,
        );
        process.exit(-1);
      }

      return [
        ...prev,
        ...urlList.map((url) => ({
          url,
          dirs: [...new Set(dirs)],
          token,
        })),
      ];
    },
    [],
  );
};

const task = async (
  u: TypingEntryType,
  index: number,
  token?: string,
): Promise<TypeTaskResult> => {
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
    const name =
      typeof u === 'string'
        ? url.match(regex)?.[1] || String(index || 'base_api')
        : u.name || String(index || 'base_api');

    const data = await generator(input, name);

    return { ...data, name };
  } catch (error) {
    Logger.error(error as string);
    throw error;
  }
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
  const typeConfigs = getTypesConfigs(cfg);

  if (!typeConfigs.length) {
    Logger.error(`请确认 ${chalk.yellow('types')} 是否存在`);
    process.exit(-1);
  }

  const taskConfigs = getTypeTaskConfigs(typeConfigs);
  const dirs = [...new Set(taskConfigs.flatMap(({ dirs }) => dirs))];

  dirs.forEach((item: string) => {
    const d = path.join(PROJECT_ROOT, item);
    if (!fs.existsSync(d)) {
      fs.mkdirSync(d, { recursive: true });
    } else {
      fs.rmSync(d, { recursive: true, force: true });
      fs.mkdirSync(d, { recursive: true });
    }
  });

  const tasks = await Promise.allSettled(
    taskConfigs.map(({ url, token }, i) => task(url, i, token)),
  );

  for (const [index, item] of tasks.entries()) {
    if (item.status === 'rejected') {
      Logger.error(item.reason);
      process.exit(-1);
    }

    const { value } = item;

    for (const d of taskConfigs[index].dirs) {
      fs.writeFileSync(
        `${d}/services-${replaceSpecialChars(value?.name || String(index))}.ts`,
        await prettier.format(value.code, { parser: 'typescript' }),
      );
      Logger.success(chalk.yellowBright('services 生成成功'));

      fs.writeFileSync(
        `${d}/types-${replaceSpecialChars(value?.name || String(index))}.ts`,
        await prettier.format(value.type, { parser: 'typescript' }),
      );
      Logger.success(chalk.yellowBright('types 生成成功'));
    }
  }

  for (const d of dirs) {
    const dirTasks = tasks.filter((_task, index) =>
      taskConfigs[index].dirs.includes(d),
    );
    fs.writeFileSync(
      `${d}/index.ts`,
      await prettier.format(entry(dirTasks), { parser: 'typescript' }),
    );
    Logger.success(chalk.yellowBright('index 生成成功'));
    console.log(`位置：${d}`);
  }
};
