import { replaceSpecialChars } from '@/utils';

export type EntryTask = {
  name: string;
  importPath?: string;
};

export const entry = (tasks: EntryTask[]) => {
  const imports = tasks.map(({ name: _name, importPath }) => {
    const name = replaceSpecialChars(_name);
    return `import { createFetch as createFetch_${name}, createHookFetch as createHookFetch_${name} } from '${importPath || `./services-${name}`}';\n`;
  });
  const modules = tasks.map(({ name: _name }) => {
    const name = replaceSpecialChars(_name);
    return `const syFetch_${name} = createFetch_${name}();\n const useSyFetch_${name} = createHookFetch_${name}();\n`;
  });
  const combineFn = tasks.map(
    ({ name }) => `...syFetch_${replaceSpecialChars(name)},`,
  );
  const combineHook = tasks.map(
    ({ name }) => `...useSyFetch_${replaceSpecialChars(name)},`,
  );

  return `
    /**
    * 该文件为自动生成，尽量别修改
    *
    * @version ${6}
    */
    ${imports.join('')}
    ${modules.join('')}
    const fetchService = { ${combineFn.join('')} };
    const useFetchService = {${combineHook.join('')}}

    export { fetchService, useFetchService };
  `;
};
