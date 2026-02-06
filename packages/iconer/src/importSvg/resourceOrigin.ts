import * as fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";
import { exitFn, getIconConfig, Log } from "./utils";

/**
 *
 * @param originStringArr [key=value];
 */
export const parseOriginArr = (originStringArr: string[]) => {
  const originMap: Record<string, any> = {};

  originStringArr.forEach((it) => {
    if (!it.includes("=")) {
      exitFn({ msg: "参数格式错误" });
    }
    const [key, value] = it.split("=");
    originMap[key] = value;
  });
  return originMap;
};

/**
 *
 * @param originStringArr [key=value];
 */
export const setOrigin = async (originStringArr: string[]) => {
  try {
    const originMap = parseOriginArr(originStringArr);

    // 更新icon配置文件
    const { filePath: configPath, content } = getIconConfig() || {};

    if (configPath && content) {
      const origin = content?.origin || {};
      const _content = { ...content, origin: { ...origin, ...originMap } };
      const coincide = Object.keys(origin).filter((it: string) => Object.keys(originMap).includes(it));

      // 有交集
      if (coincide.length) {
        const { replace } = await inquirer.prompt([
          {
            type: "confirm",
            message: `[${chalk.green(coincide.join(", "))}] 已存在，是否替换？`,
            name: "replace",
            default: false,
          },
        ]);

        if (replace) {
          fs.writeFileSync(configPath, JSON.stringify(_content, null, "\t"));
          Log.success("设置成功！");
        } else {
          Log.info("已取消！");
        }
      } else {
        fs.writeFileSync(configPath, JSON.stringify(_content, null, "\t"));
        Log.success("设置成功！");
      }
    }
  } catch (error) {
    exitFn({ msg: error as string });
  }
};

/**
 *
 * @param originKeyArr string[]
 */
export const delOrigin = (originKeyArr: string[]) => {
  try {
    // 更新icon配置文件
    const { filePath: configPath, content } = getIconConfig() || {};
    const origin = content?.origin || {};

    if (configPath && content) {
      originKeyArr.forEach((originKey) => {
        if (origin[originKey]) {
          delete origin[originKey];
          Log.success(`【${originKey}】删除成功！`);
        } else {
          Log.error(`要删除的源【${originKey}】不存在，请确认！`);
        }
      });
      const _content = { ...content, origin };
      fs.writeFileSync(configPath, JSON.stringify(_content, null, "\t"));
    }
  } catch (error) {
    exitFn({ msg: error as string });
  }
};

/**
 * 查看origin资源列表
 */
export const showOrigin = () => {
  try {
    const { content } = getIconConfig() || {};
    const origin = content?.origin || {};
    const printDatas = Object.keys(origin).map((key) => {
      return { key, origin: origin[key] };
    });
    console.table(printDatas);
  } catch (error) {
    exitFn({ msg: error as string });
  }
};
