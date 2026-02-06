import { Logger } from '@cyberutopian/logger';
import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ora from 'ora';
import ts from 'typescript';

export const getTsDefaultObj = (customConfigPath: string) => {
  const exist = fs.existsSync(customConfigPath);
  if (!exist) {
    Logger.error(`生成失败，请检查 ${chalk.yellow(customConfigPath)} 是否存在`);
    process.exit(-1);
  }

  const data = fs.readFileSync(customConfigPath, 'utf-8');
  const sourceFile = ts.createSourceFile('config.ts', data, ts.ScriptTarget.Latest, true);

  let objectLiteralContent = '';

  function extractDefaultObject(node: any) {
    if (ts.isExportAssignment(node) && node.expression && ts.isObjectLiteralExpression(node.expression)) {
      objectLiteralContent = node.expression.getText();
    }

    ts.forEachChild(node, extractDefaultObject);
  }

  extractDefaultObject(sourceFile);

  if (!objectLiteralContent) {
    Logger.error('未找到默认导出的对象');
    process.exit(-1);
  }

  try {
    // 使用 vm 模块安全执行代码
    const result = vm.runInNewContext(`(${objectLiteralContent})`);
    return result;
  } catch (error) {
    Logger.error('解析对象失败:', error);
    process.exit(-1);
  }
};

// spinning
export const spinner = (text: string = '操作中...') =>
  ora({
    text: `typings: ${text}`,
    color: 'yellow',
    spinner: {
      interval: 80, // Optional
      frames: ['-', '\\', '|', '/', '-'],
    },
  });

export const isAscending = (a: string, b: string) => {
  if (a > b) {
    return 1;
  }
  if (b > a) {
    return -1;
  }
  return 0;
};

export const getConfigFile = () => {
  const configPath = path.resolve(process.cwd(), 'patcher.config.json');
  return require(configPath);
};

export const isMatchWholeWord = (stringToSearch: string, word: string) => {
  return new RegExp('\\b' + word + '\\b').test(stringToSearch);
};

export const majorVersionsCheck = (expectedV: string, inputV?: string) => {
  if (!inputV) {
    throw new Error(
      `Swagger-Typescript working with openApi v3/ swagger v2, seem your json is not openApi openApi v3/ swagger v2`,
    );
  }

  const expectedVMajor = expectedV.split('.')[0];
  const inputVMajor = inputV.split('.')[0];
  function isValidPart(x: string) {
    return /^\d+$/.test(x);
  }
  if (!isValidPart(expectedVMajor) || !isValidPart(inputVMajor)) {
    throw new Error(
      `Swagger-Typescript working with openApi v3/ swagger v2 your json openApi version is not valid "${inputV}"`,
    );
  }

  const expectedMajorNumber = Number(expectedVMajor);
  const inputMajorNumber = Number(inputVMajor);

  if (inputMajorNumber >= expectedMajorNumber) {
    return;
  }

  throw new Error(`Swagger-Typescript working with openApi v3/ swagger v2 your json openApi version is ${inputV}`);
};

export const replaceSpecialChars = (str: string) => str.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
