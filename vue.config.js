const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.PUBLIC_PATH || "/",
  productionSourceMap: false, // 生产环境的 source map 设置上线后是否加载webpack文件
  configureWebpack: (config) => {
    config.devtool = false;
  },
});
