import { Logger } from '@cyberutopian/logger';
import chalk from 'chalk';
import { OptionValues } from 'commander';
import inquirer from 'inquirer';
import { generatePackage } from './core/package';
import { generateProject } from './core/project';
import { generateView } from './core/view';

const genProject = async (optionType: string) => {
  const { ok } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ok',
      message: `是否生成在当前目录(${chalk.blueBright(process.cwd())})下？`,
    },
  ]);

  if (!ok) {
    Logger.info('请在期望的目录下再次执行');
    process.exit(-1);
  }

  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '请输入名称(以-分隔)',
    },
  ]);

  if (optionType === 'vue3') {
    await generateProject(optionType, name);
  }

  if (optionType === 'packages') {
    await generatePackage(optionType, name);
  }

  Logger.success('成功生成，目录：');
  Logger.success(`${process.cwd()}/${name}`);
};

const run = async (options: OptionValues) => {
  try {
    const keys = Object.keys(options);

    let optionType = keys[0];
    if (!keys.length) {
      const { type } = await inquirer.prompt([
        {
          type: 'list',
          name: 'type',
          message: '请选择要生成的内容',
          choices: [
            {
              value: 'vue3',
              name: 'vue3工程',
            },
            {
              value: 'packages',
              name: 'package工程',
            },
            {
              value: 'view',
              name: 'vue3页面',
            },
            {
              value: 'main-sub',
              name: '主子表页面',
            },
          ],
        },
      ]);

      optionType = type;
    }

    // 应用生成
    if (optionType === 'vue3' || optionType === 'packages') {
      return await genProject(optionType);
    }

    if (optionType === 'view' || optionType === 'main-sub') {
      return await generateView(optionType);
    }
  } catch (error) {
    // @ts-ignore
    Logger.error(error);
    process.exit(-1);
  }
};

export default run;
