/**
 * 图片上传组件
 *
 * 支持两种模式：
 * 1. 云模式（DATA_MODE = "cloud"）：选择图片后上传到云存储，返回 fileID
 * 2. mock 模式：选择图片后转为 base64 存入本地数据（仅用于预览，不持久化到服务器）
 *
 * 父组件通过 bind:change 接收 { value: "fileID或base64" }
 */

const db = require("../../data/db");

Component({
  properties: {
    // 当前图片地址（fileID 或 base64 或空）
    value: {
      type: String,
      value: ""
    },
    // 上传按钮文案
    label: {
      type: String,
      value: "上传封面图"
    },
    // 云存储路径前缀，如 "covers/apartments"
    cloudPath: {
      type: String,
      value: "covers"
    },
    // 父级列表中的行号；上传完成时随 change 事件显式返回，避免依赖组件事件 dataset。
    index: {
      type: Number,
      value: -1
    }
  },

  data: {
    imageUrl: "",
    previousImageUrl: "",
    uploading: false
  },

  observers: {
    value(val) {
      this.setData({ imageUrl: val || "", previousImageUrl: val || "" });
    }
  },

  methods: {
    chooseImage() {
      if (this.data.uploading) return;
      wx.chooseMedia({
        count: 1,
        mediaType: ["image"],
        sourceType: ["album", "camera"],
        sizeType: ["compressed"],
        success: (res) => {
          const file = res.tempFiles && res.tempFiles[0];
          if (!file || !file.tempFilePath) return;
          if (Number(file.size) > 5 * 1024 * 1024) {
            wx.showToast({ title: "图片大小不能超过5MB", icon: "none" });
            return;
          }
          const tempPath = file.tempFilePath;
          this.uploadImage(tempPath);
        },
        fail: () => {}
      });
    },

    uploadImage(tempPath) {
      const previousImageUrl = this.data.imageUrl || "";
      this.setData({ uploading: true, previousImageUrl });
      wx.showLoading({ title: "上传中...", mask: true });

      if (db.isCloudMode()) {
        // 云模式：上传到云存储
        const ext = tempPath.split(".").pop() || "jpg";
        const cloudPath = `${this.data.cloudPath}/${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;

        wx.cloud.uploadFile({
          cloudPath,
          filePath: tempPath,
          success: (res) => {
            wx.hideLoading();
            this.setData({ uploading: false, imageUrl: res.fileID, previousImageUrl: res.fileID });
            this.triggerEvent("change", { value: res.fileID, index: this.data.index });
            wx.showToast({ title: "上传成功", icon: "none" });
          },
          fail: (err) => {
            wx.hideLoading();
            this.setData({ uploading: false, imageUrl: previousImageUrl });
            console.error("[upload] cloud upload failed:", err);
            this.triggerEvent("uploaderror", { error: err });
            wx.showToast({ title: "图片上传失败，请重试", icon: "none" });
          }
        });
      } else {
        // mock 模式：使用 wx.getFileSystemManager 读取 base64
        // 但 base64 过大会撑爆 Storage，mock 模式下直接用临时路径
        wx.hideLoading();
        this.setData({ uploading: false, imageUrl: tempPath, previousImageUrl: tempPath });
        this.triggerEvent("change", { value: tempPath, index: this.data.index });
        wx.showToast({ title: "已选择图片", icon: "none" });
      }
    },

    clearImage() {
      this.setData({ imageUrl: "", previousImageUrl: "" });
      this.triggerEvent("change", { value: "", index: this.data.index });
    }
  }
});
