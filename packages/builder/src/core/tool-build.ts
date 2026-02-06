import esbuild from 'esbuild';
import fs from 'fs-extra';
import keys from 'lodash/keys';
import { BuildScriptConfig, defaultConfigPath, PROJECT_ROOT } from '../config/base';
import { getTsDefaultObj } from '../utils';

const argv = require('yargs-parser')(process.argv.slice(2));
const packageJson = require('../../package.json');

async function buildFormat(cfg: BuildScriptConfig) {
  try {
    console.log('building %s...', cfg.libName);
    const config: esbuild.BuildOptions = {
      entryPoints: cfg.entry ? [cfg.entry] : ['src/index.ts'],
      outfile: `dist/index.js`,
      bundle: true,
      platform: 'node',
      target: ['node10'],
      format: 'cjs',
      sourcemap: true,
      sourcesContent: true,
      define: {},
      treeShaking: true,
      external: keys(packageJson.dependencies),
      minify: false,
      legalComments: 'external',
    };

    if (argv.watch) {
      config.watch = {
        onRebuild(error, result) {
          if (error) console.error('watch build failed:', error);
          else console.log('watch build succeeded:', result);
        },
      };
    }
    const startTime = Date.now();
    const result = await esbuild.build(config);
    if (result.errors.length > 0) {
      throw result.errors;
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach((warnings) => {
        console.warn(warnings);
      });
    }

    console.log('built %s in %ds', ((Date.now() - startTime) / 1000).toFixed(2));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

export async function toolBuild() {
  const customConfigPath = !fs.pathExistsSync(defaultConfigPath)
    ? `${PROJECT_ROOT}/builder.config.ts`
    : defaultConfigPath;

  const result = getTsDefaultObj(customConfigPath);

  buildFormat(result);
}
