declare module "beercss" {
  const css: string
  export default css
}

declare module "beercss/dist/cdn/beercss-elements.min.js" {
  // 副作用导入，无导出
}