import * as fs from "fs";
import * as path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import ora from "ora";
import logSymbols from "log-symbols";
import { configPath } from "../config";

export function firstUpper(str: string) {
  return str
    .toLowerCase()
    .replace(/( |^)[a-z]/g, (L: string) => L.toUpperCase());
}

// 读取cli中的packagejson 和 工程中的packagejson
export function getPackageJson(
  type: "cli" | "project" = "cli"
): Record<string, any> {
  try {
    const paths =
      type === "cli"
        ? path.join(__dirname, "../../package.json")
        : path.join(process.cwd(), configPath);

    return JSON.parse(fs.readFileSync(paths, "utf8"));
  } catch (error) {
    Log.error(`${error}`);
    return {};
  }
}

// 获取icon的config数据
export function getIconConfig():
  | { filePath: string; fileName: string; content: any }
  | undefined {
  try {
    const fileName = "config.json";
    const { iconConfigPath } = getPackageJson("project");

    if (!iconConfigPath) {
      exitFn({ msg: "配置未找到，请先执行 `-i --init [path]`" });
    }

    const _path = path.join(process.cwd(), `${iconConfigPath}/${fileName}`);
    // 判断icon文件是否存在
    fs.access(_path, fs.constants.F_OK, (error) => {
      error && exitFn({ msg: `${_path}不存在，请先执行 '-i --init [path]'` });
    });

    return {
      filePath: _path,
      fileName: fileName,
      content: JSON.parse(fs.readFileSync(_path, "utf8")),
    };
  } catch (error) {
    Log.error(`${error}`);
  }
}

// 人机交互获取需要导入资源路径
export const getOriginPath = async () => {
  try {
    const { content } = getIconConfig() || {};
    const { origin: originMap } = content || {};

    // 读取配置文件的资源路径；
    let originKey = "";
    let originPath = "";
    const selectList = Object.keys(originMap) || [];

    if (selectList.length === 1) {
      originKey = selectList[0];
      originPath = originMap[originKey];
    } else if (selectList.length > 1) {
      const { selectKey } = await inquirer.prompt([
        {
          type: "list",
          message: `${chalk.green("当前存在多个资源路径，请选择添加的origin")}`,
          name: "selectKey",
          default: "ide",
          prefix: "👉",
          choices: selectList,
        },
      ]);
      originKey = selectKey;
    }
    originPath = originMap[originKey];
    
    if (!originPath) {
      exitFn({
        msg: `配置文件中${originKey || ""}资源路径不存在，请设置资源地址`,
      });
    }
    return originPath;
  } catch (error) {
    exitFn({ msg: error as string });
  }
};

// log
export const Log = {
  success: (s: string) => console.log(logSymbols.success, chalk.green(`${s}`)),
  warn: (s: string) => console.log(logSymbols.warning, chalk.yellow(`${s}`)),
  error: (s: string) => console.log(logSymbols.error, chalk.red(`${s}`)),
  info: (s: string) => console.log(logSymbols.info, chalk.blue(`${s}`)),
};

// spinning
export const spinner = (text: string = "操作中...") =>
  ora({
    text: text,
    color: "yellow",
    spinner: {
      interval: 80, // Optional
      frames: ["-", "\\", "|", "/", "-"],
    },
  });

// 异常进程退出
export const exitFn = ({ code = 0, msg = "" }) => {
  Log.error(`${msg || "未知错误"}`);
  process.exit(code);
};
