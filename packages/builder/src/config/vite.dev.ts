import path from 'path';
import { mergeConfig } from 'vite';
import { getCustomConfig } from './base';
import { getCommonConfig } from './vite.common';

// https://vitejs.dev/config/
export const devConfig = async () => {
  const CUSTOM_CONFIG = await getCustomConfig();
  const commonConfig = await getCommonConfig();

  const config = mergeConfig(commonConfig, {
    mode: 'development',
    configFile: false,
    server: {
      port: 3000,
    },
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
  });
  return mergeConfig(config, CUSTOM_CONFIG?.vite || {});
};
