import path from 'node:path';
import { build, defineConfig, mergeConfig } from 'vite';
import { PROJECT_ROOT, getCustomConfig } from '../config/base';
import { buildConfig } from '../config/vite.build';
import packageBuilder from '../plugins/package-builder';

export const subBundle = async () => {
  const config = await getCustomConfig();
  const baseConfig = await buildConfig();
  const finalConfig = mergeConfig(
    baseConfig,
    defineConfig({
      publicDir: 'public',
      build: {
        rollupOptions: {
          output: {
            entryFileNames: '[name]/index.js',
            chunkFileNames: 'helps/[name]-[hash].js',
            assetFileNames: () => 'asset/[name]-[hash].[ext]',
          },
        },
      },
      plugins: [
        packageBuilder({
          entry: config!.entry,
          outputDir: 'dist',
          assetDir: 'asset',
        }),
      ],
    }),
  );

  console.log('start to build .....');
  await build(finalConfig);

  path.resolve(PROJECT_ROOT, 'dist');
  console.log('build finished.');
};
