import fs from 'fs-extra';
import path from 'path';
import { LibraryOptions, UserConfig, loadConfigFromFile } from 'vite';
import argv from 'yargs-parser';

const cliArgs: {
  dev: boolean;
  build: boolean;
  watch: boolean;
  analyze: boolean;
  subBundle: boolean;
  tool: boolean;
} = argv(process.argv.slice(2)) as any;

export const CLI_ARGS_OBJ = cliArgs;

export const PROJECT_ROOT = path.resolve(process.cwd());

export const defaultConfigPath = `${PROJECT_ROOT}/builder.config.js`;

export const customConfigPath = !fs.pathExistsSync(defaultConfigPath)
  ? `${PROJECT_ROOT}/builder.config.ts`
  : defaultConfigPath;

export type BuildScriptConfig = {
  /** @param 分包时，核心代码的入口 */
  core?: string;
  libMode?: boolean;
  entry: string;
  libName?: string;
  fileName?: string;
  external?: string[];
  global?: Record<string, string>;
  formats?: LibraryOptions['formats'];
  vite?: UserConfig;
};

export let CUSTOM_CONFIG: BuildScriptConfig = null as any;
export const isBuild = !!process.env.VITE_TEST_BUILD;

export const getCustomConfig = async () => {
  if (CUSTOM_CONFIG) {
    return CUSTOM_CONFIG;
  }

  if (fs.pathExistsSync(customConfigPath)) {
    const customConfig = await loadConfigFromFile({} as any, customConfigPath, PROJECT_ROOT);
    CUSTOM_CONFIG = customConfig?.config as BuildScriptConfig;
    return customConfig?.config as BuildScriptConfig;
  }
};
