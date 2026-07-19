const PREVIEW_MESSAGE = "该功能正在准备中，暂未正式开放";

function showPreviewNotice(wxApi = wx) {
  wxApi.showToast({ title: PREVIEW_MESSAGE, icon: "none" });
  return { ok: false, reason: "preview_only" };
}

module.exports = {
  PREVIEW_MESSAGE,
  showPreviewNotice
};
