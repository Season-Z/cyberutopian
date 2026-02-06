export interface ColorTyp {
  hex: string;
  rgba: string;
  type: 'color';
}

export interface TypographyType {
  'font-family': {
    value: string;
  };
  'font-size': {
    value: number;
  };
  weight: {
    value: number;
  };
  'letter-spacing': {
    value: number | string;
  };
  'line-height': {
    value: number;
  };
  type: 'typography';
}

export interface RadiusType {
  radius: string[];
}

export interface FormatOutputType {
  /** @param css类 */
  colorCls?: string[];
  sass: string[];
  tailwind: string[];
  enums: string[];
}
