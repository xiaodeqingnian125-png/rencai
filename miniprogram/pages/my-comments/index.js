Page({
  data: {
    comments: [
      { id: 1, target: "郑东人才公寓", targetType: "公寓", targetIcon: "公", targetTone: "apt", body: "住了快一年了，物业态度超好，楼下快递柜很方便。离地铁走路5分钟，通勤非常友好。", time: "2026年6月", likes: 12, path: "/pages/apartment-detail/index?id=1", userName: "我", userInitial: "我" },
      { id: 2, target: "精致一居室（郑东人才公寓）", targetType: "户型", targetIcon: "户", targetTone: "room", body: "这个户型最大的优点是采光！朝南带阳台，冬天晒太阳超舒服。一个人住刚刚好。", time: "2026年5月", likes: 8, path: "/pages/room-detail/index?aptId=1&roomId=1", userName: "我", userInitial: "我" },
      { id: 3, target: "二七人才公寓", targetType: "公寓", targetIcon: "公", targetTone: "apt", body: "交通便利，楼下就是公交站。性价比很高，推荐给刚毕业的年轻人。", time: "2026年4月", likes: 5, path: "/pages/apartment-detail/index?id=5", userName: "我", userInitial: "我" },
      { id: 4, target: "舒适两居室（郑东人才公寓）", targetType: "户型", targetIcon: "户", targetTone: "room", body: "两居室空间很大，跟室友合租很划算。物业响应快，报修基本当天就处理。", time: "2026年3月", likes: 3, path: "/pages/room-detail/index?aptId=1&roomId=2", userName: "我", userInitial: "我" }
    ]
  },

  openTarget(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.path });
  },

  deleteComment(e) {
    const id = Number(e.currentTarget.dataset.id);
    this.setData({
      comments: this.data.comments.filter((comment) => comment.id !== id)
    });
    wx.showToast({ title: "已删除", icon: "none" });
  }
});
