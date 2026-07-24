/**
 * CSV 文件生成与分享工具
 * 复用于 admin/index.js（模板下载、表格导出）和 import-preview/index.js（错误报告下载）
 *
 * 降级策略（基于运行时能力检测，不假设 iOS/Android/开发者工具一定支持某 API）：
 *   1. wx.getFileSystemManager 可用且写入成功 + wx.shareFileMessage 可用且调用成功 → shared
 *   2. wx.shareFileMessage 不存在或调用失败 → 复制完整 CSV 内容到剪贴板 → copied
 *   3. 文件系统不可用或写入失败 → 复制完整 CSV 内容到剪贴板 → copied
 *   4. wx.setClipboardData 也失败 → failed（不提示成功）
 *
 * 关键约束：
 *   - 不向用户暴露 USER_DATA_PATH 等内部路径
 *   - 模板下载和错误报告下载共用同一套逻辑
 *   - 防止快速重复点击同时生成多个文件（模块级 _inFlight 标记）
 *   - 通过可选 complete 回调报告最终结果：shared / copied / failed
 */

// ========== CSV 单元格工具（与 admin/index.js 保持一致，供错误报告复用） ==========

function cleanTableCell(value) {
  return String(value === undefined || value === null ? "" : value)
    .replace(/\t/g, " ")
    .replace(/\r?\n/g, " ")
    .trim();
}

// CSV 公式注入防护：以 = + - @ 开头的字符串前置单引号转义
// 非字符串（number/boolean）原样返回，绝不添加单引号
function escapeFormulaInjection(text) {
  if (typeof text !== "string") return text;
  const s = text.trim();
  if (!s) return text;
  const head = s.charAt(0);
  if (head === "=" || head === "+" || head === "-" || head === "@") {
    return "'" + text;
  }
  return text;
}

// 将单个值转换为 CSV 单元格文本
// number/boolean 等非字符串不做公式注入防护，避免 -100 被改坏为 '-100
// 包含逗号、双引号、换行的文本用双引号包裹并转义内部双引号
function csvCell(value) {
  const isNonStringPrimitive = typeof value === "number" || typeof value === "boolean";
  const text = cleanTableCell(value);
  const safe = isNonStringPrimitive ? text : escapeFormulaInjection(text);
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

// ========== 文件分享主流程 ==========

// 防重复点击：标记是否有正在进行的分享任务
// 模块级单例，确保跨页面、跨按钮的快速重复点击都被拦截
let _inFlight = false;

/**
 * 复制内容到剪贴板
 * @param {string} content - 待复制文本
 * @param {string} successTitle - 复制成功时的提示文案
 * @returns {Promise<boolean>} 是否复制成功
 */
function copyToClipboard(content, successTitle) {
  return new Promise((resolve) => {
    if (typeof wx.setClipboardData !== "function") {
      resolve(false);
      return;
    }
    wx.setClipboardData({
      data: content,
      success: () => {
        if (successTitle) {
          wx.showToast({ title: successTitle, icon: "none" });
        }
        resolve(true);
      },
      fail: () => resolve(false)
    });
  });
}

/**
 * 显示明确错误提示（绝不提示成功）
 */
function showErrorToast() {
  wx.showToast({ title: "生成失败，请重试", icon: "none" });
}

/**
 * 生成并分享 CSV 文件
 * @param {Object} options
 * @param {string} options.fileName - 文件名（含扩展名，如 apartment-import-template.csv）
 * @param {string} options.content - CSV 文本内容（应已包含 BOM 头）
 * @param {Function} [options.complete] - 完成回调，参数为 { result: 'shared' | 'copied' | 'failed' }
 * @returns {void}
 */
function writeAndShareCsv({ fileName, content, complete } = {}) {
  // 防重复点击：避免同时生成多个文件
  if (_inFlight) {
    return;
  }
  _inFlight = true;

  // 统一收尾：重置标记并通过回调报告结果
  const finish = (result) => {
    _inFlight = false;
    if (typeof complete === "function") {
      try {
        complete({ result });
      } catch (e) {
        // 回调异常不影响主流程
      }
    }
  };

  // 降级到剪贴板：把完整 CSV 内容复制到剪贴板
  // reason 决定提示文案（缩短以避免 wx.showToast 单行换行错位）：
  //   - "no-share-api" / "no-fs" / "write-failed"：环境不支持文件分享
  //   - "share-failed"：分享 API 存在但调用失败（如用户取消）
  const fallbackToClipboard = (reason) => {
    const title = reason === "share-failed"
      ? "分享未完成，CSV已复制"
      : "不支持文件分享，CSV已复制";
    copyToClipboard(content, title).then((ok) => {
      if (ok) {
        finish("copied");
      } else {
        // 剪贴板也失败：显示明确错误，不提示成功
        showErrorToast();
        finish("failed");
      }
    });
  };

  const fs = wx.getFileSystemManager && wx.getFileSystemManager();
  const hasUserDataPath = wx.env && wx.env.USER_DATA_PATH;

  // 文件系统不可用：直接复制到剪贴板
  if (!fs || !hasUserDataPath) {
    fallbackToClipboard("no-fs");
    return;
  }

  const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`;
  let writeOk = false;
  try {
    fs.writeFileSync(filePath, content, "utf8");
    writeOk = true;
  } catch (err) {
    writeOk = false;
  }

  // 文件系统写入失败：复制到剪贴板
  if (!writeOk) {
    fallbackToClipboard("write-failed");
    return;
  }

  // 写入成功但 wx.shareFileMessage 不可用：复制到剪贴板（不提示"文件已保存"）
  if (typeof wx.shareFileMessage !== "function") {
    fallbackToClipboard("no-share-api");
    return;
  }

  // 调用系统分享面板
  wx.shareFileMessage({
    filePath,
    success() {
      wx.showToast({ title: "文件已生成", icon: "success" });
      finish("shared");
    },
    fail() {
      // 分享失败（如用户取消或环境异常）：降级复制到剪贴板
      fallbackToClipboard("share-failed");
    }
  });
}

function downloadCloudCsv({ fileID } = {}) {
  if (!fileID || typeof wx === "undefined" || !wx.cloud || typeof wx.cloud.downloadFile !== "function") {
    return Promise.resolve({ ok: false, code: "unsupported" });
  }
  return new Promise((resolve) => {
    wx.cloud.downloadFile({
      fileID,
      success(downloaded) {
        const filePath = downloaded && downloaded.tempFilePath;
        resolve(filePath ? { ok: true, filePath } : { ok: false, code: "download_failed" });
      },
      fail() {
        resolve({ ok: false, code: "download_failed" });
      }
    });
  });
}

function openCloudCsv({ filePath } = {}) {
  if (!filePath || typeof wx === "undefined" || typeof wx.openDocument !== "function") {
    return Promise.resolve({ ok: false, code: "unsupported" });
  }
  return new Promise((resolve) => {
    wx.openDocument({
      filePath,
      fileType: "csv",
      showMenu: true,
      success() {
        resolve({ ok: true });
      },
      fail() {
        resolve({ ok: false, code: "open_failed" });
      }
    });
  });
}

function openCloudSpreadsheet({ filePath } = {}) {
  if (!filePath || typeof wx === "undefined" || typeof wx.openDocument !== "function") {
    return Promise.resolve({ ok: false, code: "unsupported" });
  }
  return new Promise((resolve) => {
    wx.openDocument({
      filePath,
      fileType: "xlsx",
      showMenu: true,
      success() {
        resolve({ ok: true });
      },
      fail() {
        resolve({ ok: false, code: "open_failed" });
      }
    });
  });
}

function prepareCloudSpreadsheetFile({ filePath, fileName } = {}) {
  if (!filePath || !fileName || typeof wx === "undefined") {
    return { ok: false, code: "unsupported" };
  }
  const fs = wx.getFileSystemManager && wx.getFileSystemManager();
  const userDataPath = wx.env && wx.env.USER_DATA_PATH;
  if (!fs || !userDataPath) {
    return { ok: false, code: "unsupported" };
  }
  const safeFileName = String(fileName).replace(/[\\/:*?"<>|]/g, "_");
  if (!safeFileName) {
    return { ok: false, code: "invalid_file_name" };
  }
  const destination = `${userDataPath}/${safeFileName}`;
  try {
    fs.writeFileSync(destination, fs.readFileSync(filePath));
    return { ok: true, filePath: destination };
  } catch (error) {
    return { ok: false, code: "prepare_failed" };
  }
}

function shareCloudCsv({ filePath, fileName } = {}) {
  if (!filePath || typeof wx === "undefined" || typeof wx.shareFileMessage !== "function") {
    return Promise.resolve({ ok: false, code: "unsupported" });
  }
  return new Promise((resolve) => {
    wx.shareFileMessage({
      filePath,
      fileName: fileName || "导出文件.csv",
      success() {
        resolve({ ok: true });
      },
      fail() {
        resolve({ ok: false, code: "share_failed" });
      }
    });
  });
}

function downloadAndOpenCloudCsv({ fileID, complete } = {}) {
  const finish = (result) => {
    if (typeof complete === "function") complete({ result });
  };

  downloadCloudCsv({ fileID }).then((downloaded) => {
    if (!downloaded.ok) {
      wx.showToast({ title: "导出文件下载失败，请重试", icon: "none" });
      finish("download_failed");
      return;
    }
    openCloudCsv({ filePath: downloaded.filePath }).then((opened) => {
      if (opened.ok) {
        wx.showToast({ title: "文件已打开，可转发或保存", icon: "none" });
        finish("opened");
        return;
      }
      wx.showToast({ title: "文件已生成，请在微信文件中查看", icon: "none" });
      finish("open_failed");
    });
  });
}

module.exports = {
  writeAndShareCsv,
  downloadAndOpenCloudCsv,
  downloadCloudCsv,
  openCloudCsv,
  openCloudSpreadsheet,
  prepareCloudSpreadsheetFile,
  shareCloudCsv,
  csvCell,
  cleanTableCell,
  escapeFormulaInjection,
  // 仅供本地验证使用：重置防重复点击标记
  _resetInFlightForTest() {
    _inFlight = false;
  }
};
