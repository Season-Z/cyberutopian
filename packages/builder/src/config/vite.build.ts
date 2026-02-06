import vue from '@vitejs/plugin-vue';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { mergeConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { CLI_ARGS_OBJ, PROJECT_ROOT, getCustomConfig } from './base';
import { getCommonConfig } from './vite.common';

const plugins: any[] = [
  vue(),
  dts({
    entryRoot: path.resolve(PROJECT_ROOT, './src'),
    compilerOptions: {
      skipDefaultLibCheck: false,
    },
    beforeWriteFile: (filePath: string, content: string) => {
      return {
        filePath: filePath.replace('core/', ''),
        content: content.replace(/core\//g, ''),
      };
    },
  }),
];

if (CLI_ARGS_OBJ.analyze) {
  plugins.push(
    visualizer({
      open: true,
    }) as any,
  );
}
// https://vitejs.dev/config/
export const buildConfig = async function () {
  const CUSTOM_CONFIG = await getCustomConfig();
  const commonConfig = await getCommonConfig();

  const config = mergeConfig(commonConfig, {
    mode: 'production',
    configFile: false,
    build: {
      watch: CLI_ARGS_OBJ.watch ?? false,
    },
    plugins: plugins,
  });
  const finalConfig = mergeConfig(config, CUSTOM_CONFIG?.vite || {});
  return finalConfig;
};
