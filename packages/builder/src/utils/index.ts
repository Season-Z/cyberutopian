import fs from 'fs-extra';
import ts from 'typescript';

export function getTsDefaultObj(customConfigPath: string) {
  const result: any = {};

  const data = fs.readFileSync(customConfigPath, 'utf-8');
  const sourceFile = ts.createSourceFile('config.ts', data, ts.ScriptTarget.Latest, true);

  function extractDefaultObject(node: any) {
    if (ts.isExportAssignment(node) && node.expression && ts.isObjectLiteralExpression(node.expression)) {
      // 提取对象字面量
      const objectLiteral = node.expression;

      // 遍历对象字面量的属性
      objectLiteral.properties.forEach((prop) => {
        if (ts.isPropertyAssignment(prop)) {
          const key = prop.name.getText(); // 获取属性名
          const value = prop.initializer.getText(); // 获取属性值

          // 将属性值去掉引号
          result[key] = value.replace(/^['"]|['"]$/g, '');
        }
      });
    }

    // 递归遍历 AST 树
    ts.forEachChild(node, extractDefaultObject);
  }

  // 开始从 AST 树中提取对象
  extractDefaultObject(sourceFile);

  return result;
}
