Page({
  data: {
    qrDots: [],
    wechatId: "xiaode-youth",
    benefits: [
      { text: "实时获取人才公寓最新房源动态", tag: "每日更新" },
      { text: "和同公寓的邻居聊生活、约活动", tag: "邻居互动" },
      { text: "活动优先报名 + 专属优惠通知", tag: "优先名额" },
      { text: "二手闲置交换 + 寻室友 + 借工具", tag: "社区互助" }
    ]
  },

  onLoad() {
    const qrDots = [];
    const size = 25;
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const inFinder = (r < 8 && c < 8) || (r < 8 && c > size - 9) || (r > size - 9 && c < 8);
        const inCenter = r >= 10 && r <= 14 && c >= 10 && c <= 14;
        qrDots.push({
          id: `${r}-${c}`,
          on: !inFinder && !inCenter && ((r * 7 + c * 13 + r * c) % 5 < 2)
        });
      }
    }
    this.setData({ qrDots });
  },

  saveQr() {
    wx.showToast({
      title: "二维码已保存到相册",
      icon: "none"
    });
  },

  copyWechat() {
    wx.setClipboardData({
      data: this.data.wechatId,
      success: () => {
        wx.showToast({ title: "已复制微信号", icon: "none" });
      }
    });
  }
});
