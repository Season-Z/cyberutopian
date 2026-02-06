import { specificType } from './config';
import { ColorTyp, FormatOutputType, RadiusType, TypographyType } from './interface';

const wrapperESM = (data: string[], id: string) => {
  const dataString = data.join(',');

  return `export const ${id} = {
    ${dataString}
  }`;
};

const wrapperConst = (data: string[], id: string) => {
  const dataString = data.join(',');

  return `export const ${id}Enums = {
    ${dataString}
  }`;
};

export const formatColor = (data: Record<string, ColorTyp>) => {
  if (!data) return { sass: '', tailwind: '', enums: '' };
  const keys = Object.keys(data);

  const d = keys.reduce(
    (pre: FormatOutputType, next: string) => {
      const value = data[next];
      const sa = `$${next}: ${value.hex}`;
      const tail = `'${next}': '${value.hex}'`;
      const en = `'${next}': '${value.hex}'`;
      const cls = `.${next} { color: ${value.hex} }`;

      return {
        sass: pre.sass.concat(sa),
        tailwind: pre.tailwind.concat(tail),
        enums: pre.enums.concat(en),
        colorCls: pre.colorCls?.concat(cls),
      };
    },
    { sass: [], tailwind: [], enums: [], colorCls: [] },
  );

  return {
    sass: d.sass.join(';'),
    colorCls: d.colorCls?.join(';') || '',
    tailwind: wrapperESM(d.tailwind, specificType.color),
    enums: wrapperConst(d.enums, specificType.color),
  };
};

export const formatTypography = (data: Record<string, TypographyType>) => {
  if (!data) return { sass: '', tailwind: '', enums: '' };
  const keys = Object.keys(data);

  const d = keys.reduce(
    (pre: FormatOutputType, next: string) => {
      const value = data[next];

      const size = value['font-size'].value;
      // 字体类型中存在 title 则需要设置 500 的字重，text 则为400
      const weight = next.includes('title') ? 500 : 400;
      // 类名称
      const name = next;

      const lineHeight = value['line-height'].value ? `${value['line-height'].value}px` : value['line-height'].value;

      const map = {
        'font-family': value['font-family'].value,
        'font-size': `${size}px`,
        'font-weight': weight?.toString(),
        'letter-spacing': value['letter-spacing'].value,
        'line-height': lineHeight,
      };

      const jsMap = {
        fontFamily: value['font-family'].value,
        fontSize: `${size}px`,
        fontWeight: weight?.toString(),
        letterSpacing: value['letter-spacing'].value?.toString(),
        lineHeight: lineHeight,
      };

      const mapString = JSON.stringify(map);
      const jsMapString = JSON.stringify(jsMap);

      const sa = `.${name} ${mapString}`;
      const en = `'${name}': ${jsMapString}`;
      const tail = `'.${name}': ${jsMapString}`;

      return {
        sass: pre.sass.concat(sa),
        tailwind: pre.tailwind.concat(tail),
        enums: pre.enums.concat(en),
      };
    },
    { sass: [], enums: [], tailwind: [] },
  );

  return {
    sass: d.sass.join(';'),
    tailwind: wrapperESM(d.tailwind, specificType.typography),
    enums: wrapperConst(d.enums, specificType.typography),
  };
};

export const formatRadius = (data: Record<string, RadiusType>) => {
  if (!data) return { sass: '', tailwind: '', enums: '' };
  const keys = Object.keys(data);

  const d = keys.reduce(
    (pre: FormatOutputType, next: string) => {
      const value = data[next];
      const key = next
        .split('-')
        .reduce((pre, ne, k) => (pre.includes(ne) ? pre : `${pre}${k === 0 ? '' : '-'}${ne}`), '');

      const ds = value.radius.map((v) => `${v}px`).join(' ');

      const radiusJS = { borderRadius: ds };
      const radiusJsString = JSON.stringify(radiusJS);

      const sa = `.${key} { border-radius: ${ds} }`;
      const tail = `'.${key}': ${radiusJsString}`;
      const en = `'${key}': ${radiusJsString}`;

      return {
        sass: pre.sass.concat(sa),
        tailwind: pre.tailwind.concat(tail),
        enums: pre.enums.concat(en),
      };
    },
    { sass: [], enums: [], tailwind: [] },
  );

  return {
    sass: d.sass.join(';'),
    tailwind: wrapperESM(d.tailwind, specificType.radius),
    enums: wrapperConst(d.enums, specificType.radius),
  };
};
