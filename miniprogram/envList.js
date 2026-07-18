/**
 * 云开发环境配置
 *
 * 使用云模式（db.js 中 DATA_MODE = "cloud"）时，
 * 将下方 envList 数组替换为你的云环境 ID。
 *
 * 获取环境 ID 的步骤：
 * 1. 打开微信开发者工具
 * 2. 点击工具栏「云开发」按钮
 * 3. 创建或选择一个环境
 * 4. 复制环境 ID 填入下方数组
 *
 * 不配置环境 ID 时，小程序自动使用 mock 模式运行。
 */

const envList = ["cloud1-d4gbiicxhcd67b748"];

const isMac = false;

module.exports = {
  envList,
  isMac
};
