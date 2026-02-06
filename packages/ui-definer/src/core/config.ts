/** 默认写死shadow的规范 */
export const shadowSpecific = {
  sass: `
      .shadow-dialog {
        box-shadow: 0px 4px 10px 2px rgba(0, 0, 0, 0.1);
      }
      .shadow-floating {
        box-shadow: 0px 8px 26px 4px rgba(0, 0, 0, 0.1);
      }
  `,
  enums: `
    export const shadowEnums = {
      'shadow-dialog': {
        boxShadow: '0px 4px 10px 2px rgba(0, 0, 0, 0.1)',
      },
      'shadow-floating': {
        boxShadow: '0px 8px 26px 4px rgba(0, 0, 0, 0.1)',
      },
    };
  `,
  tailwind: `
    export const shadow = {
      '.shadow-dialog': {
        boxShadow: '0px 4px 10px 2px rgba(0, 0, 0, 0.1)',
      },
      '.shadow-floating': {
        boxShadow: '0px 8px 26px 4px rgba(0, 0, 0, 0.1)',
      },
    };
  `,
};

// ui 规范的枚举类型
export const specificType = {
  color: 'colors',
  typography: 'typography',
  utils: 'utils',
  radius: 'radius',
};
