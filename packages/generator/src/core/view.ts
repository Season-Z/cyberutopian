import { Logger } from '@cyberutopian/logger';
import inquirer from 'inquirer';
import fs from 'node:fs';
import path from 'node:path';

export const generateView = async (typeName: string) => {
  if (!fs.existsSync(`${process.cwd()}/src/views`)) {
    Logger.error(`不存在目录：${process.cwd()}/src/views，请在项目根目录下执行`);
    process.exit(-1);
  }

  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '请输入文件夹名称(以-分隔)',
    },
  ]);

  if (!name) {
    Logger.error(`请输入名称`);
    process.exit(-1);
  }

  const templateDir = path.join(__dirname, `../src/templates/${typeName}`);

  if (!fs.existsSync(templateDir)) {
    Logger.error(`模板目录不存在：${templateDir}`);
    process.exit(-1);
  }

  const copyDirSync = (src: string, dest: string) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      entry.isDirectory() ? copyDirSync(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
    }
  };

  copyDirSync(templateDir, `${process.cwd()}/src/views/${name}`);

  Logger.success('页面成功生成，目录：');
  Logger.success(`${process.cwd()}/src/views/${name}`);

  // 更新路由
  const filePath = path.join(process.cwd(), 'src/router/routes.ts');
  const content = fs.readFileSync(filePath, 'utf-8');
  const newRoute = `  { path: '/${name}', component: () => import('@/views/${name}/index.vue') },`;
  const lastRouteIndex = findLastRouteIndex(content);

  if (lastRouteIndex !== -1) {
    const newContent = content.slice(0, lastRouteIndex) + newRoute + '\n  ' + content.slice(lastRouteIndex);

    // 写回文件
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log('路由添加成功！');
  } else {
    console.error('未找到路由数组位置');
  }

  // 辅助函数：找到插入位置（最后一个路由项的结束位置）
  function findLastRouteIndex(content: string) {
    // 匹配路由数组中的项（包括注释）
    const routeRegex = /(\s*\{\s*path\s*:.+?\},?\s*)|(\s*\/\/.+)/g;

    let match;
    let lastIndex = -1;

    while ((match = routeRegex.exec(content)) !== null) {
      lastIndex = match.index + match[0].length;
    }

    return lastIndex;
  }

  Logger.success('路由更新完成🔥');
};
