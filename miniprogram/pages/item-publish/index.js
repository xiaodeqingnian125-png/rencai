const { borrowCategories } = require("../../data/business");

Page({
  data: {
    categories: borrowCategories.filter((item) => item.value !== "all"),
    activeCategory: "tool",
    form: {
      name: "",
      desc: "",
      rules: "",
      location: ""
    }
  },

  selectCategory(e) {
    this.setData({ activeCategory: e.currentTarget.dataset.value });
  },

  handleInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ [`form.${field}`]: e.detail.value });
  },

  submitItem() {
    const { name, desc, rules, location } = this.data.form;
    if (!name.trim() || !desc.trim() || !rules.trim() || !location.trim()) {
      wx.showToast({ title: "请补全物品信息", icon: "none" });
      return;
    }
    wx.showModal({
      title: "发布成功",
      content: "物品已模拟发布，第一版暂不写入数据库。管理员可在我的页面的物品管理中处理下架或编辑。",
      showCancel: false,
      success: () => wx.navigateBack()
    });
  }
});
