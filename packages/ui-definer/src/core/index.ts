import { Logger } from '@cyberutopian/logger';
import chalk from 'chalk';
import fs from 'fs-extra';
import { absolutePath, createFileWithDirs, getConfigFile, getFileData, spinner } from '../tools';
import { shadowSpecific, specificType } from './config';
import { formatColor, formatRadius, formatTypography } from './format';

const getPathData = async (path: string[] = []) => {
  if (!path.length) return {};
  const list = await Promise.allSettled(path.map((v) => getFileData(v)));

  return list.reduce((pre: Record<string, any>, next: Record<string, any>) => {
    if (next.status === 'fulfilled') {
      let map = {};
      try {
        map = JSON.parse(next.value);
      } catch (error) {
        Logger.error('文件内容错误');
        throw error;
      }

      pre = {
        ...pre,
        ...map,
      };
    }
    return pre;
  }, {});
};

// const defaultData = async () => {
//   const paths = await getFiles(path.resolve(__dirname, '../../config/ui'));
//   const list = await getPathData((paths as string[]) || []);
//   return list;
// };

const uiDefiner = async (paths: string[]) => {
  // 获取配置文件
  const cfg = getConfigFile();
  const specificPath = cfg.ui?.dir || '';
  if (!specificPath) {
    Logger.error('请确认UI规范文件路径是否存在');
    process.exit(-1);
  }

  const readSpin = spinner('正在读取文件...').start();
  let colorSpecific: any = {
    sass: '',
    enums: '',
    tailwind: '',
    colorCls: '',
  };
  let radiusSpecific = {
    sass: '',
    enums: '',
    tailwind: '',
  };
  let typographySpecific = {
    sass: '',
    enums: '',
    tailwind: '',
  };

  try {
    let map: any = {};
    if (typeof paths === 'string' || Array.isArray(paths)) {
      map = await getPathData(paths || []);
    }
    // const defaultMap = (await defaultData()) || {};

    // map = { ...defaultMap, ...map };

    const utilsKeys = map[specificType.utils] ? Object.keys(map[specificType.utils]) : [];
    const radius = utilsKeys.reduce(
      (pre, ne) => (ne.includes('radius') ? { ...pre, [ne]: map[specificType.utils][ne] } : pre),
      {},
    );

    colorSpecific = formatColor(map['color']);
    typographySpecific = formatTypography(map[specificType.typography]);
    radiusSpecific = formatRadius(radius);

    if (!map['color'] && !map[specificType.typography] && Object.keys(radius).length === 0) {
      throw '未发现规范文件路径';
    }

    readSpin.succeed('数据读取成功');
  } catch (error) {
    readSpin.fail('数据读取失败');
    Logger.error(error as string);
  }

  const spin = spinner('正在生成UI规范...').start();

  if (!fs.existsSync(specificPath)) {
    await fs.mkdir(specificPath);
  } else {
    await fs.remove(specificPath);
    await fs.mkdir(specificPath);
  }

  let taskList = [];
  try {
    const sassData = `${colorSpecific.sass};\n\n${colorSpecific.colorCls};\n\n ${radiusSpecific.sass};\n\n ${shadowSpecific.sass}`;
    const enumsData = `${colorSpecific.enums}\n\n ${typographySpecific.enums}\n\n ${radiusSpecific.enums}\n\n ${shadowSpecific.enums}`;
    const tailData = `${colorSpecific.tailwind}\n\n ${typographySpecific.tailwind}\n\n ${radiusSpecific.tailwind}\n\n ${shadowSpecific.tailwind}`;

    taskList = [
      {
        path: absolutePath(`${specificPath}/variable.scss`),
        content: sassData,
      },
      {
        path: absolutePath(`${specificPath}/tailwind.ts`),
        content: tailData,
      },
      {
        path: absolutePath(`${specificPath}/enums.ts`),
        content: enumsData,
      },
    ];
  } catch (error) {
    spin.fail('UI规范生成失败');
    process.exit(-1);
  }

  return Promise.all(taskList.map(({ path, content }) => createFileWithDirs(path, content)))
    .then(async () => {
      // await fs.copyFile(absolutePath(`reset.scss`), absolutePath(`${specificPath}/reset.scss`));
      // await fs.remove('reset.scss');

      spin.succeed(chalk.green(`UI规范生成成功，文件目录：${specificPath}`));
    })
    .catch((err) => {
      spin.fail(chalk.red(`UI规范生成失败！${err.message}`));
    });
};

export default uiDefiner;
