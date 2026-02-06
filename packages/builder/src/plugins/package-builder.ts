import fs from 'fs/promises';
import path from 'path';
import { mergeConfig, PluginOption } from 'vite';

export interface PackageBuilderOptions {
  entry: string;
  outputDir: string;
  assetDir: string;
}

const packageBuilder = (options: PackageBuilderOptions): PluginOption => {
  const { entry = 'src/index.js', outputDir = 'dist', assetDir = 'asset' } = options || {};

  let inputs: Record<string, string> = {};
  return {
    name: 'package-builder',
    async buildStart() {
      this.addWatchFile(path.resolve(entry));
    },
    async config(config) {
      const entryFile = path.resolve(entry);
      const entryContent = await fs.readFile(entryFile, 'utf-8');
      const imports = entryContent.match(/(import|export)\s+.*?\s+from\s+['"](.*?)['"]/g) || [];

      for (const importStatement of imports) {
        const importExportRegex = /(import|export)\s+(?:[\w*\s{},]+?\s+from\s+)?['"]([^'"]+)['"]/g;
        const importPath = importExportRegex.exec(importStatement)?.[2];

        const importFullPath = path.resolve(path.dirname(entryFile), `${importPath}/index.tsx`);

        const importPathArr = importPath!.split('/');

        inputs = {
          ...inputs,
          [importPathArr[importPathArr.length - 1]]: importFullPath,
        };
      }

      return mergeConfig(config, {
        build: {
          rollupOptions: {
            input: { index: entry, ...inputs },
          },
        },
      });
    },
    async writeBundle(_, bundle) {
      const bundleKeys = Object.keys(bundle);

      const assets = bundleKeys
        .filter((v) => v.startsWith(assetDir) && v.endsWith('.css'))
        .map((v) => `import './${v}';\n`);

      const indexPath = bundleKeys.find((v) => v.includes('index/'));

      const entryContent = await fs.readFile(path.resolve(outputDir, indexPath!), 'utf-8');

      const outputContent = `${assets.toString().replace(/,/g, '')}\n${entryContent.replace(/\.\.\//g, './')}`;

      await fs.writeFile(path.resolve(outputDir, 'index.js'), outputContent, 'utf-8');
      await fs.rm(path.resolve(outputDir, 'index'), {
        recursive: true,
        force: true,
      });
    },
  };
};

export default packageBuilder;
