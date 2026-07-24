# Profile Admin Direct Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the settings row for every user and make administrator content-management entries directly visible without an expandable administrator layer.

**Architecture:** Keep the existing `adminMenus` data and `openAdmin` permission check. Simplify the profile page state and WXML structure so the admin-only section directly renders its heading and existing menu group; remove the unrelated settings group for all users.

**Tech Stack:** Native WeChat Mini Program WXML, WXSS, JavaScript, Node.js test runner.

## Global Constraints

- Do not change administrator permissions, menu ordering, destination pages, cloud data, or database records.
- Remove the settings row for both administrators and non-administrators.
- Keep the “内容管理” label and all seven existing administrator entries.
- Use no third-party libraries.
- Record the completed change in `logs/` and verify iPhone-sized rendering where available.

---

### Task 1: Add a profile navigation regression test

**Files:**
- Create: `tests/profile-admin-direct-navigation.test.js`

- [ ] **Step 1: Write the failing test**

```js
test("profile removes settings and renders administrator menus directly", () => {
  assert.doesNotMatch(wxml, /设置/);
  assert.doesNotMatch(wxml, /admin-toggle|admin-panel/);
  assert.match(wxml, /wx:if="\{\{isAdmin\}\}"/);
  assert.match(wxml, /内容管理/);
  assert.doesNotMatch(script, /adminOpen|toggleAdmin|action: "settings"/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/profile-admin-direct-navigation.test.js`

Expected: FAIL because the current page still contains the settings menu and administrator toggle state.

### Task 2: Simplify the profile page

**Files:**
- Modify: `miniprogram/pages/profile/index.js`
- Modify: `miniprogram/pages/profile/index.wxml`
- Modify: `miniprogram/pages/profile/index.wxss`
- Test: `tests/profile-admin-direct-navigation.test.js`

- [ ] **Step 1: Remove the settings group and its settings route branch**

Remove the `id: "settings"` entry in `menuGroups` and the `action === "settings"` branch in `openMenu`.

- [ ] **Step 2: Remove accordion state and handler**

Remove `adminOpen` from page data, its reset in `syncUserState`, and `toggleAdmin`.

- [ ] **Step 3: Render the administrator section directly**

Replace the toggle/panel wrappers with the existing `内容管理` heading and menu group inside `wx:if="{{isAdmin}}"`.

- [ ] **Step 4: Remove unused accordion styles**

Remove `.admin-toggle`, `.admin-panel`, and `.admin-panel.show`; preserve `.admin-label`, `.admin-section`, and `.admin-item` spacing.

- [ ] **Step 5: Run the new regression test**

Run: `node --test tests/profile-admin-direct-navigation.test.js`

Expected: PASS.

### Task 3: Verify profile and related page behavior

**Files:**
- Create: `logs/2026-07-24-profile-admin-direct-navigation.md`

- [ ] **Step 1: Run the complete test suite**

Run: `node --test tests/*.test.js`

Expected: all tests pass.

- [ ] **Step 2: Check the profile page in the iPhone simulator**

Confirm that administrators see the content-management title and seven entries immediately, while non-administrators see neither the title nor the entries.

- [ ] **Step 3: Record the implementation and verification results**

Write the exact files changed and verification outputs in the log file.
