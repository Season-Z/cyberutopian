import fs from 'node:fs';
import prettier from 'prettier';
import { normal } from './normal';

const formatPkg = async (path: string, dir: string) => {
  const pkg = require(path);
  const pkgStr = JSON.stringify(pkg).replace(/dfs/g, dir);
  await fs.writeFileSync(path, await prettier.format(pkgStr, { parser: 'json' }));
};

const formatFlow = async (name: string, dir: string) => {
  const rootPkg = `${process.cwd()}/${dir}/package.json`;
  const childPkg = `${process.cwd()}/${dir}/packages/demo/package.json`;
  const ts = `${process.cwd()}/${dir}/tsconfig.json`;

  Promise.all([formatPkg(rootPkg, dir), formatPkg(childPkg, dir), formatPkg(ts, dir)]);
};

export const generatePackage = async (name: string, dir: string) => {
  await normal(name, dir, formatFlow);
};
