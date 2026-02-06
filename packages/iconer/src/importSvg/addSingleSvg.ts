import { updatePaths } from "./updatePaths";
import { getResourceMap } from "./getResource";
import { getOriginPath, Log } from "./utils";

export const addSingleSvg = async (iconNames: string[] = []) => {
  try {
    const originPath = await getOriginPath();

    // 获取icon资源
    let iconsMap: Record<string, any> = {};
    const resourceMap = await getResourceMap(originPath as string);
    if (resourceMap) {
      Object.keys(resourceMap).forEach((key: string) => {
        if (iconNames.includes(key)) {
          iconsMap[key] = resourceMap[key];
        }
      });
    }
    
    // 修改path文件
    updatePaths({ newIconNames: iconNames, newIconsMap: iconsMap });
  } catch (error) {
    Log.error(`${error}`);
  }
};
