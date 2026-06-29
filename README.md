# 绳话

情侣关系手帐微信小程序。首页用 Canvas 2D 画一根垂挂的手绘绳子：未解矛盾是结，解开后变成淡灰印记，特殊节点会自动长出小挂饰。

## 当前版本

- 微信原生小程序项目骨架
- GitHub Pages 静态入口：`index.html`
- 浏览器可预览前端原型：`web/index.html`（根目录入口复用这套资源）
- Canvas 2D 首页时间线
- 点击绳子空白处打结
- 点击未解结发起「想解」
- 对方通过分享进入同一根绳子后点「好」，结变成印记
- 3/7/14/30 天积灰效果
- 100 天、解结 10 次、和平 30 天自动挂饰
- 微信云开发优先读写，未配置云环境时使用本地缓存降级预览

## 导入方式

1. 用微信开发者工具导入本目录：`/Users/jianada/Documents/p1`
2. 把 `project.config.json` 里的 `appid` 从 `touristappid` 换成你的小程序 AppID
3. 开通云开发，创建数据库集合：
   - `ropes`
   - `rope_events`
4. 上传并部署云函数：`cloudfunctions/login`
5. 在开发者工具里编译 `miniprogram/pages/index/index`

## 数据说明

`ropes` 保存一根关系绳：

```js
{
  ropeId: 'rope-...',
  members: ['openid-a', 'openid-b'],
  relationshipStartedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

`rope_events` 保存结和状态：

```js
{
  ropeId: 'rope-...',
  type: 'knot',
  status: 'open',
  content: '发生了什么',
  anchorY: 260,
  createdBy: 'openid-a',
  createdAt: Date,
  resolveRequest: {
    requestedBy: 'openid-a',
    requesterLine: '我想好好说',
    acceptedBy: 'openid-b',
    accepterLine: '我也愿意',
    acceptedAt: Date
  }
}
```

## 本地校验

```bash
npm test
npm run check
```

## 浏览器预览

```bash
npm run serve:web
```

然后打开 `http://127.0.0.1:4173`。浏览器版内置演示数据，支持滚动绳子、记绳、解结、绳历、绳本、自动徽章和本地保存。

## GitHub Pages

当前仓库适配 GitHub Pages 的 `Deploy from a branch` + `main` + `/(root)` 配置。发布后访问仓库 Pages 地址即可打开静态预览页，例如：

```text
https://seasonclub0434-droid.github.io/sheng/
```
