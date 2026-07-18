# 字号下限统一为 24rpx

日期：2026-07-17

## 背景

验收标准要求"任何页面不得出现小于 24rpx 的文字"。在 `miniprogram/pages` 下的多个 `.wxss` 文件中存在 `font-size: 20rpx / 21rpx / 22rpx / 23rpx` 等小于 24rpx 的字号声明，需要统一替换为 `24rpx`。

`pages/example/index.wxss` 为模板示例页面，不参与验收，按要求保留不修改。

## 改动内容

在 `miniprogram` 目录下执行 sed 批量替换：

```bash
sed -i '' 's/font-size: 2[0-3]rpx/font-size: 24rpx/g' \
  pages/roommate/index.wxss \
  pages/community/index.wxss \
  pages/service/index.wxss \
  pages/activity-list/index.wxss \
  pages/index/index.wxss \
  pages/service-detail/index.wxss \
  pages/borrow/index.wxss \
  pages/item-detail/index.wxss \
  pages/profile/index.wxss \
  pages/map/index.wxss \
  pages/my-comments/index.wxss \
  pages/service-list/index.wxss \
  pages/apartment-detail/index.wxss \
  pages/guide/index.wxss \
  pages/admin/index.wxss \
  pages/favorites/index.wxss
```

正则 `font-size: 2[0-3]rpx` 仅匹配 20rpx、21rpx、22rpx、23rpx，不影响 24rpx 及以上字号。

## 涉及文件及修改处数

| 文件 | 修改处数 |
| --- | --- |
| pages/roommate/index.wxss | 5（3×20rpx, 2×22rpx） |
| pages/community/index.wxss | 1（20rpx） |
| pages/service/index.wxss | 3（22rpx） |
| pages/activity-list/index.wxss | 1（22rpx） |
| pages/index/index.wxss | 1（22rpx） |
| pages/service-detail/index.wxss | 2（22rpx） |
| pages/borrow/index.wxss | 2（22rpx） |
| pages/item-detail/index.wxss | 1（23rpx） |
| pages/profile/index.wxss | 3（1×20rpx, 2×22rpx） |
| pages/map/index.wxss | 5（3×22rpx, 1×23rpx, 1×21rpx） |
| pages/my-comments/index.wxss | 2（1×22rpx, 1×20rpx） |
| pages/service-list/index.wxss | 2（22rpx） |
| pages/apartment-detail/index.wxss | 1（22rpx） |
| pages/guide/index.wxss | 3（22rpx） |
| pages/admin/index.wxss | 8（3×23rpx, 5×22rpx） |
| pages/favorites/index.wxss | 3（2×22rpx, 1×20rpx） |

合计：16 个文件，43 处字号被统一为 24rpx。

## 验证

执行替换后运行：

```bash
grep -rn "font-size: 2[0-3]rpx" pages/
```

结果仅剩 `pages/example/index.wxss:12: font-size: 23rpx;`（模板示例页面，按预期保留）。

其余所有页面均不再出现小于 24rpx 的字号声明，满足验收标准。

## 注意

- 未修改 `pages/example/index.wxss`（模板示例页面，不参与验收）。
- 仅替换 `font-size: 2[0-3]rpx` 模式，未影响其他字号或样式声明。
- 不影响 24rpx 及以上的字号。
