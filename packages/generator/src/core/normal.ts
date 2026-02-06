import { clearAgrv } from '@/controller/clear-agrv';
import execute from '@/controller/execute';
import fetcher from '@/controller/fetcher';
import fs from 'node:fs';
import ora from 'ora';
import prettier from 'prettier';

export const normal = async (name: string, dir: string, other?: (name: string, dir: string) => Promise<void>) => {
  clearAgrv();
  const done = await fetcher(`template/${name}`, dir);
  if (!done) {
    throw 'out';
  }

  const spinner = ora('优化项目内容...\n');
  spinner.start();

  console.log(`${process.cwd()}/${dir}`);
  await execute('rm', ['-rf', '.git'], { cwd: `${process.cwd()}/${dir}` });

  const path = `${process.cwd()}/${dir}/package.json`;
  const pkg = require(path);
  const content = {
    ...pkg,
    name: dir,
  };

  fs.writeFileSync(path, await prettier.format(JSON.stringify(content), { parser: 'json' }));

  await other?.(name, dir);

  spinner.succeed('优化成功!');
};
