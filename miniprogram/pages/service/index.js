Page({
  data: {
    activities: [
      {
        id: 1,
        title: "郑东公寓周末集市",
        typeLabel: "官方活动",
        typeClass: "official",
        date: "7月5日（周六）14:00",
        location: "郑东人才公寓·共享大厅",
        mode: "线下",
        fee: "免费",
        participants: "18/30人",
        statusText: "报名中 · 18/30人",
        statusClass: "open",
        coverClass: "cover-grad-1"
      },
      {
        id: 2,
        title: "高新区桌游夜",
        typeLabel: "用户活动",
        typeClass: "user",
        date: "7月11日（周五）19:00",
        location: "高新人才家园·活动室",
        mode: "线下",
        fee: "AA 15 元",
        participants: "8/12人",
        statusText: "报名中 · 8/12人",
        statusClass: "open",
        coverClass: "cover-grad-2"
      },
      {
        id: 3,
        title: "人才公寓篮球友谊赛",
        typeLabel: "官方活动",
        typeClass: "official",
        date: "7月19日（周六）16:00",
        location: "二七人才公寓·篮球场",
        mode: "线下",
        fee: "免费",
        participants: "20/20人",
        statusText: "已满员 · 20/20人",
        statusClass: "full",
        coverClass: "cover-grad-3"
      }
    ],
    services: [
      {
        id: 1,
        name: "代取快递",
        desc: "帮你代取公寓周边快递柜包裹",
        price: "5",
        unit: "元/次"
      },
      {
        id: 2,
        name: "代办入住手续",
        desc: "协助办理人才公寓入住登记全流程",
        price: "50",
        unit: "元/次"
      },
      {
        id: 3,
        name: "代排队取号",
        desc: "住建局窗口排队取号，省去你的等待时间",
        price: "30",
        unit: "元/次"
      }
    ]
  },

  showStaticTip(e) {
    wx.showToast({
      title: `${e.currentTarget.dataset.name}下一步接入`,
      icon: "none"
    });
  }
});
