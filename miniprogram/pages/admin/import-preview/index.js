const db = require("../../../data/db");
// CSV 文件分享与单元格工具统一复用 utils/csv-share
// 模板下载、错误报告下载共用同一套降级逻辑（shared / copied / failed）
const { writeAndShareCsv, csvCell } = require("../../../utils/csv-share");

Page({
  data: {
    taskId: "",
    task: {},
    previewData: [],
    importing: false,
    // 防重复点击：确认导入期间禁用按钮
    submitting: false
  },

  onLoad(options) {
    if (options.taskId) {
      this.setData({ taskId: options.taskId });
      this.loadTask();
    }
  },

  async loadTask() {
    wx.showLoading({ title: "加载中" });
    try {
      const res = await db.getImportTask(this.data.taskId);
      if (res.ok) {
        // 为错误记录生成稳定 _view_key，避免 wx:key="*this" 在对象列表上产生渲染警告
        const task = this._decorateTask(res.task || {});
        this.setData({
          task,
          previewData: (task.preview_data || []).slice(0, 20)
        });
      } else {
        wx.showToast({ title: res.error || "加载失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "加载失败", icon: "none" });
    } finally {
      wx.hideLoading();
    }
  },

  // 为错误记录生成稳定 _view_key（仅前端展示用，不修改服务器数据库结构）
  // key 由 类型 + 行号/item + 数组索引 组合生成，保证列表内唯一
  _decorateTask(task) {
    const decorated = Object.assign({}, task);
    if (Array.isArray(decorated.error_log)) {
      decorated.error_log = decorated.error_log.map((err, idx) => {
        const row = err && err.row !== undefined && err.row !== null ? err.row : "";
        return Object.assign({}, err, { _view_key: "error:" + row + ":" + idx });
      });
    }
    if (Array.isArray(decorated.write_errors)) {
      decorated.write_errors = decorated.write_errors.map((err, idx) => {
        let itemKey = "";
        if (err && err.item !== undefined && err.item !== null) {
          itemKey = typeof err.item === "object" ? JSON.stringify(err.item) : String(err.item);
        }
        return Object.assign({}, err, { _view_key: "write:" + itemKey + ":" + idx });
      });
    }
    return decorated;
  },

  async confirmImport() {
    // 防重复点击：双重检查 importing 和 submitting
    if (this.data.importing || this.data.submitting) return;
    this.setData({ importing: true, submitting: true });

    wx.showLoading({ title: "导入中" });
    try {
      const res = await db.confirmImport(this.data.taskId);
      if (res.ok) {
        // 适配新状态机：completed / partial_failed / failed / processing
        const status = res.status;
        let title = "";
        let icon = "success";
        if (status === "completed") {
          title = `成功导入 ${res.createdCount || 0} 新增 / ${res.updatedCount || 0} 更新`;
        } else if (status === "partial_failed") {
          title = `部分成功：${res.successCount || 0} 条，失败 ${res.failedCount || 0} 条`;
          icon = "none";
        } else if (status === "failed") {
          title = `导入失败：${res.failedCount || 0} 条`;
          icon = "none";
        } else if (status === "processing") {
          // 服务端仍在处理中，提示用户等待
          title = "任务正在处理中，请稍后刷新";
          icon = "none";
        } else {
          title = `成功 ${res.successCount || 0} 条`;
        }
        wx.showToast({ title, icon });
        // 成功或终态后重新加载任务详情（以云函数返回或任务详情为准，不伪造数量）
        this.loadTask();
      } else {
        // 错误可能是"任务已完成，不可再次确认"等幂等拒绝
        wx.showToast({ title: res.error || "导入失败", icon: "none" });
      }
    } catch (err) {
      wx.showToast({ title: "导入失败", icon: "none" });
    } finally {
      // 无论成功失败，恢复按钮状态
      this.setData({ importing: false, submitting: false });
      wx.hideLoading();
    }
  },

  // 下载错误报告 CSV
  // 合并 error_log（预览阶段错误）和 write_errors（写入阶段错误）
  // 字段：行号、错误原因、原始数据
  downloadErrors() {
    const task = this.data.task || {};
    const errorLog = task.error_log || [];
    const writeErrors = task.write_errors || [];
    const totalErrors = errorLog.length + writeErrors.length;
    // 没有错误时不生成空报告
    if (totalErrors === 0) {
      wx.showToast({ title: "无错误记录", icon: "none" });
      return;
    }

    // 生成错误报告 CSV
    const headers = ["行号", "错误原因", "原始数据"];
    const rows = [];

    // 预览阶段错误：error_log 含 { row, reason, raw_data }
    // raw_data 已是字符串则直接使用，对象才 JSON.stringify，字段不存在输出空字符串
    errorLog.forEach((err) => {
      let rawData = "";
      if (err && err.raw_data !== undefined && err.raw_data !== null) {
        rawData = typeof err.raw_data === "object" ? JSON.stringify(err.raw_data) : String(err.raw_data);
      }
      rows.push([
        err && err.row !== undefined && err.row !== null ? String(err.row) : "",
        (err && err.reason) || "",
        rawData
      ]);
    });

    // 写入阶段错误：write_errors 含 { item, error }（继续兼容旧结构）
    writeErrors.forEach((err) => {
      const itemData = err && err.item !== undefined && err.item !== null
        ? (typeof err.item === "object" ? JSON.stringify(err.item) : String(err.item))
        : "";
      rows.push([
        "写入阶段",
        (err && err.error) || "",
        itemData
      ]);
    });

    // 生成 CSV 文本（UTF-8 BOM + 公式注入防护：逗号/双引号/换行/=-+@ 开头）
    const headerLine = headers.map((h) => csvCell(h)).join(",");
    const dataLines = rows.map((row) => row.map((cell) => csvCell(cell)).join(","));
    const csvText = `\ufeff${[headerLine, ...dataLines].join("\n")}`;

    // 文件名规则保持不变：任务类型 + import-errors + 日期
    const targetType = task.target_type || "unknown";
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const fileName = `${targetType}-import-errors-${dateStr}.csv`;

    // 下载失败时由 writeAndShareCsv 内部自动降级到剪贴板（shared/copied/failed）
    writeAndShareCsv({ fileName, content: csvText });
  },

  cancel() {
    wx.navigateBack();
  }
});
