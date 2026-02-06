import { replaceSpecialChars } from '@/utils';

export const entry = (tasks: PromiseSettledResult<unknown>[]) => {
  const imports = tasks.map((v: any) => {
    const name = replaceSpecialChars(v.value.name);
    return `import { createFetch as createFetch_${name}, createHookFetch as createHookFetch_${name} } from './services-${name}';\n`;
  });
  const modules = tasks.map((v: any) => {
    const name = replaceSpecialChars(v.value.name);
    return `const syFetch_${name} = createFetch_${name}();\n const useSyFetch_${name} = createHookFetch_${name}();\n`;
  });
  const combineFn = tasks.map((v: any) => `...syFetch_${replaceSpecialChars(v.value.name)},`);
  const combineHook = tasks.map((v: any) => `...useSyFetch_${replaceSpecialChars(v.value.name)},`);

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
