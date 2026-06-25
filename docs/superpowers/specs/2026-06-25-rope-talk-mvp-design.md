# 绳话 MVP Design

## Goal

「绳话」MVP 是一个单人可用的情侣关系手帐微信小程序。用户可以在一根手绘绳子上记录未说完的矛盾，把它们打成结；当自己准备放下时，可以把结解开，留下淡灰色印记。MVP 只交付可跑可演示的核心闭环：绳子展示、打结、解结、Canvas 渲染、云存储和本地降级。

## Scope

MVP includes:

- 首页 Canvas 2D 绘制一根垂挂手绘绳子。
- 上下滑动浏览绳子时间线。
- 点击绳子空白位置打开便签输入框。
- 输入一段自由文本后生成未解结。
- 点击未解结查看内容。
- 点击「解开」并填写一句和解感言后，未解结变成淡灰印记。
- 微信云开发可用时读写云数据库。
- 云开发不可用或未配置时降级到本地缓存，保证演示流程不断。
- 数据模型预留未来双人协作字段，但 MVP 不暴露双人邀请确认、对方确认或通知流程。

MVP excludes:

- 双人「想解 / 好」确认流程。
- 积灰机制的产品露出。
- 纪念挂饰自动生成的产品露出。
- 关键词提取。
- 词云。
- 订阅消息、客服消息或任何主动通知。

## Product Flow

### First Open

用户进入首页，看到米白纸纹背景和一根从屏幕上方垂下来的手绘绳子。顶部显示「绳话」和当前状态文案。若没有任何记录，底部出现轻量提示：「今天有什么没说完的事？」。

### Create Knot

用户点绳子附近的空白位置。页面底部弹出便签纸样式输入框，标题为「写成一个结」，输入框占据主要空间，按钮为「先不写」和「完成」。用户输入内容并点「完成」后，Canvas 在点击位置附近生成一个未解结。

Validation:

- 空文本不能提交。
- 文本去掉首尾空白后保存。
- 最大长度沿用当前小程序输入限制 500 字。

### View Knot

用户点击未解结，底部弹出便签详情。详情展示创建日期、原始内容和操作按钮。未解结按钮为「解开」。

### Resolve Knot

用户点击「解开」后，详情卡片展示一句和解感言输入框。用户写下感言并点「写好」后：

- 事件状态从 `open` 变为 `resolved`。
- 事件记录 `resolvedAt`、`resolvedBy` 和 `resolutionLine`。
- Canvas 中该结变成淡灰色印记。
- 积灰视觉不显示；已解结不显示任何灰尘。

和解感言允许为空。为空时仍可解结，表示用户只想把这件事放下。

### View Mark

用户点击淡灰印记，详情展示原始内容、创建日期、解开日期和和解感言。已解印记没有再次操作按钮。

## Visual Design

整体是两个人共用的钢笔速写本：

- 背景为米白色纸张，使用轻微纸纹和不规则颗粒。
- 绳子使用 Canvas 2D 绘制，不使用完美平滑矢量线。
- 绳子线条有自然抖动、轻微左右摆动、粗细层次和手绘高光。
- 未解结比绳子更紧、更深，带手画环绕线和交叉笔触。
- 已解印记是淡灰褐色的松散痕迹，视觉上比未解结轻。
- 弹窗像贴在纸面上的便签，边角可轻微不规则，但不做过度装饰。

MVP 的画面重点是可读、安静、温柔。界面不使用营销式 hero、不使用大面积渐变、不使用复杂卡片嵌套。

## Data Model

### `ropes`

Each rope stores one relationship timeline.

```js
{
  ropeId: 'rope-sample-id',
  members: ['openid-or-local-user-id'],
  relationshipStartedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

MVP behavior:

- 本地或云端不存在当前 rope 时自动创建。
- `members` 在 MVP 中通常只有一个用户。
- 字段保留数组结构，方便 V2 接入双人关系。

### `rope_events`

Each event stores one knot or resolved mark.

```js
{
  ropeId: 'rope-sample-id',
  type: 'knot',
  status: 'open',
  content: '发生了什么',
  anchorY: 260,
  createdBy: 'openid-or-local-user-id',
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date,
  resolvedBy: 'openid-or-local-user-id',
  resolutionLine: '和解感言'
}
```

MVP behavior:

- New events are created with `status: 'open'`.
- Resolving updates the same event to `status: 'resolved'`.
- The existing `resolveRequest` field, if present in old local demo data, should not drive the MVP UI.
- Future V2/V3 data can add `resolveRequest`, `dustState`, `keywords`, or generated ornaments without changing the MVP event identity.

## Architecture

The existing project structure remains:

- `miniprogram/pages/index/index.*`: page UI, Canvas rendering, touch handling, modal state.
- `miniprogram/services/rope-store.js`: session setup, cloud database access, local fallback, event mutations.
- `miniprogram/utils/timeline.js`: date helpers, sorting, normalization, layout calculations.
- `cloudfunctions/login`: openid lookup for cloud sessions.
- `tests/timeline.test.js`: unit tests for shared timeline behavior.
- `web/`: optional browser prototype for visual reference, not the source of truth for MVP.

Implementation should refine the current code instead of rebuilding from scratch. V2/V3 logic currently present in the codebase should be hidden or isolated from the MVP path rather than deleted if it can remain harmless and well-tested.

## Data Flow

1. Page loads and calls `store.initSession(routeRopeId)`.
2. Store initializes cloud if available and obtains an openid or local user id.
3. Store ensures a rope exists in cloud or local cache.
4. Page calls `store.loadState(session)`.
5. Page renders events through `layoutTimelineItems`.
6. User creates a knot.
7. Page calls `store.createKnot(session, payload)`.
8. Store writes to cloud when available, otherwise writes locally.
9. Page replaces local event state and re-renders Canvas.
10. User resolves a knot.
11. Page calls a single-user resolve mutation.
12. Store updates event status, timestamps, resolver, and resolution line.
13. Page re-renders Canvas, showing the event as an印记.

## Error Handling

- Cloud initialization failure falls back to local cache.
- Cloud read failure uses local cached state.
- Cloud create/update failure writes locally and keeps the user flow moving.
- Empty knot content shows a non-blocking toast.
- Save buttons show loading state while a mutation is in progress.
- If a selected event no longer exists after reload, the detail modal closes on the next state refresh.

## Testing

MVP verification should include:

- Unit tests for event sorting and timeline spacing.
- Unit tests for status changes from open knot to resolved mark.
- Unit tests that milestone and dust logic do not affect MVP display decisions.
- Syntax checks for mini program page, store, timeline utilities, app entry, cloud function, and web prototype.
- Manual WeChat Developer Tools check for:
  - launch
  - create knot
  - view knot
  - resolve knot
  - view resolved mark
  - local fallback

The browser prototype can remain useful for visual inspection, but passing browser preview does not replace mini program checks.

## Success Criteria

- A user can complete the full loop in under five seconds: tap rope, write, complete.
- A user can later tap a knot, read it, resolve it, and see it become an印记.
- MVP UI does not expose double-confirm resolve, dust stages, ornaments, keywords, or word cloud.
- Existing cloud-development setup instructions remain accurate.
- `npm test` and `npm run check` pass.
- The implementation keeps future two-person relationship support feasible through retained data fields.
