import * as fs from "fs";
import inquirer from "inquirer";
import { configPath } from "../config";
import { exitFn, getIconFiles, getPackageJson, Log } from "../utils";
import chalk from "chalk";
import { frameworkChoices } from "./constant";

export interface IconInitType {
  framework: string;
  path: string;
}

export const iconInit = async (data: IconInitType) => {
  let { framework, path = "./src/icon" } = data;

  try {
    if (!framework) {
      const { iconFramework } = await inquirer.prompt([
        {
          type: "list",
          message: `${chalk.green("请选择icon的组件类型")}`,
          name: "iconFramework",
          default: "vue3",
          prefix: "👉",
          choices: frameworkChoices,
        },
      ]);
      framework = iconFramework;
    }

    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    } else {
      exitFn({ msg: `${path}已存在` });
    }
    // 配置缓存起来
    if (fs.existsSync(configPath)) {
      const data = getPackageJson("project");
      data.iconConfigPath = path;
      fs.writeFileSync(configPath, JSON.stringify(data, null, "\t"));
    } else {
      exitFn({ msg: `configPath 不存在，请先执行 init` });
    }

    const iconFiles = getIconFiles(framework);
    // 写入文件
    Object.keys(iconFiles).forEach((it) => {
      const filePath = `${path}/${it}`;
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, iconFiles[it]);
      }
    });

    Log.success(`初始化成功，文件路径：${path}`);
  } catch (err) {
    Log.error(`${err}`);
  }
};
