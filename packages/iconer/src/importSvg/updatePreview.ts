import * as fs from "fs";
import { preview } from "../template";
import { exitFn, getPackageJson } from "./utils";

export const updatePreview = () => {
  try {
    const { iconConfigPath } = getPackageJson("project");
    const pathContent = fs.readFileSync(`${iconConfigPath}/path.tsx`, "utf8");
    const pathsMap: Record<string, string> = {};
  
    pathContent.match(/["'].+["']:\s*<.*>/g)?.forEach((it) => {
      const iArr = it.match(/["'](.+)["']:\s*(<.*>)/);
      // const key = rMap?.[1];
      // const value = rMap?.[2];
      const [, key, value] = iArr || [];
      key && value && (pathsMap[key] = value);
    });
  
    const previewTem = preview(pathsMap);
    fs.writeFileSync(`${iconConfigPath}/preview.html`, previewTem);
  } catch (error) {
    exitFn({ msg: error as string });
  }
};
