export const reactIndexFile = `import React from 'react'
// import * as paths from './path.js'
import paths from './path.js'
import './index.less'

export type IIcons = keyof typeof paths

export interface IIconProps extends React.HTMLAttributes<HTMLDivElement> {
  type: IIcons
}

export default function Icon(props: IIconProps) {
  const extClass = props.className ? ' ' + props.className : ''
  const attrs: Partial<IIconProps> = { ...props }
  delete attrs.type
  return (
    <div
      {...attrs}
      className={'icon' + extClass}
      style={{ ...(props.style ?? {}) }}>
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 1024 1024"
        focusable="false"
        style={{ fill: 'currentColor' }}>
        {paths[props.type]}
      </svg>
    </div>
  )
}
`;

export const vue3IndexFile = `import { defineComponent, ExtractPropTypes, PropType } from "vue";
import "./index.scss";
import paths from "./path";

export type IIcons = keyof typeof paths;

export const iIconProps = () => ({
  type: {
    type: String as unknown as PropType<keyof typeof paths>,
    required: true, 
  },
  class: {
    type: String,
    required: false,
  },
  style: {
    type: Object as PropType<CSSStyleDeclaration>,
    required: false,
  },
});

export type IIconProps = ExtractPropTypes<ReturnType<typeof iIconProps>>;

const Icon = defineComponent({
  name: 'Icon',
  props: iIconProps(),
  setup(props) {
    const { type, class: className, style } = props;

    return () => (
      <div class={'icon ' + className || ''} style={style}>
        <svg width="1em" height="1em" viewBox="0 0 1024 1024" focusable="false" style={{ fill: "currentColor" }}>
          {paths[type!]}
        </svg>
      </div>
    );
  },
});

export default Icon;
`;

export const indexStyle = `.icon {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.icon-sample {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;

  &-item {
    flex: 0 120px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    margin-bottom: 30px;

    .icon {
      font-size: 32px;
    }

    span {
      font-size: 10px;
      margin-top: 5px;
    }
  }
}
`;

export const configFile = (originPathMap: Record<string, string> = {}) => {
  const configData = {
    origin: originPathMap,
    map: {},
    include: [],
    exclude: [],
  };
  return JSON.stringify(configData, null, "\t");
};

export const pathFile = `
export default {
}`;

// icon预览
export const preview = (iconMap: Record<string, string> = {}) => {
  const svgIcons = Object.keys(iconMap).map((it) => {
    return `<div class="iconItem">
      <svg width="24px" height="24px" viewBox="0 0 1024 1024" focusable="false">
        ${iconMap[it]}
      </svg>
      <p>${it}</p>
    </div>`;
  });

  return `<!-- icons 预览； --> 
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>icon预览</title>
    <style>
      .iconItem{ display: inline-block; padding: 8px 4px; width: 80px; text-align: center; }
      .iconItem:hover{ background: rgba(200, 200, 200, 0.6); cursor: pointer; border-radius: 4px;}
      .iconItem svg{ fill: currentColor; }
      .iconItem p{ width: 100%; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;}
    </style>
  </head>
  <body>
    ${svgIcons.join("")}
  </body>
  <script>
    const iconItems = document.querySelectorAll(".iconItem");
    for (let i = 0; i < iconItems.length; i++) {
      iconItems[i].addEventListener("click", function(e){
        const value = e.currentTarget.lastElementChild.innerText;
        navigator.clipboard.writeText(value)
      });
    }
  </script>
</html>`;
};
