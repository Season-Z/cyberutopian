import { reactIndexFile, indexStyle, pathFile, configFile, preview } from "./template";

// 缓存路径的文件地址
export const configPath = "./package.json";

// 默认的icon资源地址（ide和developer）
export const defaultOriginPathMap = {
  ide: "https://at.alicdn.com/t/c/font_3325623_wwvul9sxt1.js",
  // "developer": "https://at.alicdn.com/t/font_3199962_1yexn2592v2.js",
};

export const createIconFiles: Record<string, any> = {
  "index.tsx": reactIndexFile,
  "index.less": indexStyle,
  "path.tsx": pathFile,
  "config.json": configFile(defaultOriginPathMap),
  "preview.html": preview(),
};
