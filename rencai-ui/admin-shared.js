var editId = null;
var deleteId = null;
var activeFilter = 'all';
var toastTimer = null;

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, function(char) {
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[char];
  });
}

function statusInfo(status) {
  var map = {
    active: ['已上线', 'status-on'],
    pending: ['待审核', 'status-warn'],
    processing: ['处理中', 'status-warn'],
    hidden: ['已隐藏', 'status-off'],
    rejected: ['已驳回', 'status-danger'],
    disabled: ['已停用', 'status-off']
  };
  return map[status] || ['待处理', 'status-warn'];
}

function getKeyword() {
  var input = document.getElementById('searchInput');
  return input ? input.value.trim().toLowerCase() : '';
}

function matchKeyword(item, keyword) {
  if (!keyword) return true;
  return Object.keys(item).some(function(key) {
    return String(item[key] || '').toLowerCase().indexOf(keyword) > -1;
  });
}

function setFilter(status, node) {
  activeFilter = status;
  document.querySelectorAll('.filter-chip').forEach(function(chip) { chip.classList.remove('active'); });
  if (node) node.classList.add('active');
  render();
}

function currentItems() {
  var keyword = getKeyword();
  return data.filter(function(item) {
    var statusMatch = activeFilter === 'all' || item.status === activeFilter;
    return statusMatch && matchKeyword(item, keyword);
  });
}

function renderSummary() {
  var total = data.length;
  var pending = data.filter(function(item) { return item.status === 'pending' || item.status === 'processing'; }).length;
  var active = data.filter(function(item) { return item.status === 'active'; }).length;
  document.getElementById('summary').innerHTML =
    '<div class="summary-card"><div class="summary-value">' + total + '</div><div class="summary-label">全部记录</div></div>' +
    '<div class="summary-card"><div class="summary-value">' + pending + '</div><div class="summary-label">待处理</div></div>' +
    '<div class="summary-card"><div class="summary-value">' + active + '</div><div class="summary-label">已上线</div></div>';
}

function render() {
  renderSummary();
  var list = document.getElementById('list');
  var rows = currentItems();
  if (!rows.length) {
    list.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg><p>暂无匹配记录</p></div>';
    return;
  }
  list.innerHTML = rows.map(renderItem).join('');
}

function openForm(id) {
  editId = id || null;
  var item = data.find(function(row) { return row.id === editId; });
  document.getElementById('formTitle').textContent = item ? pageConfig.editTitle : pageConfig.addTitle;
  pageConfig.fields.forEach(function(field) {
    var input = document.getElementById('f_' + field.key);
    if (!input) return;
    input.value = item ? (item[field.key] || '') : (field.defaultValue || '');
  });
  document.getElementById('f_status').value = item ? item.status : (pageConfig.defaultStatus || 'active');
  document.getElementById('btnDelete').style.display = item ? 'block' : 'none';
  document.getElementById('formMask').classList.add('show');
}

function closeForm(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById('formMask').classList.remove('show');
  editId = null;
}

function saveItem() {
  var record = {};
  pageConfig.fields.forEach(function(field) {
    var input = document.getElementById('f_' + field.key);
    record[field.key] = input ? input.value.trim() : '';
  });
  record.status = document.getElementById('f_status').value;
  if (!record[pageConfig.requiredKey]) {
    showToast('请填写' + pageConfig.requiredLabel);
    return;
  }
  if (editId) {
    data = data.map(function(item) { return item.id === editId ? Object.assign({}, item, record) : item; });
    showToast('已保存修改');
  } else {
    data.unshift(Object.assign({ id: nextId++ }, record));
    showToast('已新增');
  }
  closeForm();
  render();
}

function removeItem(id) {
  deleteId = id;
  document.getElementById('deleteMask').classList.add('show');
}

function deleteItem() {
  if (!editId) return;
  var id = editId;
  closeForm();
  removeItem(id);
}

function closeDelete(event) {
  if (event && event.target !== event.currentTarget) return;
  document.getElementById('deleteMask').classList.remove('show');
  deleteId = null;
}

function confirmDelete() {
  data = data.filter(function(item) { return item.id !== deleteId; });
  closeDelete();
  render();
  showToast('已删除');
}

function updateStatus(id, status, message) {
  data = data.map(function(item) { return item.id === id ? Object.assign({}, item, { status: status }) : item; });
  render();
  showToast(message || '状态已更新');
}

function showToast(message) {
  var toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toast.classList.remove('show'); }, 1800);
}

function buildFields() {
  document.getElementById('fieldBox').innerHTML = pageConfig.fields.map(function(field) {
    var input = field.type === 'textarea'
      ? '<textarea id="f_' + field.key + '" placeholder="' + field.placeholder + '"></textarea>'
      : '<input id="f_' + field.key + '" placeholder="' + field.placeholder + '">';
    return '<div class="modal-field"><label>' + field.label + '</label>' + input + '</div>';
  }).join('') +
  '<div class="modal-field"><label>状态</label><select id="f_status">' +
  '<option value="active">已上线</option><option value="pending">待审核</option><option value="processing">处理中</option><option value="hidden">隐藏</option><option value="disabled">停用</option>' +
  '</select></div>';
}

function initAdminPage() {
  buildFields();
  render();
}

document.addEventListener('DOMContentLoaded', initAdminPage);
