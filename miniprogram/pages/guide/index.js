Page({
  data: {
    activeTab: "eligibility",
    activeMeta: {
      title: "申请条件",
      desc: "先核对学历、毕业年限、住房和保障政策记录。",
      count: "5",
      unit: "项"
    },
    tabs: [
      { value: "eligibility", label: "申请条件", title: "申请条件", desc: "先核对学历、毕业年限、住房和保障政策记录。", count: "5", unit: "项" },
      { value: "process", label: "申请流程", title: "申请流程", desc: "从资格自审到办理入住，按节点准备材料。", count: "6", unit: "步" },
      { value: "materials", label: "材料清单", title: "材料清单", desc: "常用证明和复印件提前整理，减少补交。", count: "7", unit: "类" },
      { value: "faq", label: "常见Q&A", title: "常见问答", desc: "租期、费用、合租和户籍等高频问题集中查看。", count: "5", unit: "问" }
    ],
    eligibility: [
      { title: "全日制本科及以上学历", desc: "含应届毕业生，具体学历口径以项目公告为准。", required: true },
      { title: "毕业5年内", desc: "通常以毕业证书日期为准，部分项目对高层次人才有差异。", required: true },
      { title: "郑州市区无自有住房", desc: "申请人需满足无房证明或相关住房核验要求。", required: true },
      { title: "在郑州缴纳社保", desc: "部分项目可放宽至承诺制或单位证明。", required: false },
      { title: "未享受其他保障性住房政策", desc: "已享受同类政策的，一般不能重复申请。", required: true }
    ],
    process: [
      { title: "资格自审", tag: "开始", desc: "确认自己符合学历、年龄、住房等基本条件，避免白跑一趟。", tail: true },
      { title: "准备材料", tag: "材料", desc: "按材料清单准备身份证、毕业证、学位证、社保记录等原件及复印件。", tail: true },
      { title: "线上提交", tag: "提交", desc: "登录「郑好办」App 或郑州市住建局官网，填写申请表并上传材料扫描件。", tail: true },
      { title: "资格审核", tag: "审核", desc: "住建部门在 15 个工作日内完成审核，审核结果短信通知。", tail: true },
      { title: "选房签约", tag: "签约", desc: "审核通过后参与轮候选房，选定房源后签订租赁合同，缴纳押金及首月租金。", tail: true },
      { title: "办理入住", tag: "入住", desc: "凭合同到公寓物业管理处办理入住手续，领取钥匙。", tail: false }
    ],
    materials: [
      { short: "证", title: "身份证", desc: "原件及复印件，证件需在有效期内。", copies: "2份" },
      { short: "学", title: "毕业证书、学位证书", desc: "原件及复印件，信息需与申请表一致。", copies: "原件" },
      { short: "信", title: "学信网学历认证报告", desc: "在线验证报告，建议保存 PDF 或截图。", copies: "电子" },
      { short: "社", title: "社保缴纳证明", desc: "近6个月记录，部分项目按公告要求提供。", copies: "近6月" },
      { short: "房", title: "无房证明", desc: "由不动产登记中心开具或线上查询生成。", copies: "1份" },
      { short: "职", title: "劳动合同或在职证明", desc: "在职证明通常需要单位加盖公章。", copies: "盖章" },
      { short: "照", title: "一寸免冠照片", desc: "白底或蓝底按项目要求准备。", copies: "2张" }
    ],
    faq: [
      { q: "人才公寓可以住多久？", a: "一般租期为1-3年，到期后可申请续租。累计租赁年限一般不超过5年，具体以各项目规定为准。" },
      { q: "需要中介费吗？", a: "不需要。人才公寓由政府主导配租，不收取任何中介费。如遇要求缴纳中介费或加价费，请警惕诈骗。" },
      { q: "可以合租或转租吗？", a: "可以合租（需共同申请或承租人同意），但严禁转租牟利。违规转租一经查实将被清退并纳入信用记录。" },
      { q: "租金怎么算？包含水电吗？", a: "租金低于同地段市场价的70%。租金不含水电气及物业费，这些费用需另行缴纳。" },
      { q: "非郑州户口可以申请吗？", a: "可以。人才公寓不限户籍，只要满足学历、年龄、住房和社保条件即可申请。" }
    ]
  },

  switchTab(e) {
    const activeTab = e.currentTarget.dataset.value;
    const activeMeta = this.data.tabs.find((item) => item.value === activeTab) || this.data.tabs[0];
    this.setData({
      activeTab,
      activeMeta
    });
  }
});
