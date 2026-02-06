import * as fs from "fs";
import { updatePreview } from "./updatePreview";
import { getPackageJson, Log, exitFn } from "./utils";
import path from "path";

interface Props {
  newIconNames?: string[];
  newIconsMap: Record<string, string>;
}

export const updatePaths = ({ newIconNames, newIconsMap }: Props) => {
  const { iconConfigPath } = getPackageJson("project");
  if (iconConfigPath) {
    let newContent = "";
    const oldContent = fs.readFileSync(`${iconConfigPath}/path.tsx`, "utf8");
    const oldKeys = oldContent.match(/(?<=").+?(?=":)/g);
    const iconsKeysArr = Object.keys(newIconsMap);

    if (newIconNames && newIconNames?.length !== iconsKeysArr.length) {
      const noAddIcons = newIconNames?.filter((it) => !iconsKeysArr.includes(it));
      Log.error(`【${noAddIcons?.join(", ")}】添加失败，请检查！`);
    }

    if (!iconsKeysArr.length) {
      Log.error("icon添加列表为空！");
      return;
    }

    newContent = "";
    iconsKeysArr.forEach((item) => {
      if (oldKeys?.includes(item)) {
        Log.warn(`【${item}】已经存在`);
        return;
      }
      newContent += `\t"${item}": ${newIconsMap[item]},\n`;
    });
    newContent = `export default {${newContent}}`;

    const iconPath = `${path.join(process.cwd(), iconConfigPath)}/path.tsx`;
    fs.writeFileSync(iconPath, newContent);

    // 更新预览文件
    updatePreview();
  } else {
    exitFn({ msg: `配置未找到，请先执行 init` });
  }
};
