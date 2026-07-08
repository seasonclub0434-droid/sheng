const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pagePath = path.join(root, 'miniprogram/pages/add-rope/add-rope.js');
const storePath = path.join(root, 'miniprogram/services/rope-store.js');
const miniWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/add-rope/add-rope.wxml'), 'utf8');
const miniWxss = fs.readFileSync(path.join(root, 'miniprogram/pages/add-rope/add-rope.wxss'), 'utf8');
const miniAppJson = fs.readFileSync(path.join(root, 'miniprogram/app.json'), 'utf8');
const indexWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/index/index.wxml'), 'utf8');
const indexJs = fs.readFileSync(path.join(root, 'miniprogram/pages/index/index.js'), 'utf8');

const queuedTests = [];

function test(name, fn) {
  queuedTests.push({ name, fn });
}

process.nextTick(async () => {
  for (const { name, fn } of queuedTests) {
    try {
      await fn();
      console.log(`ok - ${name}`);
    } catch (error) {
      console.error(`not ok - ${name}`);
      process.exitCode = 1;
      throw error;
    }
  }
});

function cssBlockLast(selector) {
  const opening = `\n${selector} {`;
  let start = miniWxss.lastIndexOf(opening);
  if (start !== -1) start += 1;
  if (start === -1 && miniWxss.startsWith(opening.slice(1))) start = 0;
  assert.notStrictEqual(start, -1);
  const end = miniWxss.indexOf('\n}', start);
  assert.notStrictEqual(end, -1);
  return miniWxss.slice(start, end);
}

function loadPageDefinition(createRope) {
  const store = require(storePath);
  const originalCreateRope = store.createRope;
  let pageDefinition = null;

  store.createRope = createRope;
  delete require.cache[require.resolve(pagePath)];
  global.Page = (definition) => {
    pageDefinition = definition;
  };
  require(pagePath);
  delete global.Page;

  return {
    pageDefinition,
    restore() {
      store.createRope = originalCreateRope;
      delete require.cache[require.resolve(pagePath)];
    },
  };
}

function instantiate(definition) {
  return {
    ...definition,
    data: JSON.parse(JSON.stringify(definition.data)),
    setData(patch, callback) {
      this.data = { ...this.data, ...patch };
      if (callback) callback();
    },
  };
}

test('mini add-rope create button stays tappable and validates missing fields', async () => {
  assert.ok(!/\sdisabled="{{!canCreateRope}}"/.test(miniWxml));

  const toasts = [];
  let createCalls = 0;
  global.wx = {
    showToast(options) {
      toasts.push(options);
    },
    redirectTo() {},
  };

  const { pageDefinition, restore } = loadPageDefinition(async () => {
    createCalls += 1;
  });
  const page = instantiate(pageDefinition);
  page.setData({ addRopeName: '11', addRopeMode: '', canCreateRope: false });

  await page.createNamedRope();

  assert.strictEqual(createCalls, 0);
  assert.deepStrictEqual(toasts, [{ title: '先选择一种模式', icon: 'none' }]);

  restore();
  delete global.wx;
});

test('mini add-rope creates a named rope after mode and name are present', async () => {
  const toasts = [];
  let createdPayload = null;
  let redirectedTo = '';
  global.wx = {
    showToast(options) {
      toasts.push(options);
    },
    redirectTo(options) {
      redirectedTo = options.url;
    },
  };

  const { pageDefinition, restore } = loadPageDefinition(async (session, payload) => {
    createdPayload = payload;
    return { ropeId: 'rope-created', name: payload.name, mode: payload.mode };
  });
  const page = instantiate(pageDefinition);
  page.homeSession = { openid: 'tester', cloudReady: false };
  page.setData({ addRopeName: '11', addRopeMode: 'single', canCreateRope: true });

  await page.createNamedRope();

  assert.deepStrictEqual(createdPayload, { name: '11', mode: 'single' });
  assert.strictEqual(redirectedTo, '/pages/index/index');
  assert.ok(toasts.some((toast) => toast.title === '已放进柜子'));

  restore();
  delete global.wx;
});

test('mini add-rope progressively reveals naming and create steps', () => {
  assert.ok(miniWxml.includes('<view wx:if="{{addRopeMode}}" class="add-rope-name-card progressive-reveal">'));
  assert.ok(miniWxml.includes('<view wx:if="{{addRopeMode}}" class="add-rope-rope progressive-reveal">'));
  assert.ok(miniWxml.includes('wx:if="{{canCreateRope}}"\n        id="createRopeFromAddPage"'));
  assert.ok(miniWxss.includes('.progressive-reveal'));
  assert.ok(cssBlockLast('.progressive-reveal').includes('animation: addRopeStepIn'));
  assert.ok(miniWxss.includes('@keyframes addRopeStepIn'));

  const { pageDefinition, restore } = loadPageDefinition(async () => {});
  const page = instantiate(pageDefinition);

  assert.strictEqual(page.data.addRopeMode, '');
  assert.strictEqual(page.data.addRopeName, '');
  assert.strictEqual(page.data.canCreateRope, false);

  page.selectAddRopeMode({ currentTarget: { dataset: { ropeMode: 'single' } } });
  assert.strictEqual(page.data.addRopeMode, 'single');
  assert.strictEqual(page.data.canCreateRope, false);

  page.onAddRopeNameInput({ detail: { value: '  ' } });
  assert.strictEqual(page.data.addRopeName, '  ');
  assert.strictEqual(page.data.canCreateRope, false);

  page.onAddRopeNameInput({ detail: { value: '晨间绳' } });
  assert.strictEqual(page.data.addRopeName, '晨间绳');
  assert.strictEqual(page.data.canCreateRope, true);

  page.onAddRopeNameInput({ detail: { value: '' } });
  assert.strictEqual(page.data.canCreateRope, false);

  restore();
});

test('mini add-rope layout follows the static index reference positions', () => {
  const backButton = cssBlockLast('.add-rope-back');
  const backTape = cssBlockLast('.add-rope-back::before');
  const appConfig = JSON.parse(miniAppJson);

  assert.ok(appConfig.pages.includes('pages/add-rope/add-rope'));
  assert.ok(indexWxml.includes('bindtap="openAddRopePage"'));
  assert.ok(indexJs.includes('navigateOnce(url)'));
  assert.ok(indexJs.includes("this.navigateOnce('/pages/add-rope/add-rope');"));
  assert.ok(!indexWxml.includes('id="addRopePage"'));
  assert.ok(miniWxml.includes('class="add-rope-board"'));
  assert.ok(miniWxml.includes('<text class="add-rope-back-char">返</text>'));
  assert.ok(miniWxml.includes('<text class="add-rope-back-char">回</text>'));
  assert.ok(!miniWxml.includes('style="top: {{safeTop + 44}}px;"'));
  assert.ok(!miniWxml.includes('style="top: {{safeTop + 62}}px;"'));
  assert.ok(cssBlockLast('.page').includes('padding: 72rpx 0 40rpx;'));
  assert.ok(cssBlockLast('.rope-add-page').includes('display: flex;'));
  assert.ok(cssBlockLast('.add-rope-board').includes('width: 690rpx;'));
  assert.ok(cssBlockLast('.add-rope-board').includes('height: calc(100vh - 112rpx);'));
  assert.ok(cssBlockLast('.add-rope-board').includes('border-radius: 42rpx;'));
  assert.ok(backButton.includes('top: 150rpx'));
  assert.ok(backButton.includes('left: 8rpx'));
  assert.ok(backButton.includes('display: grid'));
  assert.ok(backButton.includes('width: 76rpx'));
  assert.ok(backButton.includes('height: 176rpx'));
  assert.ok(backButton.includes('min-height: 176rpx'));
  assert.ok(backButton.includes('align-content: center'));
  assert.ok(backButton.includes('gap: 12rpx'));
  assert.ok(backButton.includes('padding: 28rpx 0'));
  assert.ok(backButton.includes('border: 2rpx solid rgba(88, 60, 32, 0.2)'));
  assert.ok(backButton.includes('transform: rotate(-0.8deg)'));
  assert.ok(!backButton.includes('width: auto'));
  assert.ok(!backButton.includes('min-width: 92rpx'));
  assert.ok(backTape.includes('top: -14rpx'));
  assert.ok(backTape.includes('left: 16rpx'));
  assert.ok(backTape.includes('width: 44rpx'));
  assert.ok(backTape.includes('height: 28rpx'));
  assert.ok(backTape.includes('transform: rotate(9deg)'));
  assert.ok(cssBlockLast('.add-rope-back-char').includes('display: block'));
  assert.ok(cssBlockLast('.add-rope-back-char').includes('font-size: 28rpx'));
  assert.ok(cssBlockLast('.add-rope-panel').includes('top: 124rpx'));
  assert.ok(cssBlockLast('.add-rope-panel').includes('right: 34rpx'));
  assert.ok(cssBlockLast('.add-rope-rope').includes('width: 112rpx'));
  assert.ok(cssBlockLast('.add-rope-rope').includes('height: 550rpx'));
  assert.ok(cssBlockLast('.add-rope-tail-image').includes('width: 96rpx'));
  assert.ok(cssBlockLast('.add-rope-tail-image').includes('height: 550rpx'));
  assert.ok(cssBlockLast('.add-rope-tail-image').includes('transform: scaleX(1.18)'));
  assert.ok(cssBlockLast('.rope-mode-options').includes('width: 620rpx'));
  assert.ok(cssBlockLast('.add-mode-title').includes('padding-top: 42rpx'));
  assert.ok(cssBlockLast('.create-rope-action').includes('position: relative'));
  assert.ok(!cssBlockLast('.create-rope-action').includes('bottom: 0'));
  assert.ok(cssBlockLast('.create-rope-action').includes('width: 148rpx'));
  assert.ok(cssBlockLast('.create-rope-action').includes('height: 122rpx'));
  assert.ok(cssBlockLast('.create-rope-action').includes('margin: 26rpx auto 0'));
  assert.ok(cssBlockLast('.create-rope-action').includes('place-items: start center'));
});
