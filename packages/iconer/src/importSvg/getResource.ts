import * as fs from "fs";
import axios from "axios";
import { exitFn, Log, spinner } from "./utils";

/**
 *
 * @param resourcePath 资源地址
 * @returns 资源内容
 */
export const getResource = async (
  resourcePath: string
): Promise<string | undefined> => {
  const Spin = spinner("资源获取中请稍后...").start();
  try {
    let data = "";
    if (resourcePath.includes("://")) {
      // 线上地址
      const res = await axios.get(resourcePath, {});
      data = res?.data;
    } else {
      // 本地地址
      data = fs.readFileSync(resourcePath, "utf8");
    }
    Spin.succeed("资源获取完毕");
    return data;
  } catch (e) {
    Spin.fail("资源获取失败");
    exitFn({ msg: `读取文件错误：${e}` });
  }
};

/**
 * 获取资源map值
 */
export const getResourceMap = async (resourcePath: string) => {
  try {
    if (!resourcePath) {
      exitFn({
        msg: "resourcePath 地址不存在，请先执行 `-p --resourcePath <path>`",
      });
    }

    const content = await getResource(resourcePath);
    if (!content) {
      Log.error("获取资源内容为空！");
      return;
    }

    let result: Record<string, any> = {};
    const r = content.match(/(<symbol.+?symbol>)/g);
    r?.forEach((item: string, index: number) => {
      // const rMap = item.match(/<symbol.*id=\".*ic_(.+?)\".*(<path.*path>)/);
      const rMap = item.match(/<symbol.*id=\"(.*?)\".*(<path.*path>)/);
      // const key = rMap?.[1];
      // const value = rMap?.[2];
      const [, key, value] = rMap || [];
      if (key && value) {
        if (!result[key]) {
          result[key] = value;
        } else {
          Log.error(`${key}重复，请检查；`);
        }
      }
    });
    Log.info(`共扫描出${Object.keys(result).length}个svg`);
    return result;
  } catch (e) {
    exitFn({ msg: `获取资源map错误：${e}` });
  }
};
