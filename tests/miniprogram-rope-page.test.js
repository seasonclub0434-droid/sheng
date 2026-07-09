const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const miniApp = fs.readFileSync(path.join(root, 'miniprogram/app.json'), 'utf8');
const indexJs = fs.readFileSync(path.join(root, 'miniprogram/pages/index/index.js'), 'utf8');
const ropeJs = fs.readFileSync(path.join(root, 'miniprogram/pages/rope/rope.js'), 'utf8');
const ropeWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/rope/rope.wxml'), 'utf8');
const ropeWxss = fs.readFileSync(path.join(root, 'miniprogram/pages/rope/rope.wxss'), 'utf8');
const ropeJson = fs.readFileSync(path.join(root, 'miniprogram/pages/rope/rope.json'), 'utf8');

const queuedTests = [];

function test(name, fn) {
  queuedTests.push({ name, fn });
}

process.nextTick(() => {
  for (const { name, fn } of queuedTests) {
    try {
      fn();
      console.log(`ok - ${name}`);
    } catch (error) {
      console.error(`not ok - ${name}`);
      process.exitCode = 1;
      throw error;
    }
  }
});

test('mini program registers rope detail as its own page', () => {
  const config = JSON.parse(miniApp);
  assert.ok(config.pages.includes('pages/index/index'));
  assert.ok(config.pages.includes('pages/rope/rope'));
  assert.deepStrictEqual(JSON.parse(ropeJson), {
    navigationStyle: 'custom',
    disableScroll: true,
  });
});

test('home shelf opens rope detail through page navigation', () => {
  assert.ok(indexJs.includes('navigateOnce(url)'));
  assert.ok(indexJs.includes('this.navigateOnce(`/pages/rope/rope?ropeId=${ropeId}`);'));
  assert.ok(indexJs.includes("wx.redirectTo({ url: `/pages/rope/rope?ropeId=${options.ropeId}` });"));
  assert.ok(!indexJs.includes("await this.setDataAsync({ loading: true, viewMode: 'rope' });\n    this.initCanvas();\n    this.session = await store.setCurrentRope(ropeId);"));
});

test('rope page owns the long-rope canvas and interaction modules', () => {
  assert.ok(ropeJs.includes("viewMode: 'rope'"));
  assert.ok(ropeJs.includes('await store.setCurrentRope(options.ropeId)'));
  assert.ok(ropeJs.includes('await store.initSession()'));
  assert.ok(ropeJs.includes("path: `/pages/rope/rope?ropeId=${ropeId}`"));
  assert.ok(ropeJs.includes('wx.navigateBack({ delta: 1 });'));
  assert.ok(ropeJs.includes("wx.redirectTo({ url: '/pages/index/index' });"));
  assert.ok(ropeJs.includes('resumeCanvas()'));
  assert.ok(ropeJs.includes('this.drawCanvasUi(ctx, width, height);'));
  assert.ok(ropeJs.includes('findUiHit(x, y)'));
  assert.ok(ropeJs.includes('handleCanvasUiHit(hit)'));
  assert.ok(ropeJs.includes("hit.id === 'back'"));
  assert.ok(ropeJs.includes("hit.id === 'timeline'"));
  assert.ok(ropeJs.includes("hit.id === 'exchange'"));
  assert.ok(ropeJs.includes("hit.id === 'write'"));
  assert.ok(ropeJs.includes("hit.id === 'resolve'"));
  assert.ok(ropeJs.includes("hit.id === 'notebook'"));
  assert.ok(ropeJs.includes('drawStatsCanvas(ctx, width, chrome);'));
  assert.ok(ropeJs.includes('drawTimelineDockCanvas(ctx, width, height)'));
  assert.ok(ropeJs.includes('drawExchangeCanvas(ctx, width, height)'));
  assert.ok(ropeJs.includes('drawExchangeActionCanvas(ctx, action'));
  assert.ok(ropeJs.includes('menuButtonLeft: 0'));
  assert.ok(ropeJs.includes('menuButtonBottom: 0'));
  assert.ok(ropeJs.includes("const menuButton = typeof wx.getMenuButtonBoundingClientRect === 'function' ? wx.getMenuButtonBoundingClientRect() : null;"));
  assert.ok(ropeJs.includes('menuButtonLeft: menuButton && Number.isFinite(menuButton.left) ? menuButton.left : info.windowWidth,'));
  assert.ok(ropeJs.includes('menuButtonBottom: menuButton && Number.isFinite(menuButton.bottom) ? menuButton.bottom : 0,'));
  assert.ok(ropeJs.includes('getRopeChromeMetrics(width)'));
  assert.ok(ropeJs.includes('const statsWidth = Math.min(width - this.rpx(88), this.rpx(620));'));
  assert.ok(ropeJs.includes('const statsX = (width - statsWidth) / 2;'));
  assert.ok(ropeJs.includes('const statsY = Math.max(this.data.safeTop + this.rpx(72), capsuleClearY);'));
  assert.ok(ropeJs.includes('const sideTabY = Math.max(statsY + this.rpx(92 + 68), this.data.safeTop + this.rpx(188));'));
  assert.ok(ropeJs.includes('drawTapeCanvas(ctx, x, y, width, height, rotation, seed)'));
  assert.ok(ropeJs.includes('this.drawTapeCanvas(ctx, x + barWidth - this.rpx(120), y - this.rpx(10), this.rpx(84), this.rpx(28), -5 * Math.PI / 180, 9101);'));
  assert.ok(ropeJs.includes("const tapeX = id === 'back' ? x + this.rpx(16) : x + width - this.rpx(16) - tapeWidth;"));
  assert.ok(ropeJs.includes("const tapeRotation = id === 'back' ? 9 * Math.PI / 180 : -9 * Math.PI / 180;"));
  assert.ok(ropeJs.includes('this.drawTapeCanvas(ctx, buttonX + buttonWidth - this.rpx(78), buttonY - this.rpx(12), this.rpx(58), this.rpx(24), -7 * Math.PI / 180, 768);'));
  assert.ok(ropeJs.includes('const columnWidth = (trayWidth - columnGap) / 2;'));
  assert.ok(ropeJs.includes("id: 'write',"));
  assert.ok(ropeJs.includes("id: 'resolve',"));
  assert.ok(ropeJs.includes("width: trayWidth,"));
  assert.ok(ropeJs.includes("hint: '回看已解的结和挂上的印章'"));
  assert.ok(ropeJs.includes('drawTimelineSelection(ctx, item, screenY, index)'));
  assert.ok(ropeJs.includes("ctx.fillText('记绳'"));
  assert.ok(ropeJs.includes("ctx.fillText('绳'"));
  assert.ok(ropeJs.includes('renderPending: false'));
  assert.ok(ropeJs.includes('requestRender()'));
  assert.ok(ropeJs.includes('this.requestRender();'));
  assert.ok(ropeJs.includes('this.canvas.requestAnimationFrame(runRender);'));
  assert.ok(ropeJs.includes('this.renderFallbackTimer = setTimeout(runRender, 16);'));
  assert.ok(!ropeJs.includes('this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY - deltaY));\n    this.render();'));
  assert.ok(ropeJs.includes("this.drawSideTabCanvas(ctx, 'back', '返回', this.rpx(8), chrome.sideTabY);"));
  assert.ok(ropeJs.includes("this.drawSideTabCanvas(ctx, 'timeline', '绳历', width - this.rpx(84), chrome.sideTabY);"));
  assert.ok(ropeWxml.includes('id="ropeCanvas"'));
  assert.ok(ropeWxml.includes('wx:if="{{!showNote && !showDetail && !showNotebook}}"'));
  assert.ok(!ropeWxml.includes('<cover-view'));
  assert.ok(ropeWxml.includes('<view wx:if="{{showDetail}}" class="modal-mask"'));
  assert.ok(ropeWxml.includes('<view wx:if="{{showNote}}" class="modal-mask"'));
  assert.ok(ropeWxml.includes('<view wx:if="{{showNotebook}}" class="modal-mask"'));
  assert.ok(!ropeWxml.includes("viewMode === 'rope'"));
  assert.ok(!ropeWxss.includes('@import'));
  assert.ok(ropeWxss.includes('.modal-mask'));
  assert.ok(ropeWxss.includes('.rope-canvas'));
});

test('rope page canvas timeline mirrors the browser record timeline list', () => {
  assert.ok(ropeJs.includes("kind: item.type === 'ornament'"));
  assert.ok(ropeJs.includes("status: item.type === 'ornament' ? 'badge'"));
  assert.ok(!ropeJs.includes("`印章 · ${item.title}`"));
  assert.ok(!ropeJs.includes("`解开 · ${item.content || '一个结'}`"));
  assert.ok(!ropeJs.includes("`记下 · ${item.content || '一个结'}`"));
  assert.ok(ropeJs.includes("ctx.fillText('点日期会圈住绳'"));
  assert.ok(ropeJs.includes("ctx.fillText('上的位置，再点'"));
  assert.ok(ropeJs.includes("ctx.fillText('一次取消。'"));
  assert.ok(ropeJs.includes('const dotX = bodyX + this.rpx(16);'));
  assert.ok(ropeJs.includes('ctx.arc(dotX, dotY'));
  assert.ok(ropeJs.includes("const kind = item.kind || '绳结';"));
  assert.ok(!ropeJs.includes('const title = item.title && item.title.length > 7'));
});
