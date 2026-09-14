/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

// vite-plugin-svgr v5 官方类型只覆盖 `*.svg?react` 默认导出;
// 本项目 vite.config 仍使用 namedExport: 'ReactComponent',在此补充声明
declare module '*.svg' {
  import * as React from 'react';

  export const ReactComponent: React.FunctionComponent<React.ComponentProps<'svg'>>;
  const src: string;
  export default src;
}
