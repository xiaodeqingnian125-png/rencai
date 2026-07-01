const { apartments } = require("../../data/apartments");

Page({
  data: {
    form: {
      nickname: "晓得青年",
      phone: "138****8888",
      apartment: "郑东人才公寓",
      building: "3号楼",
      checkedIn: true
    },
    avatarText: "晓",
    apartmentOptions: apartments.map((item) => item.name),
    pickerOpen: false,
    modalOpen: false,
    modalField: "",
    modalTitle: "",
    modalPlaceholder: "",
    modalValue: ""
  },

  noop() {},

  changeAvatar() {
    wx.showToast({ title: "静态版暂不上传头像", icon: "none" });
  },

  openModal(e) {
    const field = e.currentTarget.dataset.field;
    const titleMap = {
      nickname: "修改昵称",
      phone: "修改手机号",
      building: "修改楼栋"
    };
    const placeholderMap = {
      nickname: "请输入新昵称",
      phone: "请输入手机号",
      building: "请输入楼栋（如 3号楼）"
    };
    this.setData({
      modalOpen: true,
      modalField: field,
      modalTitle: titleMap[field],
      modalPlaceholder: placeholderMap[field],
      modalValue: this.data.form[field]
    });
  },

  closeModal() {
    this.setData({ modalOpen: false, modalField: "", modalTitle: "", modalPlaceholder: "", modalValue: "" });
  },

  handleModalInput(e) {
    this.setData({ modalValue: e.detail.value });
  },

  confirmModal() {
    const value = this.data.modalValue.trim();
    if (!value) {
      wx.showToast({ title: "请输入内容", icon: "none" });
      return;
    }
    const field = this.data.modalField;
    this.setData({
      [`form.${field}`]: value,
      avatarText: field === "nickname" ? value.charAt(0) : this.data.avatarText,
      modalOpen: false,
      modalField: "",
      modalTitle: "",
      modalPlaceholder: "",
      modalValue: ""
    });
    wx.showToast({ title: "已修改", icon: "none" });
  },

  openApartmentPicker() {
    this.setData({ pickerOpen: true });
  },

  closePicker() {
    this.setData({ pickerOpen: false });
  },

  selectApartment(e) {
    this.setData({
      "form.apartment": e.currentTarget.dataset.value,
      pickerOpen: false
    });
    wx.showToast({ title: "已选择", icon: "none" });
  },

  toggleStatus() {
    const checkedIn = !this.data.form.checkedIn;
    this.setData({ "form.checkedIn": checkedIn });
    wx.showToast({
      title: checkedIn ? "状态已更新：已入住" : "状态已更新：未入住",
      icon: "none"
    });
  },

  saveProfile() {
    wx.showToast({ title: "个人信息已保存", icon: "none" });
  }
});
