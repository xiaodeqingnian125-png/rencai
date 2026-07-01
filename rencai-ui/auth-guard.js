(function() {
  var AUTH_KEY = 'xdYouthAuthorized';
  var AUTH_NAME_KEY = 'xdYouthAuthState';
  var pendingAction = null;
  var authReady = false;
  var authOpen = false;

  function readWindowNameAuth() {
    try {
      var state = window.name ? JSON.parse(window.name) : {};
      return state && state[AUTH_NAME_KEY] === '1';
    } catch (err) {
      return false;
    }
  }

  function writeWindowNameAuth() {
    try {
      var state = {};
      if (window.name) {
        try {
          state = JSON.parse(window.name) || {};
        } catch (err) {
          state = {};
        }
      }
      state[AUTH_NAME_KEY] = '1';
      window.name = JSON.stringify(state);
    } catch (err) {}
  }

  function readAuth() {
    if (window.__xdYouthAuthorized === true) return true;
    if (readWindowNameAuth()) return true;
    try {
      if (window.localStorage && window.localStorage.getItem(AUTH_KEY) === '1') return true;
    } catch (err) {}
    try {
      if (window.sessionStorage && window.sessionStorage.getItem(AUTH_KEY) === '1') return true;
    } catch (err) {}
    return false;
  }

  function writeAuth() {
    writeWindowNameAuth();
    try {
      if (window.localStorage) window.localStorage.setItem(AUTH_KEY, '1');
    } catch (err) {}
    try {
      if (window.sessionStorage) window.sessionStorage.setItem(AUTH_KEY, '1');
    } catch (err) {}
  }

  function ensureAuthUi() {
    if (authReady) return;
    authReady = true;
    var style = document.createElement('style');
    style.textContent = [
      '.auth-mask{position:fixed;inset:0;background:rgba(0,0,0,.32);display:none;align-items:flex-end;justify-content:center;z-index:9999;padding:0 12px calc(10px + env(safe-area-inset-bottom));box-sizing:border-box;}',
      '.auth-mask.auth-in-screen{position:absolute;}',
      '.auth-mask.show{display:flex;}',
      '.auth-sheet{width:100%;max-width:338px;max-height:calc(100vh - 28px);overflow:auto;background:#fff;border-radius:22px;padding:18px 18px 20px;box-shadow:0 -18px 44px rgba(0,0,0,.18);font-family:var(--font-body,"SF Pro Text","Helvetica Neue",Arial,sans-serif);color:var(--fg,#1d1d1f);box-sizing:border-box;}',
      '.auth-mask.auth-in-screen .auth-sheet{max-height:calc(100% - 24px);}',
      '.auth-icon{width:46px;height:46px;border-radius:16px;background:color-mix(in oklab,var(--accent,#0071e3),transparent 88%);display:grid;place-items:center;color:var(--accent,#0071e3);margin-bottom:12px;}',
      '.auth-icon svg{width:25px;height:25px;}',
      '.auth-title{font-size:20px;font-weight:700;line-height:1.2;margin:0 0 7px;}',
      '.auth-desc{font-size:14px;line-height:1.48;color:var(--muted,#6e6e73);margin:0 0 14px;}',
      '.auth-list{display:grid;gap:7px;margin:0 0 16px;padding:0;list-style:none;font-size:13px;line-height:1.4;color:var(--fg-2,#424245);}',
      '.auth-list li{display:flex;gap:8px;align-items:center;}',
      '.auth-list span{width:6px;height:6px;border-radius:50%;background:var(--accent,#0071e3);flex:0 0 auto;}',
      '.auth-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.auth-btn{border:0;border-radius:980px;height:44px;font-size:15px;font-weight:700;cursor:pointer;}',
      '.auth-btn.secondary{background:var(--surface,#f5f5f7);color:var(--fg,#1d1d1f);}',
      '.auth-btn.primary{background:var(--accent,#0071e3);color:#fff;}',
      '@media (max-width:360px){.auth-mask{padding-left:10px;padding-right:10px}.auth-sheet{padding:16px 14px 18px}.auth-actions{gap:8px}.auth-btn{font-size:14px}}'
    ].join('');
    document.head.appendChild(style);

    var mask = document.createElement('div');
    mask.className = 'auth-mask';
    mask.id = 'authMask';
    mask.innerHTML =
      '<div class="auth-sheet" role="dialog" aria-modal="true" aria-labelledby="authTitle">' +
        '<div class="auth-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><path d="M16.5 11.5 18 13l3-3"/></svg></div>' +
        '<h3 class="auth-title" id="authTitle">微信授权后继续</h3>' +
        '<p class="auth-desc">为了保护住户信息，查看详情、报名、发布、借用和支付等操作需要先完成微信授权。</p>' +
        '<ul class="auth-list"><li><span></span>获取微信头像和昵称用于社区身份展示</li><li><span></span>授权后可继续刚才的操作，无需重新点击</li></ul>' +
        '<div class="auth-actions"><button class="auth-btn secondary" type="button" id="authCancel">暂不授权</button><button class="auth-btn primary" type="button" id="authConfirm">微信授权</button></div>' +
      '</div>';
    var host = document.querySelector('.phone-screen') || document.body;
    if (host !== document.body) mask.classList.add('auth-in-screen');
    host.appendChild(mask);
    document.getElementById('authCancel').addEventListener('click', closeAuth);
    document.getElementById('authConfirm').addEventListener('click', confirmAuth);
  }

  function closeAuth() {
    var mask = document.getElementById('authMask');
    if (mask) mask.classList.remove('show');
    authOpen = false;
    pendingAction = null;
  }

  function confirmAuth() {
    writeAuth();
    window.__xdYouthAuthorized = true;
    var next = pendingAction;
    closeAuth();
    if (typeof next === 'function') next();
  }

  window.isAuthorized = function() {
    return window.__xdYouthAuthorized === true || readAuth();
  };

  window.requireAuth = function(action) {
    if (window.isAuthorized()) {
      return true;
    }
    ensureAuthUi();
    pendingAction = action;
    if (authOpen) return false;
    authOpen = true;
    document.getElementById('authMask').classList.add('show');
    return false;
  };
})();
