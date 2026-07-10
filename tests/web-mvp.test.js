const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pagesHtmlPath = path.join(root, 'index.html');
const pagesHtml = fs.existsSync(pagesHtmlPath) ? fs.readFileSync(pagesHtmlPath, 'utf8') : '';
const html = fs.readFileSync(path.join(root, 'web/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'web/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'web/styles.css'), 'utf8');
const miniPage = fs.readFileSync(path.join(root, 'miniprogram/pages/index/index.js'), 'utf8');
const miniAddPage = fs.readFileSync(path.join(root, 'miniprogram/pages/add-rope/add-rope.js'), 'utf8');
const miniRopePage = fs.readFileSync(path.join(root, 'miniprogram/pages/rope/rope.js'), 'utf8');
const miniWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/index/index.wxml'), 'utf8');
const miniWxss = fs.readFileSync(path.join(root, 'miniprogram/pages/index/index.wxss'), 'utf8');
const miniAddWxml = fs.readFileSync(path.join(root, 'miniprogram/pages/add-rope/add-rope.wxml'), 'utf8');
const miniAddWxss = fs.readFileSync(path.join(root, 'miniprogram/pages/add-rope/add-rope.wxss'), 'utf8');
const miniAppJson = fs.readFileSync(path.join(root, 'miniprogram/app.json'), 'utf8');
const miniApp = fs.readFileSync(path.join(root, 'miniprogram/app.js'), 'utf8');
const miniStoreSource = fs.readFileSync(path.join(root, 'miniprogram/services/rope-store.js'), 'utf8');
const pkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
const rootProjectConfig = fs.readFileSync(path.join(root, 'project.config.json'), 'utf8');
const badgeMechanismPath = path.join(root, 'docs/badge-system.md');
const badgeMechanismDoc = fs.existsSync(badgeMechanismPath) ? fs.readFileSync(badgeMechanismPath, 'utf8') : '';
const assetVersion = 'interaction-fix-1';
const loginPngPath = path.join(root, 'web/assets/login-cabinet-door.png');
const loginWebpPath = path.join(root, 'web/assets/login-cabinet-door.webp');
const homeSignPngPath = path.join(root, 'web/assets/home-rope-sign-transparent.png');
const homeSignWebpPath = path.join(root, 'web/assets/home-rope-sign-transparent.webp');
const faviconPath = path.join(root, 'web/assets/favicon.svg');
const pullRopePngPath = path.join(root, 'web/assets/pull-rope-full-v1.png');
const singleModePngPath = path.join(root, 'web/assets/rope-mode-single-cutout.png');
const singleModeWebpPath = path.join(root, 'web/assets/rope-mode-single-cutout.webp');
const coupleModePngPath = path.join(root, 'web/assets/rope-mode-couple-cutout.png');
const coupleModeWebpPath = path.join(root, 'web/assets/rope-mode-couple-cutout.webp');
const addRopeTailPngPath = path.join(root, 'web/assets/add-rope-tail-v1.png');
const addRopeTailWebpPath = path.join(root, 'web/assets/add-rope-tail-v1.webp');
const miniHomeIconFiles = [
  'home-icon-settings.png',
  'home-icon-create.png',
  'home-icon-search.png',
];
const miniHomeShelfRopePath = path.join(root, 'miniprogram/assets/home-shelf-rope.png');
const miniAssetPaths = [
  'login-cabinet-door.png',
  'home-rope-sign-transparent.png',
  'rope-mode-single-cutout.png',
  'rope-mode-couple-cutout.png',
  'add-rope-tail-v1.png',
  'home-shelf-rope.png',
  ...miniHomeIconFiles,
].map((file) => path.join(root, 'miniprogram/assets', file));

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

function cssBlock(selector, firstDeclaration = '') {
  const opening = firstDeclaration
    ? `\n${selector} {\n  ${firstDeclaration}`
    : `\n${selector} {`;
  let start = css.indexOf(opening);
  if (start !== -1) start += 1;
  if (start === -1 && css.startsWith(opening.slice(1))) start = 0;
  assert.notStrictEqual(start, -1);
  const end = css.indexOf('\n}', start);
  assert.notStrictEqual(end, -1);
  return css.slice(start, end);
}

function cssBlockFrom(source, selector, firstDeclaration = '', useLast = false) {
  const opening = firstDeclaration
    ? `\n${selector} {\n  ${firstDeclaration}`
    : `\n${selector} {`;
  let start = useLast ? source.lastIndexOf(opening) : source.indexOf(opening);
  if (start !== -1) start += 1;
  if (start === -1 && source.startsWith(opening.slice(1))) start = 0;
  assert.notStrictEqual(start, -1);
  const end = source.indexOf('\n}', start);
  assert.notStrictEqual(end, -1);
  return source.slice(start, end);
}

function miniCssBlockLast(selector, firstDeclaration = '') {
  return cssBlockFrom(miniWxss, selector, firstDeclaration, true);
}

function miniAddCssBlock(selector, firstDeclaration = '') {
  return cssBlockFrom(miniAddWxss, selector, firstDeclaration, false);
}

function pngSize(filePath) {
  const buffer = fs.readFileSync(filePath);
  assert.strictEqual(buffer.toString('ascii', 1, 4), 'PNG');
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function pngAlphaStats(filePath) {
  const zlib = require('zlib');
  const buffer = fs.readFileSync(filePath);
  assert.strictEqual(buffer.toString('ascii', 1, 4), 'PNG');
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  const bitDepth = buffer[24];
  const colorType = buffer[25];
  assert.strictEqual(bitDepth, 8);
  assert.strictEqual(colorType, 6);

  let offset = 8;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const dataStart = offset + 8;
    if (type === 'IDAT') idat.push(buffer.subarray(dataStart, dataStart + length));
    offset = dataStart + length + 4;
  }

  const inflated = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * 4;
  let sourceOffset = 0;
  const previous = Buffer.alloc(stride);
  const current = Buffer.alloc(stride);
  let alphaAbove32 = 0;
  let cornerAlphaAbove32 = 0;
  let paleHighlightPixels = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = inflated[sourceOffset];
    sourceOffset += 1;
    for (let x = 0; x < stride; x += 1) {
      const raw = inflated[sourceOffset + x];
      const left = x >= 4 ? current[x - 4] : 0;
      const up = previous[x];
      const upLeft = x >= 4 ? previous[x - 4] : 0;
      let value = raw;
      if (filter === 1) value = (raw + left) & 255;
      else if (filter === 2) value = (raw + up) & 255;
      else if (filter === 3) value = (raw + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) {
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        value = (raw + (pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft)) & 255;
      }
      current[x] = value;
    }
    sourceOffset += stride;
    for (let x = 0; x < width; x += 1) {
      const alpha = current[x * 4 + 3];
      if (alpha > 32) {
        alphaAbove32 += 1;
        const red = current[x * 4];
        const green = current[x * 4 + 1];
        const blue = current[x * 4 + 2];
        if (red > 230 && green > 200 && blue > 120) paleHighlightPixels += 1;
        const inCorner = (x < 48 || x >= width - 48) && (y < 48 || y >= height - 48);
        if (inCorner) cornerAlphaAbove32 += 1;
      }
    }
    current.copy(previous);
  }

  return { alphaAbove32, cornerAlphaAbove32, paleHighlightPixels };
}

test('github pages root serves the browser preview', () => {
  assert.ok(pagesHtml.includes('<title>绳话</title>'));
  assert.ok(pagesHtml.includes('id="ropeCanvas"'));
  assert.ok(pagesHtml.includes('id="timelineToggle"'));
  assert.ok(pagesHtml.includes(`href="./web/styles.css?v=${assetVersion}"`));
  assert.ok(pagesHtml.includes(`<script defer src="./web/app.js?v=${assetVersion}"></script>`));
  assert.ok(!pagesHtml.includes('type="module" src="./web/app.js'));
  assert.ok(html.includes(`<script defer src="./app.js?v=${assetVersion}"></script>`));
  assert.ok(!html.includes('type="module" src="./app.js'));
  assert.ok(pagesHtml.includes('rel="icon" href="./web/assets/favicon.svg" type="image/svg+xml"'));
  assert.ok(html.includes('rel="icon" href="./assets/favicon.svg" type="image/svg+xml"'));
  assert.ok(fs.existsSync(faviconPath));
  assert.ok(fs.statSync(faviconPath).size < 1000);
  assert.ok(!pagesHtml.includes('href="./styles.css'));
  assert.ok(!pagesHtml.includes('src="./app.js'));
  assert.ok(pkg.includes('"serve:web": "python3 -m http.server 4173 --directory ."'));
});

test('browser preview does not expose two-person mode controls', () => {
  assert.ok(!html.includes('mode-switch'));
  assert.ok(!html.includes('partnerMode'));
  assert.ok(!js.includes('partnerMode'));
  assert.ok(!js.includes('setMode('));
});

test('browser preview keeps the home screen clean with a journal rope control', () => {
  assert.ok(!html.includes('id="createKnotButton"'));
  assert.ok(!html.includes('class="topbar"'));
  assert.ok(!html.includes('brand-title'));
  assert.ok(!html.includes('id="statusText"'));
  assert.ok(!html.includes('id="resetDemo"'));
  assert.ok(!html.includes('journal-panel'));
  assert.ok(!html.includes('最近记录'));
  assert.ok(!html.includes('id="eventList"'));
  assert.ok(html.includes('id="exchangeButton"'));
  assert.ok(html.includes('id="exchangeTray"'));
  assert.ok(html.includes('id="writeKnotAction"'));
  assert.ok(html.includes('id="resolveKnotAction"'));
  assert.ok(html.includes('id="notebookAction"'));
  assert.ok(html.includes('记绳'));
  assert.ok(html.includes('翻绳本'));
  assert.ok(!html.includes('交换'));
  assert.ok(html.includes('解一个结'));
  assert.ok(html.indexOf('id="statsBar"') < html.indexOf('id="exchangeButton"'));
  assert.ok(js.includes('function toggleExchangeTray('));
  assert.ok(js.includes('exchangeButton.addEventListener'));
  assert.ok(js.includes('writeKnotAction.addEventListener'));
  assert.ok(js.includes('resolveKnotAction.addEventListener'));
  assert.ok(js.includes('notebookAction.addEventListener'));
  assert.ok(!js.includes('updateEventList'));
  assert.ok(!js.includes('eventList.addEventListener'));
  assert.ok(!js.includes('resetDemo'));
  assert.ok(!js.includes('statusText'));
});

test('browser preview adds a cabinet-style rope home with isolated rope states and global search', () => {
  const defaultRopesStart = js.indexOf('function defaultRopes(');
  assert.ok(html.includes('id="loginGate"'));
  assert.ok(html.includes('class="phone kraft-paper home-mode login-mode"'));
  assert.ok(html.includes('class="login-gate image-login-gate"'));
  assert.ok(html.includes('class="login-cabinet-frame"'));
  assert.ok(html.includes('class="login-cabinet-picture"'));
  assert.ok(html.includes('class="login-cabinet-image"'));
  assert.ok(html.includes('srcset="./assets/login-cabinet-door.webp"'));
  assert.ok(html.includes('src="./assets/login-cabinet-door.webp"'));
  assert.ok(!html.includes('src="./assets/login-cabinet-door.png"'));
  assert.ok(html.includes('fetchpriority="high"'));
  assert.ok(html.includes('alt="绳记柜门"'));
  assert.ok(fs.existsSync(loginPngPath));
  assert.ok(fs.existsSync(loginWebpPath));
  assert.ok(fs.existsSync(homeSignPngPath));
  assert.ok(fs.existsSync(homeSignWebpPath));
  assert.ok(fs.statSync(loginWebpPath).size < 180000);
  assert.ok(fs.statSync(loginPngPath).size < 900000);
  assert.ok(fs.statSync(homeSignWebpPath).size < 90000);
  assert.ok(fs.statSync(homeSignPngPath).size < 120000);
  assert.ok(html.includes('id="loginEnterAction"'));
  assert.ok(html.includes('class="login-enter-glow"'));
  assert.ok(!html.includes('login-title'));
  assert.ok(!html.includes('login-handle-icon'));
  assert.ok(!html.includes('login-rope-corner'));
  assert.ok(pagesHtml.includes('id="loginGate"'));
  assert.ok(pagesHtml.includes('class="login-gate image-login-gate"'));
  assert.ok(pagesHtml.includes('src="./web/assets/login-cabinet-door.webp"'));
  assert.ok(pagesHtml.includes('srcset="./web/assets/login-cabinet-door.webp"'));
  assert.ok(!pagesHtml.includes('src="./web/assets/login-cabinet-door.png"'));
  assert.ok(pagesHtml.includes('src="./web/assets/home-rope-sign-transparent.webp"'));
  assert.ok(pagesHtml.includes('srcset="./web/assets/home-rope-sign-transparent.webp"'));
  assert.ok(!pagesHtml.includes('src="./web/assets/home-rope-sign-transparent.png"'));
  assert.ok(js.includes("const loginEnterAction = document.querySelector('#loginEnterAction');"));
  assert.ok(js.includes("loginGate.addEventListener('click', enterLoginGate);"));
  assert.ok(js.includes("phone.classList.remove('login-mode');"));
  assert.ok(css.includes('.login-gate'));
  assert.ok(css.includes('.login-cabinet-frame'));
  assert.ok(css.includes('.login-cabinet-picture'));
  assert.ok(css.includes('.login-cabinet-image'));
  assert.ok(css.includes('.login-enter-action'));
  assert.ok(css.includes('.login-enter-glow'));
  assert.ok(!css.includes('.login-title'));
  assert.ok(!css.includes('.login-handle-icon'));
  assert.ok(!css.includes('.login-rope-corner'));
  assert.ok(cssBlock('.login-gate').includes('place-items: center'));
  assert.ok(cssBlock('.login-cabinet-frame').includes('width: calc(100% - 2px)'));
  assert.ok(cssBlock('.login-cabinet-frame').includes('aspect-ratio: 959 / 1640'));
  assert.ok(css.includes('object-fit: contain'));
  assert.ok(cssBlock('.login-enter-action').includes('top: 59.4%'));
  assert.ok(cssBlock('.login-enter-action').includes('width: 36%'));
  assert.ok(cssBlock('.login-enter-action').includes('aspect-ratio: 1'));
  assert.ok(html.includes('id="homePage"'));
  assert.ok(html.includes('id="pullBridgeRope"'));
  assert.ok(html.includes('我的绳'));
  assert.ok(html.includes('class="home-title" aria-label="我的绳"'));
  assert.ok(html.includes('class="home-title-picture"'));
  assert.ok(html.includes('class="home-title-image"'));
  assert.ok(html.includes('srcset="./assets/home-rope-sign-transparent.webp"'));
  assert.ok(html.includes('src="./assets/home-rope-sign-transparent.webp"'));
  assert.ok(!html.includes('src="./assets/home-rope-sign-transparent.png"'));
  assert.ok(!html.includes('loading="lazy"'));
  assert.ok(html.includes('alt="我的绳牌匾"'));
  assert.ok(html.includes('id="ropeShelf"'));
  assert.ok(html.includes('class="rope-shelf"'));
  assert.ok(html.includes('id="addRopeAction"'));
  assert.ok(html.includes('class="home-control-bar"'));
  assert.ok(html.includes('settings-gear-logo'));
  assert.ok(html.includes('<svg viewBox="0 0 24 24"'));
  assert.ok(html.includes('search-icon'));
  assert.ok(html.includes('class="search-icon-handle"'));
  assert.ok(html.includes('class="search-icon-glint"'));
  assert.ok(html.includes('class="add-rope-plus"'));
  assert.ok(!html.includes('<span>添加</span>'));
  assert.ok(html.includes('id="backHomeAction"'));
  assert.ok(!html.includes('<h1 class="home-title"><span>我的绳</span></h1>'));
  assert.ok(html.includes('>返回</button>'));
  assert.ok(html.includes('id="addRopePage"'));
  assert.ok(html.includes('id="addRopeBack"'));
  assert.ok(html.includes('选择你的绳结模式'));
  assert.ok(html.includes('data-rope-mode="single"'));
  assert.ok(html.includes('data-rope-mode="couple"'));
  assert.ok(html.includes('aria-label="选择单人绳结模式"'));
  assert.ok(html.includes('aria-label="选择双人绳结模式"'));
  assert.ok(html.includes('href="./assets/rope-mode-single-cutout.webp"'));
  assert.ok(html.includes('href="./assets/rope-mode-couple-cutout.webp"'));
  assert.ok(html.includes('href="./assets/add-rope-tail-v1.webp"'));
  assert.ok(html.includes('srcset="./assets/rope-mode-single-cutout.webp"'));
  assert.ok(html.includes('src="./assets/rope-mode-single-cutout.png"'));
  assert.ok(html.includes('srcset="./assets/rope-mode-couple-cutout.webp"'));
  assert.ok(html.includes('src="./assets/rope-mode-couple-cutout.png"'));
  assert.ok(html.includes('srcset="./assets/add-rope-tail-v1.webp"'));
  assert.ok(html.includes('src="./assets/add-rope-tail-v1.png"'));
  assert.ok(html.includes('id="addRopeNameInput"'));
  assert.ok(html.includes('placeholder="输入绳子的名字"'));
  assert.ok(html.includes('id="createRopeFromAddPage"'));
  assert.ok(html.includes('class="add-rope-rope"'));
  assert.ok(!html.includes('id="addRopeHint"'));
  assert.ok(!html.includes('必须提前选择单人或双人并命名后，才可创建'));
  assert.ok(!html.includes('id="ropeNameCard"'));
  assert.ok(!html.includes('id="ropeNameInput"'));
  assert.ok(!html.includes('给这根绳命名'));
  assert.ok(!html.includes('放进柜子'));
  assert.ok(html.includes('id="homeSearchToggle"'));
  assert.ok(html.includes('id="globalSearchDock"'));
  assert.ok(html.includes('</section>\n\n      <aside id="globalSearchDock"'));
  assert.ok(html.includes('id="globalSearchInput"'));
  assert.ok(html.includes('placeholder="搜所有绳"'));
  assert.ok(pagesHtml.includes('id="homePage"'));
  assert.ok(pagesHtml.includes('id="addRopePage"'));
  assert.ok(pagesHtml.includes('href="./web/assets/rope-mode-single-cutout.webp"'));
  assert.ok(pagesHtml.includes('href="./web/assets/rope-mode-couple-cutout.webp"'));
  assert.ok(pagesHtml.includes('href="./web/assets/add-rope-tail-v1.webp"'));
  assert.ok(pagesHtml.includes('srcset="./web/assets/rope-mode-single-cutout.webp"'));
  assert.ok(pagesHtml.includes('src="./web/assets/rope-mode-single-cutout.png"'));
  assert.ok(pagesHtml.includes('srcset="./web/assets/rope-mode-couple-cutout.webp"'));
  assert.ok(pagesHtml.includes('src="./web/assets/rope-mode-couple-cutout.png"'));
  assert.ok(pagesHtml.includes('srcset="./web/assets/add-rope-tail-v1.webp"'));
  assert.ok(pagesHtml.includes('src="./web/assets/add-rope-tail-v1.png"'));
  assert.ok(pagesHtml.includes('id="globalSearchDock"'));
  assert.ok(fs.existsSync(addRopeTailPngPath));
  assert.ok(fs.existsSync(addRopeTailWebpPath));
  assert.ok(fs.statSync(addRopeTailPngPath).size < 40000);
  assert.ok(fs.statSync(addRopeTailWebpPath).size < 16000);
  assert.ok(js.includes('const HOME_STORAGE_KEY'));
  assert.ok(js.includes("const HOME_STORAGE_KEY = 'rope-talk-web-home-state-v3'"));
  assert.ok(js.includes('const ROPE_STATE_PREFIX'));
  assert.ok(js.includes('const DEFAULT_ROPE_ID'));
  assert.ok(js.includes('function defaultRopes('));
  assert.ok(defaultRopesStart >= 0);
  assert.ok(js.slice(defaultRopesStart, defaultRopesStart + 80).includes('return [];'));
  assert.ok(js.includes('function ropeStateKey('));
  assert.ok(js.includes('function loadHomeState('));
  assert.ok(js.includes('function saveRopeState('));
  assert.ok(js.includes('function enterRope('));
  assert.ok(js.includes('function goHome('));
  assert.ok(js.includes('function addRope('));
  assert.ok(js.includes('function openAddRopePage('));
  assert.ok(js.includes('function selectRopeMode('));
  assert.ok(js.includes('function updateAddRopeFormState('));
  assert.ok(js.includes('function createNamedRopeFromAddPage('));
  assert.ok(js.includes('function revealCreatedRope('));
  assert.ok(js.includes('function clearTransientRopeState('));
  assert.ok(js.includes("mode: pendingRopeMode"));
  assert.ok(js.includes("classList.add('new-rope-tile')"));
  assert.ok(js.includes("ropeShelf.querySelectorAll('[data-rope-id]')"));
  assert.ok(!js.includes('addRopeHint'));
  assert.ok(!js.includes('function openRopeNameModal('));
  assert.ok(!js.includes('function addNamedRope('));
  assert.ok(js.includes("activeRopeId = homeState.activeRopeId || homeState.ropes[0]?.id || '';"));
  assert.ok(js.includes('let state = activeRopeId ? loadState() : emptyState();'));
  assert.ok(js.includes('saveRopeState(rope.id, emptyState())'));
  assert.ok(js.includes('state = loadState();'));
  assert.ok(js.includes('if (!activeRopeId) return;'));
  assert.ok(js.includes('function renderHome('));
  assert.ok(js.includes('style="--home-rows: ${rows}"'));
  assert.ok(js.includes('class="cabinet-top"'));
  assert.ok(js.includes('class="cabinet-bottom"'));
  assert.ok(js.includes('--row-center'));
  assert.ok(js.includes('function globalSearchItems('));
  assert.ok(js.includes('function renderGlobalSearchList('));
  assert.ok(js.includes('function updateFloatingDockBounds('));
  assert.ok(!js.includes('globalSearchInput.focus()'));
  assert.ok(js.includes("document.documentElement.style.setProperty('--global-search-left'"));
  assert.ok(!js.includes("phone.classList.toggle('search-open'"));
  assert.ok(js.includes('function stabilizeHomeAfterSearchOpen('));
  assert.ok(js.includes('function clearSearchHomeStabilizer('));
  assert.ok(js.includes('function rememberHomeRestingPosition('));
  assert.ok(js.includes('function primeRopeTransitionView('));
  assert.ok(js.includes('function completePrimedRopeTransition('));
  assert.ok(js.includes('enterRope(button.dataset.ropeId);'));
  assert.ok(!js.includes('playHomePullTransition(button, button.dataset.ropeId);'));
  assert.ok(!js.includes("ropeShelf.addEventListener('pointerdown', startHomePullDrag)"));
  assert.ok(!js.includes("ropeShelf.addEventListener('pointermove', updateHomePullDrag)"));
  assert.ok(!js.includes("ropeShelf.addEventListener('pointerup', finishHomePullDrag)"));
  assert.ok(!js.includes("phone.addEventListener('pointerdown', startHomePullDrag)"));
  assert.ok(!js.includes("phone.addEventListener('pointermove', updateHomePullDrag)"));
  assert.ok(!js.includes("phone.addEventListener('pointerup', finishHomePullDrag)"));
  assert.ok(!js.includes("phone.classList.add('home-pull-centering')"));
  assert.ok(!js.includes("phone.classList.add('home-pull-dragging')"));
  assert.ok(!js.includes("phone.classList.add('home-pull-returning')"));
  assert.ok(!js.includes("phone.classList.add('home-pull-revealing')"));
  assert.ok(!js.includes("phone.classList.add('home-pull-drop')"));
  assert.ok(!js.includes("button.classList.add('focus-rope-tile')"));
  assert.ok(!js.includes("button.classList.add('pulling-rope')"));
  assert.ok(!js.includes("activeHomePull.button.classList.add('dragging-rope')"));
  assert.ok(!js.includes('if (activeHomePull.dragY >= activeHomePull.threshold) commitHomePullDrag();'));
  assert.ok(!js.includes('}, 620);'));
  assert.ok(!js.includes('}, 2440);'));
  assert.ok(!js.includes("button.classList.add('pulling-rope-again')"));
  assert.ok(!js.includes("phone.classList.add('home-pull-ready')"));
  assert.ok(!js.includes('function createHomePullGhost('));
  assert.ok(js.includes('homeSearchToggle.blur();'));
  assert.ok(js.includes('saveRopeState(activeRopeId, state)'));
  assert.ok(js.includes('homeState.ropes.flatMap'));
  assert.ok(js.includes('ropeShelf.addEventListener'));
  assert.ok(js.includes('globalSearchList.addEventListener'));
  assert.ok(css.includes('.home-page'));
  assert.ok(cssBlock('.home-page').includes('position: relative'));
  assert.ok(cssBlock('.home-page').includes('grid-template-rows: auto 1fr'));
  assert.ok(!cssBlock('.home-page').includes('position: absolute'));
  assert.ok(css.includes('.home-page.search-stabilized'));
  assert.ok(css.includes('.home-title::before'));
  assert.ok(css.includes('.home-title-image'));
  assert.ok(css.includes('.rope-shelf'));
  assert.ok(css.includes('--home-rows'));
  assert.ok(css.includes('grid-template-rows: repeat(var(--home-rows), 135px)'));
  assert.ok(css.includes('align-content: start'));
  assert.ok(css.includes('height: max(100%, calc(var(--home-rows) * 135px + 72px))'));
  assert.ok(css.includes('.cabinet-row'));
  assert.ok(css.includes('.cabinet-slot'));
  assert.ok(css.includes('.empty-slot'));
  assert.ok(css.includes('.cabinet-top'));
  assert.ok(css.includes('.cabinet-bottom'));
  assert.ok(cssBlock('.cabinet-top', 'top: 8px;').includes('height: 13px'));
  assert.ok(cssBlock('.cabinet-bottom', 'right: -12px;').includes('height: 13px'));
  assert.ok(css.includes('.cabinet-front'));
  assert.ok(css.includes('.cabinet-front::before'));
  assert.ok(css.includes('.cabinet-back'));
  assert.ok(css.includes('.cabinet-slots'));
  assert.ok(cssBlock('.cabinet-slots').includes('z-index: 9'));
  assert.ok(!js.includes('CABINET_ROPE_IMAGE_URL'));
  assert.ok(!js.includes('class="rope-photo"'));
  assert.ok(js.includes('class="rope-coil"'));
  assert.ok(js.includes('class="rope-coil-line rope-coil-line-a"'));
  assert.ok(fs.existsSync(singleModePngPath));
  assert.ok(fs.existsSync(singleModeWebpPath));
  assert.ok(fs.existsSync(coupleModePngPath));
  assert.ok(fs.existsSync(coupleModeWebpPath));
  assert.ok(fs.existsSync(pullRopePngPath));
  assert.ok(fs.statSync(singleModeWebpPath).size < 30000);
  assert.ok(fs.statSync(coupleModeWebpPath).size < 35000);
  assert.ok(fs.statSync(singleModePngPath).size < 30000);
  assert.ok(fs.statSync(coupleModePngPath).size < 45000);
  assert.ok(fs.statSync(pullRopePngPath).size < 70000);
  assert.ok(!css.includes('.rope-photo'));
  assert.ok(cssBlock('.rope-tile::after').includes('repeating-linear-gradient(164deg'));
  assert.ok(cssBlock('.rope-tile::after').includes('background-blend-mode: multiply, screen, normal'));
  assert.ok(cssBlock('.rope-coil').includes('contrast(1.03)'));
  assert.ok(cssBlock('.rope-coil-line').includes('repeating-linear-gradient(155deg'));
  assert.ok(!css.includes('.home-pull-ghost'));
  assert.ok(css.includes('.rope-tile.pulling-rope .rope-coil'));
  assert.ok(css.includes('.home-mode.home-pull-centering .rope-tile.pulling-rope::after'));
  assert.ok(!css.includes('.rope-tile.pulling-rope:not(.pulling-rope-again) .rope-coil'));
  assert.ok(!css.includes('.rope-tile.pulling-rope.pulling-rope-again .rope-coil'));
  assert.ok(css.includes('.home-page::after'));
  assert.ok(css.includes('.rope-tile.focus-rope-tile'));
  assert.ok(cssBlock('.rope-tile.focus-rope-tile').includes('outline: 0'));
  assert.ok(css.includes('.home-mode.home-pull-centering .cabinet-stack'));
  assert.ok(css.includes('.home-mode.home-pull-centering .rope-shelf'));
  assert.ok(css.includes('.home-mode.home-pull-centering .cabinet-slot::before'));
  assert.ok(cssBlock('.home-mode.home-pull-centering .rope-shelf').includes('z-index: 44'));
  assert.ok(cssBlock('.home-mode.home-pull-centering .rope-shelf').includes('overflow: visible'));
  assert.ok(cssBlock('.home-mode.home-pull-centering .cabinet-stack').includes('z-index: 44'));
  assert.ok(cssBlock('.home-mode.home-pull-centering .cabinet-stack').includes('overflow: visible'));
  assert.ok(css.includes('.home-mode.home-pull-centering .rope-tile.focus-rope-tile::before'));
  assert.ok(css.includes('.home-mode.home-pull-centering .rope-tile.focus-rope-tile .rope-coil'));
  assert.ok(css.includes('.home-mode.home-pull-centering .rope-tile.focus-rope-tile::after'));
  assert.ok(cssBlock('.home-mode.home-pull-centering .rope-tile.focus-rope-tile::after').includes('width: 18px'));
  assert.ok(cssBlock('.home-mode.home-pull-centering .rope-tile.focus-rope-tile::after').includes('height: 552px'));
  assert.ok(cssBlock('.home-mode.home-pull-centering .rope-tile.focus-rope-tile::after').includes('repeating-linear-gradient(176deg'));
  assert.ok(cssBlock('.home-mode.home-pull-centering .rope-tile.focus-rope-tile::after').includes('background-blend-mode: multiply, screen, normal'));
  assert.ok(!css.includes('url("./assets/pull-rope-full-v1.png")'));
  assert.ok(cssBlock('.home-mode.home-pull-centering .rope-tile.focus-rope-tile .rope-coil').includes('opacity: 1'));
  assert.ok(css.includes('.home-mode.home-pull-centering .rope-tile.focus-rope-tile .rope-coil-line-b'));
  assert.ok(css.includes('linear-gradient(180deg, #caa36f, #caa36f)'));
  assert.ok(css.includes('clip-path: polygon'));
  assert.ok(css.includes('drop-shadow(0 11px 12px rgba(55, 32, 13, 0.28))'));
  assert.ok(css.includes('animation: focusWoodBackingFade'));
  assert.ok(css.includes('.home-mode.home-pull-centering .rope-tile.focus-rope-tile.dragging-rope'));
  assert.ok(css.includes('.home-mode.home-pull-centering .rope-tile.focus-rope-tile.dragging-rope::after'));
  assert.ok(css.includes('.home-mode.home-pull-centering .cabinet-slots'));
  assert.ok(css.includes('.home-mode.home-pull-centering .rope-tile:not(.focus-rope-tile)'));
  assert.ok(css.includes('.home-mode.home-pull-revealing .rope-canvas'));
  assert.ok(css.includes('.pull-bridge-rope'));
  assert.ok(css.includes('.home-mode.home-pull-revealing .pull-bridge-rope'));
  assert.ok(css.includes('animation: ropePageReveal 1540ms'));
  assert.ok(css.includes('animation: pullBridgeRopeReveal 1540ms'));
  assert.ok(css.includes('animation: homePullDrop 1500ms'));
  assert.ok(css.includes('.home-mode.home-pull-centering .home-page'));
  assert.ok(css.includes('.home-mode.home-pull-centering.home-pull-dragging .home-page'));
  assert.ok(css.includes('.home-mode.home-pull-centering.home-pull-returning .home-page'));
  assert.ok(css.includes('var(--pull-drag-y, 0px)'));
  assert.ok(css.includes('var(--pull-cord-y, 0px)'));
  assert.ok(css.includes('.home-mode.home-pull-drop .home-page'));
  assert.ok(css.includes('will-change: transform, opacity'));
  assert.ok(css.includes('translate3d(var(--pull-zoom-x, 0), var(--pull-zoom-y, 0), 0)'));
  assert.ok(!css.includes('filter: blur(1.1px)'));
  assert.ok(!css.includes('filter: blur(0.8px) saturate(0.86)'));
  assert.ok(css.includes('@keyframes homeSceneFocus'));
  assert.ok(css.includes('@keyframes focusSurroundingFade'));
  assert.ok(css.includes('opacity: 0;'));
  assert.ok(css.includes('@keyframes focusSurroundingsVanish'));
  assert.ok(css.includes('opacity: 1;'));
  assert.ok(css.includes('@keyframes focusWoodBackingFade'));
  assert.ok(css.includes('@keyframes focusRopeStemReveal'));
  assert.ok(!css.includes('@keyframes focusCordTestPull'));
  assert.ok(!css.includes('@keyframes focusCordStemTestPull'));
  assert.ok(css.includes('@keyframes focusCordPagePull'));
  assert.ok(css.includes('@keyframes focusCordStemPagePull'));
  assert.ok(css.includes('@keyframes ropePageReveal'));
  assert.ok(css.includes('transform: translate3d(0, -500px, 0) scale(0.992)'));
  assert.ok(css.includes('transform: translate3d(0, -132px, 0) scale(0.997)'));
  assert.ok(css.includes('@keyframes pullBridgeRopeReveal'));
  assert.ok(css.includes('transform: translate3d(-50%, -500px, 0) scaleY(0.99)'));
  assert.ok(css.includes('@keyframes homePullDrop'));
  assert.ok(!css.includes('scale(calc(var(--pull-zoom-scale, 2.75) + 0.08)'));
  assert.ok(css.includes('.rope-note'));
  assert.ok(cssBlock('.rope-note').includes('bottom: -25px'));
  assert.ok(cssBlock('.rope-note').includes('var(--note-paper-a'));
  assert.ok(js.includes('const ROPE_NOTE_PALETTES'));
  assert.ok(js.includes('function ropeNotePaletteStyle'));
  assert.ok(js.includes('usedNotePaletteIndexes'));
  assert.ok(js.includes('while (usedPaletteIndexes.has(paletteIndex)'));
  assert.strictEqual((js.match(/function hashText/g) || []).length, 1);
  assert.ok(js.includes('--note-paper-a'));
  assert.ok(css.includes('.rope-add-page'));
  assert.ok(css.includes('.phone.add-rope-mode .rope-add-page'));
  assert.ok(css.includes('.rope-mode-card.selected'));
  assert.ok(css.includes('.rope-mode-card.selected::after'));
  assert.ok(css.includes('.add-rope-name-input'));
  assert.ok(css.includes('.add-rope-name-input::placeholder'));
  assert.ok(css.includes('.add-rope-rope'));
  assert.ok(css.includes('.add-rope-tail-picture'));
  assert.ok(css.includes('.add-rope-tail-image'));
  assert.ok(css.includes('.rope-tile.new-rope-tile'));
  assert.ok(cssBlock('.rope-mode-orbit').includes('border-radius: 50%'));
  assert.ok(cssBlock('.rope-mode-orbit').includes('overflow: hidden'));
  assert.ok(cssBlock('.add-rope-rope').includes('filter: drop-shadow'));
  assert.ok(!cssBlock('.add-rope-rope').includes('clip-path'));
  assert.ok(cssBlock('.create-rope-action').includes('position: absolute'));
  assert.ok(cssBlock('.create-rope-action').includes('bottom: 0'));
  assert.ok(css.includes('.create-rope-action:disabled'));
  assert.ok(css.includes('.home-control-bar'));
  assert.ok(css.includes('.control-icon'));
  assert.ok(css.includes('.settings-gear-logo'));
  assert.ok(css.includes('.settings-gear-logo svg'));
  assert.ok(css.includes('.search-icon'));
  assert.ok(cssBlock('.search-icon').includes('width: 30px'));
  assert.ok(cssBlock('.search-icon svg').includes('stroke-width: 6'));
  assert.ok(cssBlock('.search-icon .search-icon-handle').includes('stroke-width: 8'));
  assert.ok(css.includes('.add-rope-action'));
  assert.ok(cssBlock('.home-control-bar').includes('grid-template-columns: 48px 50px 48px'));
  assert.ok(cssBlock('.home-control-bar').includes('padding: 5px 14px'));
  assert.ok(cssBlock('.home-control-bar').includes('bottom: 25px'));
  assert.ok(cssBlock('.add-rope-action').includes('position: absolute'));
  assert.ok(cssBlock('.add-rope-action').includes('width: 50px'));
  assert.ok(cssBlock('.add-rope-action').includes('opacity: 0.84'));
  assert.ok(css.includes('.add-rope-plus'));
  assert.ok(cssBlock('.add-rope-plus').includes('margin-top: -6px'));
  assert.ok(cssBlock('.add-rope-plus').includes('transform: translateY(-2px)'));
  assert.ok(css.includes('.home-mode .home-control-bar .settings-toggle'));
  assert.ok(css.includes('.home-mode .home-control-bar .home-search-toggle'));
  assert.ok(css.includes('.home-mode .home-control-bar .add-rope-action'));
  assert.ok(cssBlock('.home-mode .home-control-bar .add-rope-action', 'width: 46px').includes('transform: translateY(3px) rotate(-1.5deg)'));
  assert.ok(cssBlock('.home-mode .home-control-bar .add-rope-plus').includes('transform: translateY(1px)'));
  assert.ok(css.includes('width: 38px'));
  assert.ok(css.includes('width: 46px'));
  assert.ok(css.includes('writing-mode: horizontal-tb'));
  assert.ok(css.includes('.phone.rope-mode .settings-toggle'));
  assert.ok(css.includes('.back-home-action::before'));
  assert.ok(css.includes('.global-search-dock'));
  assert.ok(css.includes('position: fixed'));
  assert.ok(css.includes('--global-search-left'));
  assert.ok(css.includes('.global-search-entry'));
  assert.ok(css.includes('.home-mode .rope-canvas'));
  assert.ok(css.includes('.phone:not(.home-mode) .home-page'));
});

test('browser preview only starts writing from the journal action, not blank rope taps', () => {
  assert.ok(js.includes('function openWriteFromExchange()'));
  assert.ok(js.includes('pendingAnchorY = nextVisibleAnchorY();'));
  assert.ok(js.includes('writeKnotAction.addEventListener'));
  assert.ok(js.includes('openNote();'));
  assert.ok(!js.includes('if (Math.abs(point.x - ropeX) <= 54)'));
  assert.ok(!js.includes('pendingAnchorY = Math.max(130, scrollY + point.y);'));
  assert.ok(!miniPage.includes('if (Math.abs(point.x - this.ropeX) <= 54)'));
  assert.ok(!miniPage.includes("this.setData({ showNote: true, noteText: '' });"));
});

test('browser preview adds a left settings drawer with confirmed reset', () => {
  assert.ok(html.includes('id="settingsToggle"'));
  assert.ok(html.includes('class="settings-toggle"'));
  assert.ok(html.includes('aria-controls="settingsDock"'));
  assert.ok(html.includes('id="settingsDock"'));
  assert.ok(html.includes('aria-hidden="true"'));
  assert.ok(html.includes('id="settingsClose"'));
  assert.ok(html.includes('class="dock-close"'));
  assert.ok(html.includes('点 × 收起，重置前会再确认。'));
  assert.ok(html.includes('id="resetPreviewAction"'));
  assert.ok(html.includes('回到空柜子'));
  assert.ok(html.includes('会清空本机保存的绳、结、印记和选中状态'));
  assert.ok(html.includes('id="resetConfirmPanel"'));
  assert.ok(html.includes('id="confirmResetAction"'));
  assert.ok(html.includes('id="cancelResetAction"'));
  assert.ok(pagesHtml.includes('id="settingsToggle"'));
  assert.ok(js.includes('const settingsToggle'));
  assert.ok(js.includes('const resetConfirmPanel'));
  assert.ok(js.includes('function toggleSettingsDock('));
  assert.ok(js.includes('function isSettingsDockOpen('));
  assert.ok(js.includes('function closeFloatingDocks('));
  assert.ok(js.includes('function askResetConfirmation('));
  assert.ok(js.includes('function emptyState('));
  assert.ok(js.includes('function resetPreviewState('));
  assert.ok(js.includes('function clearStoredRopeStates('));
  assert.ok(js.includes('clearStoredRopeStates();'));
  assert.ok(js.includes('homeState = defaultHomeState();'));
  assert.ok(js.includes("activeRopeId = '';"));
  assert.ok(js.includes('state = emptyState()'));
  assert.ok(js.includes('events: []'));
  assert.ok(!js.includes('state = demoState()'));
  assert.ok(js.includes('saveHomeState();'));
  assert.ok(js.includes("phone.classList.add('home-mode')"));
  assert.ok(js.includes("window.addEventListener('load', updateCanvasSize)"));
  assert.ok(js.includes('requestAnimationFrame(updateCanvasSize)'));
  assert.ok(js.includes('localStorage.setItem(ropeStateKey(id), JSON.stringify(nextState))'));
  assert.ok(js.includes("lastTimelineSignature = '__reset__'"));
  assert.ok(js.includes('settingsToggle.addEventListener'));
  assert.ok(js.includes('resetPreviewAction.addEventListener'));
  assert.ok(js.includes('confirmResetAction.addEventListener'));
  assert.ok(css.includes('.settings-toggle'));
  assert.ok(cssBlock('.settings-toggle.open').includes('opacity: 0.96'));
  assert.ok(cssBlock('.settings-toggle.open').includes('pointer-events: auto'));
  assert.ok(cssBlock('.home-mode .home-control-bar .settings-toggle.open').includes('opacity: 1'));
  assert.ok(cssBlock('.home-mode .home-control-bar .settings-toggle.open').includes('pointer-events: auto'));
  assert.ok(css.includes('.settings-dock.open'));
  assert.ok(css.includes('.dock-close'));
  assert.ok(css.includes('.drawer-hint'));
  assert.ok(css.includes('.reset-confirm-panel'));
  assert.ok(css.includes('left: 8px'));
  assert.ok(css.includes('right: 8px'));
});

test('browser preview adds a notebook for reviewing resolved knots and badges', () => {
  assert.ok(html.includes('id="notebookCard"'));
  assert.ok(html.includes('id="notebookList"'));
  assert.ok(html.includes('id="notebookSearch"'));
  assert.ok(html.includes('placeholder="搜索"'));
  assert.ok(html.includes('class="notebook-title-row"'));
  assert.ok(html.includes('绳本'));
  assert.ok(html.includes('收好'));
  assert.ok(html.includes('解开的结、留下的印记和印章'));
  assert.ok(js.includes('const notebookAction'));
  assert.ok(js.includes('const notebookList'));
  assert.ok(js.includes('const notebookSearch'));
  assert.ok(js.includes('function openNotebook('));
  assert.ok(js.includes('function notebookItems('));
  assert.ok(js.includes('function notebookMatches('));
  assert.ok(js.includes('function renderNotebookList('));
  assert.ok(js.includes('function openNotebookItem('));
  assert.ok(js.includes("notebookSearch.addEventListener('input'"));
  assert.ok(js.includes('resolutionLine'));
  assert.ok(js.includes("return '印章';"));
  assert.ok(css.includes('.notebook-list'));
  assert.ok(css.includes('.notebook-entry'));
  assert.ok(css.includes('.notebook-title-row'));
  assert.ok(css.includes('.notebook-search'));
});

test('browser preview notebook search only returns written or resolved records', () => {
  const notebookSearchStart = js.indexOf('function notebookMatches(');
  const notebookSearchEnd = js.indexOf('function renderNotebookList(', notebookSearchStart);
  const notebookSearchBlock = js.slice(notebookSearchStart, notebookSearchEnd);
  assert.ok(js.includes("if (query && item.type === 'badge') return false;"));
  assert.ok(notebookSearchBlock.indexOf("if (query && item.type === 'badge') return false;") < notebookSearchBlock.indexOf('const haystack = ['));
  assert.ok(notebookSearchBlock.includes('notebookTitle(item),'));
  assert.ok(notebookSearchBlock.includes('notebookCopy(item),'));
  assert.ok(js.includes("const items = notebookItems().filter((item) => notebookMatches(item, query));"));
  assert.ok(html.includes(`styles.css?v=${assetVersion}`));
  assert.ok(html.includes(`app.js?v=${assetVersion}`));
});

test('browser preview keeps knot detail cards inside the phone frame', () => {
  const phoneStart = html.indexOf('<section class="phone kraft-paper"');
  const phoneEnd = html.indexOf('    </main>', phoneStart);
  const modalIndex = html.indexOf('id="modalLayer"');
  const modalBlock = cssBlock('.modal-layer');
  const cardBlock = cssBlock('.paper-card', 'position: relative;');
  assert.ok(modalIndex > phoneStart);
  assert.ok(modalIndex < phoneEnd);
  assert.ok(modalBlock.includes('position: absolute'));
  assert.ok(!modalBlock.includes('position: fixed'));
  assert.ok(modalBlock.includes('border-radius: inherit'));
  assert.ok(cardBlock.includes('width: min(394px, 100%)'));
});

test('browser preview replaces time-flip controls with a vertical record timeline', () => {
  assert.ok(!html.includes('id="timeTabButton"'));
  assert.ok(!html.includes('id="timeDemoPanel"'));
  assert.ok(!html.includes('时间翻页'));
  assert.ok(!html.includes('data-time-offset'));
  assert.ok(!js.includes('function previewNow()'));
  assert.ok(!js.includes('timeDemoPanel.addEventListener'));
  assert.ok(html.includes('id="timelineToggle"'));
  assert.ok(html.includes('aria-controls="recordTimelineDock"'));
  assert.ok(html.includes('id="recordTimelineDock"'));
  assert.ok(html.includes('aria-hidden="true"'));
  assert.ok(html.includes('id="recordTimelineList"'));
  assert.ok(html.includes('绳历'));
  assert.ok(js.includes('function updateRecordTimeline('));
  assert.ok(js.includes('function toggleRecordTimeline('));
  assert.ok(js.includes('timelineToggle.addEventListener'));
  assert.ok(js.includes('timelineItems()'));
  assert.ok(js.includes('function focusTimelineEvent('));
  assert.ok(js.includes('recordTimelineList.addEventListener'));
  assert.ok(html.includes('id="timelineClose"'));
  assert.ok(html.includes('点日期会圈住绳上的位置，再点一次取消。'));
  assert.ok(css.includes('.record-timeline-body'));
  assert.ok(css.includes('.timeline-hint'));
  assert.ok(js.includes("const kind = item.type === 'badge' ? '印章'"));
  assert.ok(js.includes("recordTimelineList.innerHTML = '<div class=\"record-timeline-empty\"><span>还没有</span><span>记录</span></div>';"));
  assert.ok(!js.includes('timelineItems().slice(-8)'));
  assert.ok(css.includes('.timeline-toggle'));
  assert.ok(css.includes('.record-timeline-dock.open'));
  assert.ok(css.includes('.record-timeline-item.badge::before'));
  assert.ok(css.includes('.record-timeline-dock'));
  assert.ok(css.includes('.record-timeline-item'));
  assert.ok(css.includes('.record-timeline-list'));
  assert.ok(css.includes('overflow-y: auto'));
  assert.ok(css.includes('.record-timeline-empty span'));
  assert.ok(css.includes('writing-mode: vertical-rl'));
  assert.ok(!js.includes('相伴100天'));
  assert.ok(!js.includes('和平30天'));
});

test('browser preview highlights the selected rope item from the timeline', () => {
  assert.ok(js.includes('let selectedTimelineId'));
  assert.ok(js.includes('function isRecordTimelineOpen('));
  assert.ok(js.includes("if (item.id === selectedTimelineId && isRecordTimelineOpen())"));
  assert.ok(js.includes("if (isRecordTimelineOpen()) {\n    if (hit) focusTimelineEvent(hit.id);"));
  assert.ok(js.indexOf('if (isRecordTimelineOpen())') < js.indexOf("if (hit.type === 'badge')"));
  assert.ok(js.includes("else {\n      selectedTimelineId = '';"));
  assert.ok(js.includes('const isSelectedAgain = selectedTimelineId === id'));
  assert.ok(js.includes("selectedTimelineId = isSelectedAgain ? '' : id"));
  assert.ok(js.includes("if (!selectedTimelineId)"));
  assert.ok(js.includes('function drawTimelineHighlight('));
  assert.ok(js.includes('drawTimelineHighlight(item, screenY, index)'));
  assert.ok(js.includes('let shouldTimelineListScrollLatest = false'));
  assert.ok(js.includes('shouldTimelineListScrollLatest = true'));
  assert.ok(js.includes('recordTimelineList.scrollTop = recordTimelineList.scrollHeight'));
  assert.ok(js.includes("event.stopPropagation();"));
  assert.ok(js.includes('document.addEventListener(\'pointerdown\''));
  assert.ok(js.includes('if (insideSettings || insideTimeline || insideGlobalSearch || target === canvas) return;'));
  assert.ok(js.includes('closeFloatingDocks();'));
  assert.ok(js.includes('if (isSettingsDockOpen())'));
  assert.ok(js.includes('toggleRecordTimeline(false);'));
  assert.ok(js.includes('const HIGHLIGHT_INK'));
  assert.ok(js.includes("stroke: 'rgba(176, 37, 31, 0.82)'"));
  assert.ok(js.includes('ctx.lineWidth = ring ? 1.15 : 2.35'));
  assert.ok(js.includes("item.id === selectedTimelineId"));
  assert.ok(js.includes("record-timeline-item ${cssClass}${isSelected ? ' selected' : ''}"));
  assert.ok(css.includes('.record-timeline-item.selected'));
  assert.ok(css.includes('#a8322c'));
  assert.ok(css.includes('.exchange-dock.open .exchange-action'));
  assert.ok(css.includes('pointer-events: none'));
  assert.ok(css.includes('pointer-events: auto'));
  assert.ok(html.includes(`styles.css?v=${assetVersion}`));
  assert.ok(html.includes(`app.js?v=${assetVersion}`));
});

test('browser preview keeps the rope natural while selected items use red ink rings', () => {
  assert.ok(js.includes("const ROPE_BODY = '#ddc8a6'"));
  assert.ok(js.includes("const ROPE_EDGE = '#b89a72'"));
  assert.ok(js.includes("const ROPE_SHADOW = 'rgba(86, 63, 37, 0.22)'"));
  assert.ok(js.includes("const ROPE_HIGHLIGHT = 'rgba(248, 235, 205, 0.58)'"));
  assert.ok(js.includes('{ offset: 2.8, width: 14.5'));
  assert.ok(js.includes('{ offset: 0, width: 12.2'));
  assert.ok(js.includes('{ offset: 0, width: 9.4'));
  assert.ok(js.includes('{ offset: -2.1, width: 1.9'));
  assert.ok(js.includes("'rgba(248, 235, 202, 0.24)'"));
  assert.ok(js.includes("'rgba(92, 70, 47, 0.18)'"));
  assert.ok(!js.includes("const ROPE_BODY = '#9f3d3a'"));
  assert.ok(html.includes(`styles.css?v=${assetVersion}`));
  assert.ok(html.includes(`app.js?v=${assetVersion}`));
});

test('browser preview adds aged reward badges hanging from the rope', () => {
  assert.ok(js.includes('const REWARD_BADGE_NODES'));
  assert.ok(js.includes('function computeRewardBadges('));
  assert.ok(js.includes("family: 'checkin'"));
  assert.ok(js.includes("family: 'repair'"));
  assert.ok(js.includes('subtitleOptions'));
  assert.ok(js.includes('function pickBadgeSubtitle('));
  assert.ok(js.includes('hash = (hash * 31 + seed.charCodeAt(i)) >>> 0'));
  assert.ok(js.includes('subtitle: pickBadgeSubtitle(node, createdAt)'));
  assert.ok(!js.includes('subtitle: node.subtitle'));
  assert.ok(js.includes('function drawRewardBadge('));
  assert.ok(js.includes('function drawBadgeHanger('));
  assert.ok(js.includes('function drawBadgeRing('));
  assert.ok(js.includes('function drawBadgeAging('));
  assert.ok(js.includes('function drawCheckinBadgePlate('));
  assert.ok(js.includes('function drawRepairBadgeSeal('));
  assert.ok(js.includes('function drawBadgeMotif('));
  assert.ok(js.includes('drawBadgeMotif(item, widthTag, heightTag, palette, seed, isRepair, visual.motif)'));
  assert.ok(js.includes("item.family === 'repair'"));
  assert.ok(js.includes('badgeFamilyLabel(item)'));
  assert.ok(js.includes('const badgeY = y + 46'));
  assert.ok(js.includes("type: 'badge'"));
  assert.ok(!js.includes('ctx.fillText(item.mark'));
  assert.ok(!js.includes('badgeFamilyLabel(item), 0'));
  assert.ok(!js.includes('item.title.slice(0, 4)'));
  assert.ok(miniPage.includes('drawOrnamentMotif(ctx, item, x, y, colors, seed, isRepair, visual.motif)'));
  assert.ok(!miniPage.includes("ctx.fillText(item.mark || item.title.slice(0, 2)"));
  assert.ok(!miniPage.includes("ctx.fillText(isRepair ? '解结' : '打卡'"));
  assert.ok(js.includes('初页旧签'));
  assert.ok(js.includes('两日并肩章'));
  assert.ok(js.includes('三日墨夹'));
  assert.ok(js.includes('五日旧票'));
  assert.ok(js.includes('第一枚绳结'));
  assert.ok(js.includes('七日旧章'));
  assert.ok(js.includes('满月铜章'));
  assert.ok(js.includes('百日旧徽'));
  assert.ok(js.includes('一日平安签'));
  assert.ok(js.includes('平安旧夹'));
  assert.ok(js.includes('drawRewardBadge(item, screenY, index, badgeVariants.get(item.id))'));
  assert.ok(badgeMechanismDoc.includes('# 绳话勋章系统机制'));
  assert.ok(badgeMechanismDoc.includes('打卡型'));
  assert.ok(badgeMechanismDoc.includes('解结型'));
  assert.ok(badgeMechanismDoc.includes('初页旧签'));
  assert.ok(badgeMechanismDoc.includes('第一枚绳结'));
  assert.ok(badgeMechanismDoc.includes('七日旧章'));
  assert.ok(badgeMechanismDoc.includes('满月铜章'));
  assert.ok(badgeMechanismDoc.includes('百日旧徽'));
  assert.ok(badgeMechanismDoc.includes('第一枚和章'));
  assert.ok(badgeMechanismDoc.includes('平安旧夹'));
  assert.ok(badgeMechanismDoc.includes('稳定随机文案'));
  assert.ok(html.includes(`styles.css?v=${assetVersion}`));
  assert.ok(html.includes(`app.js?v=${assetVersion}`));
});

test('browser preview keeps knots, marks, and badges in chronological rope order', () => {
  assert.ok(js.includes('function sortForDisplay(items)'));
  assert.ok(js.includes('return sortByTime(items);'));
  assert.ok(!js.includes('function displayPriority('));
  assert.ok(!js.includes('previousPriority'));
  assert.ok(!js.includes('cursor += 176'));
  assert.ok(html.includes(`styles.css?v=${assetVersion}`));
  assert.ok(html.includes(`app.js?v=${assetVersion}`));
});

test('browser preview diversifies visible reward seals by color, motif, and hanger ink', () => {
  assert.ok(js.includes('const BADGE_TONES = ['));
  assert.ok(js.includes("'indigo'"));
  assert.ok(js.includes("'rose'"));
  assert.ok(js.includes("'verdigris'"));
  assert.ok(js.includes("'plum'"));
  assert.ok(js.includes("'ochre'"));
  assert.ok(js.includes("'lapis'"));
  assert.ok(js.includes('const BADGE_MOTIFS = ['));
  assert.ok(js.includes("'pinwheel'"));
  assert.ok(js.includes("'knotLoop'"));
  assert.ok(js.includes("'stitchedOval'"));
  assert.ok(js.includes("'seedCluster'"));
  assert.ok(js.includes('function assignVisibleBadgeVariants('));
  assert.ok(js.includes('function pickUnusedBadgeOption('));
  assert.ok(js.includes('const recentTones = []'));
  assert.ok(js.includes('const recentMotifs = []'));
  assert.ok(js.includes('const pageMemory = 6'));
  assert.ok(js.includes('const usedTones = new Set(recentTones)'));
  assert.ok(js.includes('const usedMotifs = new Set(recentMotifs)'));
  assert.ok(js.includes('usedTones.has(variant.tone)'));
  assert.ok(js.includes('usedMotifs.has(variant.motif)'));
  assert.ok(js.includes('const badgeVariants = assignVisibleBadgeVariants(layoutItems)'));
  assert.ok(js.includes('const palette = badgePalette(visual.tone)'));
  assert.ok(js.includes('ctx.strokeStyle = palette.cord'));
  assert.ok(js.includes('ctx.strokeStyle = palette.cordHighlight'));
  assert.ok(js.includes('ctx.strokeStyle = palette.ringShadow'));
  assert.ok(!js.includes("ctx.strokeStyle = 'rgba(67, 45, 28, 0.42)'"));
  assert.ok(!js.includes("ctx.strokeStyle = 'rgba(224, 196, 143, 0.44)'"));
  assert.ok(miniPage.includes('buildVisibleOrnamentVisuals(items, height)'));
  assert.ok(miniPage.includes('const BADGE_TONES'));
  assert.ok(miniPage.includes('const BADGE_MOTIFS'));
  assert.ok(miniPage.includes('drawOrnament(ctx, item, index, screenY, ornamentVisuals[item.id])'));
  assert.ok(miniPage.includes('this.drawOrnamentMotif(ctx, item, x, y, colors, seed, isRepair, visual.motif)'));
  assert.ok(miniPage.includes('colors.cord'));
});

test('browser preview opens at the latest rope entries instead of the top', () => {
  assert.ok(js.includes('let shouldScrollToLatest = true'));
  assert.ok(js.includes('if (shouldScrollToLatest)'));
  assert.ok(js.includes('scrollY = maxScrollY'));
  assert.ok(js.includes('shouldScrollToLatest = false'));
  assert.ok(js.includes('shouldScrollToLatest = true'));
  assert.ok(!js.includes('autoScrollTop'));
  assert.ok(miniPage.includes('shouldScrollToLatest: true'));
  assert.ok(miniPage.includes('if (this.shouldScrollToLatest)'));
  assert.ok(miniPage.includes('this.scrollY = this.maxScrollY'));
  assert.ok(html.includes(`styles.css?v=${assetVersion}`));
  assert.ok(html.includes(`app.js?v=${assetVersion}`));
});

test('browser preview renders resolved knots as dated sticky notes', () => {
  assert.ok(js.includes('function drawResolvedStickyNote('));
  assert.ok(js.includes('drawResolvedStickyNote(item, y, index)'));
  assert.ok(js.includes('function drawStickyNotePaper('));
  assert.ok(js.includes('function drawStickyTape('));
  assert.ok(js.includes('function resolvedNoteDate('));
  assert.ok(js.includes('function drawHandwrittenResolvedDate('));
  assert.ok(js.includes('drawHandwrittenResolvedDate(item, note.seed)'));
  assert.ok(js.includes('ctx.fillText(dateText,'));
  assert.ok(js.includes('item.resolvedAt || item.createdAt'));
  assert.ok(!js.includes('drawReleasedKnotTrace'));
  assert.ok(!js.includes('drawLooseFiberMemory'));
  assert.ok(miniPage.includes('this.drawResolvedStickyNote(ctx, item, y, index)'));
  assert.ok(miniPage.includes('this.drawHandwrittenResolvedDate(ctx, item, note.seed)'));
  assert.ok(miniPage.includes('drawStickyNotePaper(ctx,'));
  assert.ok(miniPage.includes('drawStickyTape(ctx,'));
  assert.ok(html.includes(`styles.css?v=${assetVersion}`));
  assert.ok(html.includes(`app.js?v=${assetVersion}`));
});

test('browser preview gives newly written knots a stronger hand-made birth animation', () => {
  assert.ok(js.includes('function getKnotAnimation('));
  assert.ok(js.includes('function drawNewKnotBirthEffect('));
  assert.ok(js.includes('drawNewKnotBirthEffect(item, x, y + jitter, side, seed, animation)'));
  assert.ok(js.includes('duration: 1280'));
  assert.ok(js.includes('shortDate(item.createdAt)'));
  assert.ok(js.includes('drawStickyNotePaper(48, 26'));
  assert.ok(js.includes('drawRoughOval(x, y'));
  assert.ok(!js.includes('function getKnotProgress('));
});

test('browser preview removes rope dust effects and uses rough kraft paper texture', () => {
  assert.ok(!js.includes('drawAgingTrace'));
  assert.ok(!js.includes('previewDustStage'));
  assert.ok(!js.includes('drawRopeRidgeDust'));
  assert.ok(!js.includes('drawKnotSmudgeHalo'));
  assert.ok(!js.includes('drawFrayedFibers'));
  assert.ok(!js.includes('drawOldWeb'));
  assert.ok(js.includes("const PAPER = '#caa36f'"));
  assert.ok(html.includes(`styles.css?v=${assetVersion}`));
  assert.ok(html.includes(`app.js?v=${assetVersion}`));
  assert.ok(js.includes('function drawPaperMottling('));
  assert.ok(js.includes('function drawKraftFibers('));
  assert.ok(js.includes('function drawPaperStains('));
  assert.ok(js.includes('function drawPaperCreases('));
  assert.ok(js.includes('function drawPaperEdgeWear('));
  assert.ok(js.includes('function drawPaperVignette('));
  assert.ok(css.includes('--paper-kraft'));
  assert.ok(css.includes('kraft-paper'));
  assert.ok(css.includes('repeating-linear-gradient'));
  assert.ok(css.includes('inset 0 0 42px'));
});

test('browser preview uses hand-drawn typography and faster duration text animation', () => {
  assert.ok(css.includes('--font-hand'));
  assert.ok(css.includes('Hannotate SC'));
  assert.ok(css.includes('Kaiti SC'));
  assert.ok(css.includes('font-family: var(--font-hand)'));
  assert.ok(css.includes('.stats-flash .stat-value'));
  assert.ok(css.includes('animation: statInkRise 260ms'));
  assert.ok(css.includes('@keyframes statInkRise'));
  assert.ok(css.includes('.stats-bar'));
  assert.ok(css.includes('right: 18px'));
  assert.ok(css.includes('backdrop-filter: blur(6px)'));
  assert.ok(css.includes('.stats-bar.scrolling'));
  assert.ok(css.includes('transform: translateY(-13px) rotate(-0.35deg) scale(0.96)'));
  assert.ok(js.includes('let statsHideTimer'));
  assert.ok(js.includes('function nudgeStatsBar('));
  assert.ok(js.includes("statsBar.classList.add('scrolling')"));
});

test('browser preview uses single-user direct resolve wording and data', () => {
  assert.ok(html.includes('留一句和解的话'));
  assert.ok(js.includes("resolveAction.textContent = '解开'"));
  assert.ok(js.includes("event.status = 'resolved'"));
  assert.ok(js.includes('event.resolvedBy = currentUserId'));
  assert.ok(js.includes('event.resolutionLine = line'));
  assert.ok(!js.includes('想解'));
  assert.ok(!js.includes('对方想把这个结解开'));
});

test('browser preview labels knot and resolved dates in detail cards', () => {
  assert.ok(js.includes('`结下 ${formatDate(event.createdAt)} · 解开 ${formatDate(event.resolvedAt)}`'));
  assert.ok(js.includes('`结下 ${formatDate(event.createdAt)}`'));
  assert.ok(js.includes('detailMeta.textContent = `${formatDate(badge.createdAt)} 夹上 · 印章`;'));
  assert.ok(js.includes("badge.subtitle || '这是绳子自动记住的一枚印章。'"));
  assert.ok(miniPage.includes('`结下 ${formatDate(event.createdAt)} · 解开 ${formatDate(event.resolvedAt)}`'));
});

test('mini program mirrors the static entry, cabinet home, and add-rope page', () => {
  const miniCabinetSlots = miniCssBlockLast('.cabinet-slots');
  const miniCabinetSlot = miniCssBlockLast('.cabinet-slot');
  const miniCabinetChrome = cssBlockFrom(
    miniWxss,
    '.cabinet-stack::before,\n.cabinet-stack::after,\n.cabinet-top,\n.cabinet-bottom',
  );
  const miniCabinetRowChrome = cssBlockFrom(miniWxss, '.cabinet-row::before,\n.cabinet-row::after');
  const miniCabinetFront = miniCssBlockLast('.cabinet-front');
  const miniRopeTile = miniCssBlockLast('.rope-tile');
  const miniRopeStem = miniCssBlockLast('.rope-tile::after');
  const miniHomeControlBar = miniCssBlockLast('.home-control-bar');
  const miniHomeControlTape = miniCssBlockLast('.home-control-bar::before');
  const miniHomeControlButtons = cssBlockFrom(
    miniWxss,
    '.home-control-bar .settings-toggle,\n.home-control-bar .home-search-toggle,\n.home-control-bar .add-rope-action',
    '',
    true,
  );
  const miniSharedPaperTabs = cssBlockFrom(
    miniWxss,
    '.add-rope-back,\n.back-home-action,\n.rope-timeline-toggle',
    '',
    true,
  );
  const miniConfig = JSON.parse(miniAppJson);
  assert.ok(miniConfig.pages.includes('pages/add-rope/add-rope'));
  assert.ok(miniWxml.includes('id="loginGate"'));
  assert.ok(miniWxml.includes('class="login-gate image-login-gate"'));
  assert.ok(miniWxml.includes('../../assets/login-cabinet-door.png'));
  assert.ok(miniWxml.includes('class="login-cabinet-image"\n        src="../../assets/login-cabinet-door.png"\n        mode="aspectFill"'));
  assert.ok(miniWxml.includes('bindtap="enterLoginGate"'));
  assert.ok(miniWxml.includes('<button\n        id="loginEnterAction"'));
  assert.ok(miniWxml.includes('id="loginEnterAction"\n        class="login-enter-action image-login-enter-action"\n        type="button"\n        bindtap="enterLoginGate"'));
  assert.ok(miniWxml.includes('id="homePage"'));
  assert.ok(miniWxml.includes('id="ropeShelf"'));
  assert.ok(!miniWxml.includes('id="homeShelfCanvas"'));
  assert.ok(!miniWxml.includes('canvas-id="homeShelfCanvas"'));
  assert.ok(!miniWxml.includes('class="home-shelf-canvas"'));
  assert.ok(miniWxml.includes('class="home-shelf-stage"'));
  assert.ok(miniWxml.includes('class="cabinet-stack home-hit-stack"'));
  assert.ok(miniWxml.includes('style="height: {{homeShelfHeight}}px;"'));
  assert.ok(miniWxml.includes('../../assets/home-rope-sign-transparent.png'));
  assert.ok(miniWxml.includes('bindtap="enterRopeFromShelf"'));
  assert.ok(!miniWxml.includes('id="addRopePage"'));
  assert.ok(miniWxml.includes('bindtap="openAddRopePage"'));
  assert.ok(miniPage.includes("this.navigateOnce('/pages/add-rope/add-rope');"));
  assert.ok(miniAddWxml.includes('id="addRopePage"'));
  assert.ok(miniAddWxml.includes('data-rope-mode="single"'));
  assert.ok(miniAddWxml.includes('data-rope-mode="couple"'));
  assert.ok(miniAddWxml.includes('id="addRopeNameInput"'));
  assert.ok(miniAddWxml.includes('bindinput="onAddRopeNameInput"'));
  assert.ok(miniAddWxml.includes('id="createRopeFromAddPage"'));
  assert.ok(miniAddWxml.includes('bindtap="createNamedRope"'));
  assert.ok(miniWxml.includes('id="settingsDock"'));
  assert.ok(miniWxml.includes('id="recordTimelineDock"'));
  assert.ok(miniWxml.includes('id="exchangeDock"'));
  assert.ok(miniWxml.includes('id="globalSearchDock"'));
  assert.ok(miniWxml.includes('<block wx:if="{{viewMode === \'rope\' && !showNote && !showDetail && !showNotebook}}">'));
  assert.ok(miniWxml.includes('<cover-view id="statsBar" class="stats-bar"'));
  assert.ok(miniWxml.includes('class="stat-item stat-item-{{index}}"'));
  assert.ok(miniWxml.includes('<cover-view id="backHomeAction" class="back-home-action" bindtap="goHome"'));
  assert.ok(miniWxml.includes('<cover-view class="rope-tab-char">返</cover-view>'));
  assert.ok(miniWxml.includes('<cover-view class="rope-tab-char">绳</cover-view>'));
  assert.ok(miniWxml.includes('<cover-view id="timelineToggle" class="timeline-toggle rope-timeline-toggle" bindtap="toggleTimelineDock"'));
  assert.ok(miniWxml.includes('<cover-view id="exchangeDock" class="exchange-dock"'));
  assert.ok(miniWxml.includes('<cover-view id="exchangeButton" class="exchange-button" bindtap="toggleExchangeDock"'));
  assert.ok(!miniWxml.includes('<view wx:if="{{viewMode === \'rope\' && !showNote && !showDetail && !showNotebook}}" class="rope-ui-layer">'));
  assert.ok(!miniWxml.includes('<button id="backHomeAction"'));
  assert.ok(!miniWxml.includes('<button id="timelineToggle"'));
  assert.ok(!miniWxml.includes('<button id="exchangeButton"'));
  assert.ok(miniWxml.includes('class="home-control-icon settings-icon-image"'));
  assert.ok(miniWxml.includes('class="home-control-icon create-icon-image"'));
  assert.ok(miniWxml.includes('class="home-control-icon search-icon-image"'));
  assert.ok(miniWxml.includes('../../assets/home-icon-settings.png'));
  assert.ok(miniWxml.includes('../../assets/home-icon-create.png'));
  assert.ok(miniWxml.includes('../../assets/home-icon-search.png'));
  assert.ok(miniWxml.includes('style="--row-index: {{item.rowIndex}}; --row-center: {{item.rowCenter}};"'));
  assert.ok(miniWxml.includes('style="--tile-index: {{slot.tileIndex}}; --tile-shift-x: {{slot.visualShiftX}}rpx; --tile-center-shift-x: {{slot.centerShiftX}}rpx;"'));
  assert.ok(miniPage.includes('visualShiftX: 0'));
  assert.ok(miniPage.includes('centerShiftX: -70'));
  assert.ok(!miniPage.includes('visualShiftX: slotIndex === 0 ? -46 : 46'));
  assert.ok(!miniWxml.includes('settings-gear-logo'));
  assert.ok(!miniWxml.includes('add-rope-plus'));
  assert.ok(!miniWxml.includes('class="search-icon-ring"'));
  assert.ok(!miniWxml.includes('class="search-icon-glint"'));
  assert.ok(!miniWxml.includes('class="search-icon-handle"'));
  assert.ok(!miniWxml.includes('先点下面的'));
  assert.ok(!miniWxml.includes('brand-title">绳话'));
  assert.ok(!miniWxml.includes('open-type="share">邀请'));
  assert.ok(miniWxss.includes('.login-cabinet-image'));
  assert.ok(miniCssBlockLast('.login-gate').includes('padding: 0;'));
  assert.ok(miniCssBlockLast('.login-cabinet-frame').includes('top: 0;'));
  assert.ok(miniCssBlockLast('.login-cabinet-frame').includes('bottom: 0;'));
  assert.ok(!miniCssBlockLast('.login-cabinet-frame').includes('top: 44rpx;'));
  assert.ok(!miniCssBlockLast('.login-cabinet-frame').includes('bottom: -44rpx;'));
  assert.ok(miniCssBlockLast('.login-cabinet-frame').includes('width: 760rpx;'));
  assert.ok(miniCssBlockLast('.login-cabinet-image').includes('height: 100%;'));
  assert.ok(miniWxss.includes('top: 59.4%;'));
  assert.ok(miniWxss.includes('width: 248rpx;'));
  assert.ok(miniWxss.includes('height: 248rpx;'));
  assert.ok(miniWxss.includes('width: 256rpx;'));
  assert.ok(miniWxss.includes('height: 256rpx;'));
  assert.ok(miniWxss.includes('border-radius: 999rpx;'));
  assert.ok(miniWxss.includes('transform: translate(-50%, -50%);'));
  assert.ok(miniWxss.includes('transform: translate(-50%, -50%) scale(0.96);'));
  assert.ok(miniCssBlockLast('.login-enter-glow::after').includes('top: 22%;'));
  assert.ok(miniCssBlockLast('.login-enter-glow::after').includes('left: 12%;'));
  assert.ok(miniCssBlockLast('.login-enter-glow::after').includes('width: 58%;'));
  assert.ok(miniCssBlockLast('.login-enter-glow::after').includes('height: 25%;'));
  assert.ok(miniCssBlockLast('.login-enter-glow::after').includes('opacity: 0.52;'));
  assert.ok(miniCssBlockLast('.login-enter-glow::after').includes('filter: blur(8rpx);'));
  assert.ok(miniWxss.includes('animation: loginGlowBreath 2.8s ease-in-out infinite;'));
  assert.ok(miniWxss.includes('@keyframes loginGlowBreath'));
  assert.ok(miniWxss.includes('.cabinet-stack'));
  assert.ok(miniWxss.includes('.home-shelf-stage'));
  assert.ok(!miniWxss.includes('.home-shelf-canvas'));
  assert.ok(!cssBlockFrom(miniWxss, '.home-hit-stack').includes('background: transparent;'));
  assert.ok(!miniWxss.includes('.home-hit-stack .rope-coil,\n.home-hit-stack .rope-note {\n  display: none;'));
  assert.ok(!miniWxss.includes('.home-hit-stack .cabinet-front,\n.home-hit-stack .cabinet-row::before,\n.home-hit-stack .cabinet-row::after'));
  assert.ok(miniWxss.includes('.home-hit-stack {\n  position: relative;\n  z-index: 2;'));
  assert.ok(miniWxss.includes('box-sizing: border-box;\n  min-height: 100%;\n  padding: 60rpx 36rpx 84rpx;'));
  assert.ok(miniWxss.includes('right: 0;\n  left: 0;\n  z-index: 14;\n  height: 26rpx;'));
  assert.ok(!miniWxss.includes('right: -24rpx;\n  left: -24rpx;'));
  assert.ok(miniCabinetSlots.includes('display: grid'));
  assert.ok(miniCssBlockLast('.rope-shelf').includes('padding-top: 0;'));
  assert.ok(miniCabinetSlots.includes('position: relative;'));
  assert.ok(miniCabinetSlots.includes('z-index: 16;'));
  assert.ok(miniCabinetSlots.includes('pointer-events: auto;'));
  assert.ok(miniCabinetSlots.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'));
  assert.ok(miniCabinetSlots.includes('gap: 56rpx;'));
  assert.ok(miniCabinetSlots.includes('min-height: 182rpx;'));
  assert.ok(!miniCabinetSlots.includes('bottom: 78rpx;'));
  assert.ok(miniCabinetSlot.includes('min-height: 192rpx;'));
  assert.ok(!miniCabinetSlots.includes('display: flex'));
  assert.ok(!miniCabinetSlots.includes('justify-content: space-between'));
  assert.ok(!miniCabinetSlot.includes('width: 43%'));
  assert.ok(miniCabinetChrome.includes('pointer-events: none;'));
  assert.ok(miniCabinetRowChrome.includes('pointer-events: none;'));
  assert.ok(miniCabinetFront.includes('pointer-events: none;'));
  assert.ok(miniRopeStem.includes('pointer-events: none;'));
  assert.ok(!miniWxss.includes('filter:\n  filter:'));
  assert.ok(miniCssBlockLast('.cabinet-row').includes('transform: none;'));
  assert.ok(!miniWxss.includes('transform: rotate(calc((var(--row-index) - var(--row-center)) * 0.14deg));'));
  assert.ok(miniRopeTile.includes('z-index: 17;'));
  assert.ok(miniRopeTile.includes('pointer-events: auto;'));
  assert.ok(miniRopeTile.includes('transform: none;'));
  assert.ok(miniRopeTile.includes('display: block;'));
  assert.ok(miniRopeTile.includes('height: 200rpx;'));
  assert.ok(miniRopeTile.includes('box-sizing: border-box;'));
  assert.ok(miniRopeTile.includes('margin: 0;'));
  assert.ok(miniRopeTile.includes('padding: 8rpx 0 0;'));
  assert.ok(!miniRopeTile.includes('padding-top: 8rpx;'));
  assert.ok(miniRopeTile.includes('line-height: 1;'));
  assert.ok(miniRopeTile.includes('--tile-shift-x: 0rpx;'));
  assert.ok(miniRopeTile.includes('--tile-center-shift-x: 0rpx;'));
  assert.ok(miniRopeTile.includes('--tile-rope-x: calc(50% + var(--tile-center-shift-x) + var(--tile-shift-x));'));
  assert.ok(!miniRopeTile.includes('place-items: start center;'));
  assert.ok(miniCssBlockLast('.rope-tile::after').includes('display: none;'));
  assert.ok(miniCssBlockLast('.rope-coil').includes('position: absolute;'));
  assert.ok(miniCssBlockLast('.rope-coil').includes('left: var(--tile-rope-x);'));
  assert.ok(miniCssBlockLast('.rope-coil').includes('width: 104rpx;'));
  assert.ok(miniCssBlockLast('.rope-coil').includes('transform: translateX(-50%);'));
  assert.ok(miniCssBlockLast('.rope-coil-image').includes('display: block;'));
  assert.ok(miniCssBlockLast('.rope-coil-image').includes('width: 104rpx;'));
  assert.ok(miniCssBlockLast('.rope-coil-image').includes('height: 140rpx;'));
  assert.ok(miniCssBlockLast('.rope-note').includes('left: var(--tile-rope-x);'));
  assert.ok(miniCssBlockLast('.rope-note').includes('bottom: -50rpx;'));
  assert.ok(miniCssBlockLast('.rope-note').includes('transform: translateX(-50%) rotate(-0.5deg);'));
  assert.ok(!miniWxss.includes('transform: rotate(calc((var(--tile-index) - 2) * 0.18deg));'));
  assert.ok(miniWxss.includes('background-blend-mode: multiply, screen, normal;'));
  assert.ok(miniWxss.includes('grid-template-columns: repeat(3, 88rpx);'));
  assert.ok(miniHomeControlBar.includes('z-index: 30;'));
  assert.ok(miniHomeControlBar.includes('pointer-events: auto;'));
  assert.ok(miniHomeControlBar.includes('overflow: visible;'));
  assert.ok(miniHomeControlTape.includes('content: "";'));
  assert.ok(miniHomeControlTape.includes('right: 34rpx;'));
  assert.ok(miniHomeControlTape.includes('top: -14rpx;'));
  assert.ok(miniHomeControlTape.includes('width: 86rpx;'));
  assert.ok(miniHomeControlTape.includes('height: 30rpx;'));
  assert.ok(miniHomeControlTape.includes('pointer-events: none;'));
  assert.ok(miniHomeControlTape.includes('transform: rotate(-7deg);'));
  assert.ok(miniWxss.includes('.home-control-bar .settings-toggle,\n.home-control-bar .home-search-toggle,\n.home-control-bar .add-rope-action'));
  assert.ok(miniHomeControlButtons.includes('pointer-events: auto;'));
  assert.ok(miniWxss.includes('width: 88rpx;\n  height: 88rpx;\n  min-height: 88rpx;'));
  assert.ok(miniWxss.includes('.home-control-icon'));
  assert.ok(miniWxss.includes('width: 64rpx;\n  height: 64rpx;'));
  assert.ok(!miniWxss.includes('.home-control-bar .add-rope-action {\n  width: 92rpx;'));
  assert.ok(!miniWxss.includes('.home-control-bar .search-icon-ring'));
  assert.ok(!miniWxss.includes('.home-control-bar .search-icon-handle'));
  assert.ok(miniWxss.includes('.back-home-action,\n.rope-timeline-toggle,\n.record-timeline-dock,\n.exchange-dock {\n  pointer-events: auto;'));
  assert.ok(miniWxss.includes('background-color: rgba(249, 238, 207, 0.86);'));
  assert.ok(miniWxss.includes('background-color: rgba(249, 236, 203, 0.82);'));
  assert.ok(miniWxss.includes('background-color: rgba(250, 237, 203, 0.94);'));
  assert.ok(miniWxss.includes('background-color: rgba(252, 242, 214, 0.86);'));
  assert.ok(miniSharedPaperTabs.includes('width: 76rpx;'));
  assert.ok(!miniSharedPaperTabs.includes('width: 104rpx;'));
  assert.ok(miniWxss.includes('.stat-item-0'));
  assert.ok(miniWxss.includes('.rope-tab-char'));
  assert.ok(miniWxml.includes('class="rope-coil"'));
  assert.ok(miniWxml.includes('class="rope-coil-image"'));
  assert.ok(miniWxml.includes('../../assets/home-shelf-rope.png'));
  assert.ok(!miniWxml.includes('class="rope-coil-line'));
  assert.ok(!miniWxml.includes('rope-drop'));
  assert.ok(miniWxss.includes('.rope-coil'));
  assert.ok(miniWxss.includes('.rope-coil-image'));
  assert.ok(!miniWxss.includes('.rope-coil-line-a'));
  assert.ok(miniAddWxss.includes('.rope-add-page'));
  assert.ok(miniPage.includes('rowCenter: (rows - 1) / 2'));
  assert.ok(miniPage.includes('tileIndex: rowIndex * 2 + slotIndex'));
  assert.ok(miniPage.includes('homeShelfHeight'));
  assert.ok(miniPage.includes('homeShelfMetrics('));
  assert.ok(!miniPage.includes('homeShelfWidth'));
  assert.ok(!miniPage.includes('drawHomeShelfCanvas('));
  assert.ok(!miniPage.includes('drawHomeCabinetRow('));
  assert.ok(!miniPage.includes('drawHomeRopeTile('));
  assert.ok(miniPage.includes("viewMode: 'login'"));
  assert.ok(miniPage.includes('enterLoginGate('));
  assert.ok(miniPage.includes('openAddRopePage('));
  assert.ok(miniAddPage.includes('createNamedRope('));
  assert.ok(miniPage.includes('enterRopeFromShelf('));
  assert.ok(miniAddWxml.includes('class="add-rope-board"'));
  assert.ok(miniAddCssBlock('.page').includes('padding: 0;'));
  assert.ok(miniAddCssBlock('.add-rope-board').includes('width: 750rpx;'));
  assert.ok(miniAddCssBlock('.add-rope-board').includes('height: 100vh;'));
  assert.ok(miniAddCssBlock('.add-rope-board').includes('border-radius: 0;'));
  assert.ok(miniAddWxml.includes('<text class="add-rope-back-char">返</text>'));
  assert.ok(miniAddWxml.includes('<text class="add-rope-back-char">回</text>'));
  assert.ok(!miniAddWxml.includes('<text class="add-rope-back-label">返回</text>'));
  assert.ok(miniAddCssBlock('.add-rope-back').includes('top: 112rpx'));
  assert.ok(miniAddCssBlock('.add-rope-back').includes('left: 0;'));
  assert.ok(miniAddCssBlock('.add-rope-back').includes('width: 74rpx'));
  assert.ok(miniAddCssBlock('.add-rope-back').includes('height: 128rpx'));
  assert.ok(miniAddCssBlock('.add-rope-back').includes('min-width: 74rpx'));
  assert.ok(miniAddCssBlock('.add-rope-back').includes('min-height: 128rpx'));
  assert.ok(miniAddCssBlock('.add-rope-back').includes('display: flex;'));
  assert.ok(miniAddCssBlock('.add-rope-back').includes('flex-direction: column;'));
  assert.ok(!miniAddCssBlock('.add-rope-back').includes('writing-mode'));
  assert.ok(!miniAddCssBlock('.add-rope-back').includes('top: 150rpx'));
  assert.ok(!miniAddCssBlock('.add-rope-back').includes('height: 92rpx'));
  assert.ok(miniAddCssBlock('.add-rope-back::before').includes('width: 54rpx'));
  assert.ok(miniAddCssBlock('.add-rope-back::before').includes('height: 24rpx'));
  assert.ok(cssBlockFrom(miniAddWxss, '.add-mode-title,\n.add-rope-name-card').includes('width: 496rpx'));
  assert.ok(miniAddCssBlock('.rope-mode-options').includes('width: 620rpx'));
  assert.ok(miniAddCssBlock('.add-rope-rope').includes('width: 112rpx'));
  assert.ok(miniAddCssBlock('.add-rope-rope').includes('height: 390rpx'));
  assert.ok(miniAddCssBlock('.add-rope-rope').includes('margin: 24rpx auto 0'));
  assert.ok(miniAddCssBlock('.add-rope-tail-image').includes('width: 96rpx'));
  assert.ok(miniAddCssBlock('.add-rope-tail-image').includes('height: 390rpx'));
  assert.ok(!miniAddCssBlock('.add-rope-rope').includes('height: 550rpx'));
  assert.ok(!miniAddCssBlock('.add-rope-tail-image').includes('height: 550rpx'));
  assert.ok(miniAddCssBlock('.add-rope-tail-image').includes('transform: scaleX(1.18)'));
  assert.ok(miniAddCssBlock('.create-rope-action').includes('position: relative'));
  assert.ok(!miniAddCssBlock('.create-rope-action').includes('bottom: 0'));
  assert.ok(miniAddCssBlock('.create-rope-action').includes('width: 148rpx'));
  assert.ok(miniAddCssBlock('.create-rope-action').includes('height: 122rpx'));
  assert.ok(miniAddCssBlock('.create-rope-action').includes('margin: 14rpx auto 0'));
  miniAssetPaths.forEach((assetPath) => {
    assert.ok(fs.existsSync(assetPath), assetPath);
    assert.ok(fs.statSync(assetPath).size < 2 * 1024 * 1024, assetPath);
  });
  miniHomeIconFiles.forEach((file) => {
    const size = pngSize(path.join(root, 'miniprogram/assets', file));
    assert.strictEqual(size.width, size.height, file);
  });
  const searchIconStats = pngAlphaStats(path.join(root, 'miniprogram/assets/home-icon-search.png'));
  assert.ok(searchIconStats.alphaAbove32 > 30000);
  assert.ok(searchIconStats.cornerAlphaAbove32 < 16);
  assert.ok(searchIconStats.paleHighlightPixels < 400);
  const shelfRopeSize = pngSize(miniHomeShelfRopePath);
  assert.ok(shelfRopeSize.width <= 128);
  assert.ok(shelfRopeSize.height <= 240);
  assert.ok(fs.statSync(miniHomeShelfRopePath).size < 120 * 1024);
  const shelfRopeStats = pngAlphaStats(miniHomeShelfRopePath);
  assert.ok(shelfRopeStats.alphaAbove32 > 1000);
  assert.ok(shelfRopeStats.cornerAlphaAbove32 < 16);
});

test('mini program is local-only and does not expose cloud service hooks', () => {
  assert.ok(!miniApp.includes('wx.cloud'));
  assert.ok(!miniApp.includes('cloudReady'));
  assert.ok(!miniStoreSource.includes('wx.cloud'));
  assert.ok(!miniStoreSource.includes('cloudReady'));
  assert.ok(!miniStoreSource.includes('callFunction'));
  assert.ok(!miniStoreSource.includes('database()'));
  assert.ok(!miniStoreSource.includes('CLOUD_'));
  assert.ok(!rootProjectConfig.includes('cloudfunctionRoot'));
  assert.ok(!pkg.includes('cloudfunctions/login'));
  assert.ok(!fs.existsSync(path.join(root, 'cloudfunctions/login')));
});

test('mini program rope store creates named ropes and keeps rope records isolated', async () => {
  const storage = {};
  global.wx = {
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    },
    cloud: null,
  };

  const storePath = path.join(root, 'miniprogram/services/rope-store.js');
  delete require.cache[require.resolve(storePath)];
  const miniStore = require(storePath);

  const homeBefore = await miniStore.loadHomeState();
  assert.deepStrictEqual(homeBefore.ropes, []);

  const first = await miniStore.createRope(homeBefore, { name: '电影绳', mode: 'single' });
  const second = await miniStore.createRope(homeBefore, { name: '旅行绳', mode: 'couple' });
  const homeAfter = await miniStore.loadHomeState();
  assert.deepStrictEqual(homeAfter.ropes.map((rope) => rope.name), ['电影绳', '旅行绳']);
  assert.strictEqual(homeAfter.activeRopeId, second.ropeId);

  const firstSession = await miniStore.initSession(first.ropeId);
  const secondSession = await miniStore.initSession(second.ropeId);
  await miniStore.createKnot(firstSession, { content: '只写在第一根绳上', anchorY: 180 });

  const firstState = await miniStore.loadState(firstSession);
  const secondState = await miniStore.loadState(secondSession);
  assert.strictEqual(firstState.events.length, 1);
  assert.strictEqual(firstState.events[0].content, '只写在第一根绳上');
  assert.strictEqual(secondState.events.length, 0);

  delete global.wx;
  delete require.cache[require.resolve(storePath)];
});

test('mini program rope store ignores wx.cloud and stays local-only', async () => {
  const storage = {};
  let cloudCalls = 0;
  global.wx = {
    getStorageSync(key) {
      return storage[key];
    },
    setStorageSync(key, value) {
      storage[key] = value;
    },
    removeStorageSync(key) {
      delete storage[key];
    },
    cloud: {
      init() {
        cloudCalls += 1;
        throw new Error('cloud should not be initialized');
      },
      callFunction() {
        cloudCalls += 1;
        throw new Error('cloud function should not be called');
      },
      database() {
        cloudCalls += 1;
        throw new Error('cloud database should not be opened');
      },
    },
  };

  const storePath = path.join(root, 'miniprogram/services/rope-store.js');
  delete require.cache[require.resolve(storePath)];
  try {
    const miniStore = require(storePath);

    const homeBefore = await miniStore.loadHomeState();
    const session = { openid: homeBefore.openid, ropeId: '' };
    const timeout = (message, ms = 250) => new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
    const rope = await Promise.race([
      miniStore.createRope(session, { name: '只存本地的绳', mode: 'single' }),
      timeout('local rope create blocked'),
    ]);

    const knot = await Promise.race([
      miniStore.createKnot({ openid: session.openid, ropeId: rope.ropeId }, { content: '先写本地', anchorY: 180 }),
      timeout('local knot create blocked'),
    ]);

    const loadedSession = await Promise.race([
      miniStore.initSession(rope.ropeId),
      timeout('session init blocked'),
    ]);
    const state = await Promise.race([
      miniStore.loadState({ openid: session.openid, ropeId: rope.ropeId }),
      timeout('state load blocked'),
    ]);

    assert.strictEqual(rope.name, '只存本地的绳');
    assert.strictEqual(knot.content, '先写本地');
    assert.strictEqual(loadedSession.ropeId, rope.ropeId);
    assert.strictEqual(state.rope.ropeId, rope.ropeId);
    assert.strictEqual(state.events[0].content, '先写本地');
    assert.strictEqual(cloudCalls, 0);
  } finally {
    delete global.wx;
    delete require.cache[require.resolve(storePath)];
  }
});

test('mini program uses 750rpx layout and unmounts closed overlays so buttons remain tappable', () => {
  assert.ok(miniWxss.includes('width: 750rpx'));
  assert.ok(miniWxss.includes('rpx'));
  assert.ok(miniAddWxss.includes('width: 750rpx'));
  assert.ok(miniAddWxss.includes('rpx'));
  assert.ok(!/\d+(?:\.\d+)?px\b/.test(miniWxss));
  assert.ok(!/\d+(?:\.\d+)?px\b/.test(miniAddWxss));
  assert.ok(!miniWxss.includes('vw'));
  assert.ok(!miniAddWxss.includes('vw'));
  assert.ok(miniWxml.includes('wx:if="{{viewMode === \'rope\'}}"'));
  assert.ok(miniWxml.includes('class="rope-canvas"'));
  assert.ok(!miniWxml.includes('canvas-hidden'));
  assert.ok(!miniWxss.includes('canvas-hidden'));
  assert.ok(!miniWxml.includes('rope-paper-fallback'));
  assert.ok(miniPage.includes("const PAPER = '#caa36f';"));
  assert.ok(miniWxss.includes('.home-page,\n.rope-add-page {\n  margin: 0;'));
  assert.ok(miniAddWxss.includes('.rope-add-page'));
  assert.ok(miniWxss.includes('width: 750rpx;\n  max-width: none;\n  border-radius: 0;'));
  assert.ok(miniWxss.includes('.home-title-image {\n  position: absolute;\n  z-index: 4;\n  top: 0;'));
  assert.ok(miniAddWxss.includes('.create-rope-action'));
  assert.ok(miniAddWxss.includes('position: relative;'));
  assert.ok(!miniAddCssBlock('.create-rope-action').includes('bottom: 0;'));
  assert.ok(miniWxss.includes('writing-mode: vertical-rl'));
  assert.ok(miniPage.includes('setDataAsync(data)'));
  assert.ok(miniPage.includes('isNavigating: false'));
  assert.ok(miniPage.includes('navigateOnce(url)'));
  assert.ok(miniPage.includes('if (this.isNavigating) return;'));
  assert.ok(miniPage.includes('this.isNavigating = true;'));
  assert.ok(miniPage.includes('this.isNavigating = false;'));
  assert.ok(miniPage.includes('retries < 5'));
  assert.ok(miniRopePage.includes('await this.reload();\n      this.initCanvas();'));
  assert.ok(miniWxml.includes('wx:if="{{settingsOpen}}"'));
  assert.ok(miniWxml.includes('wx:if="{{globalSearchOpen}}"'));
  assert.ok(miniWxml.includes('id="globalSearchDock" class="record-timeline-dock global-search-dock open"'));
  assert.ok(miniWxml.includes('style="top: {{safeTop + 90}}px;"'));
  assert.ok(miniWxml.includes('style="top: {{safeTop + 88}}px;"'));
  assert.ok(miniWxml.includes('class="global-search-empty"'));
  assert.ok(miniWxml.includes('写下关键词，会从每根绳里一起找。'));
  assert.ok(miniWxml.includes('class="global-search-entry"'));
  assert.ok(miniWxml.includes('wx:if="{{timelineOpen}}"'));
  assert.ok(miniWxml.includes('wx:if="{{exchangeOpen}}"'));
  assert.ok(!miniWxml.includes("{{settingsOpen ? 'open' : ''}}"));
  assert.ok(!miniWxml.includes("{{globalSearchOpen ? 'open' : ''}}"));
  assert.ok(!miniWxml.includes("{{timelineOpen ? 'open' : ''}}"));
  assert.ok(miniCssBlockLast('.settings-dock').includes('bottom: auto;'));
  assert.ok(miniCssBlockLast('.settings-dock').includes('display: grid;'));
  assert.ok(miniCssBlockLast('.settings-dock').includes('grid-template-columns: 40rpx 1fr;'));
  assert.ok(miniCssBlockLast('.settings-dock').includes('gap: 16rpx;'));
  assert.ok(miniCssBlockLast('.settings-dock').includes('width: 356rpx;'));
  assert.ok(miniCssBlockLast('.settings-dock').includes('height: auto;'));
  assert.ok(miniCssBlockLast('.settings-dock').includes('max-height: none;'));
  assert.ok(miniCssBlockLast('.settings-dock').includes('transform-origin: left center;'));
  assert.ok(miniCssBlockLast('.settings-dock.open').includes('transform: translateX(0) rotate(-0.8deg) scale(1);'));
  assert.ok(miniCssBlockLast('.settings-dock::before').includes('left: 62rpx;'));
  assert.ok(miniCssBlockLast('.settings-dock::after').includes('top: -20rpx;'));
  assert.ok(miniCssBlockLast('.settings-dock .dock-rail').includes('position: relative;'));
  assert.ok(miniCssBlockLast('.settings-dock .dock-rail').includes('display: grid;'));
  assert.ok(miniCssBlockLast('.settings-dock .dock-close').includes('min-height: 40rpx;'));
  assert.ok(miniCssBlockLast('.settings-dock .dock-close::after').includes('border: 0;'));
  assert.ok(miniCssBlockLast('.settings-dock .settings-list').includes('grid-column: 2;'));
  assert.ok(miniCssBlockLast('.settings-dock .settings-list').includes('gap: 20rpx;'));
  assert.ok(miniCssBlockLast('.settings-dock .settings-list').includes('overflow: hidden;'));
  assert.ok(miniCssBlockLast('.settings-dock .drawer-hint').includes('box-sizing: border-box;'));
  assert.ok(miniCssBlockLast('.settings-dock .drawer-hint').includes('width: 100%;'));
  assert.ok(miniCssBlockLast('.settings-dock .drawer-hint').includes('min-width: 0;'));
  assert.ok(miniCssBlockLast('.settings-dock .settings-action').includes('min-height: 136rpx;'));
  assert.ok(miniCssBlockLast('.settings-dock .settings-action').includes('box-sizing: border-box;'));
  assert.ok(miniCssBlockLast('.settings-dock .settings-action').includes('width: 100%;'));
  assert.ok(miniCssBlockLast('.settings-dock .settings-action').includes('min-width: 0;'));
  assert.ok(miniCssBlockLast('.settings-dock .reset-confirm-panel').includes('box-sizing: border-box;'));
  assert.ok(miniCssBlockLast('.settings-dock .reset-confirm-panel').includes('width: 100%;'));
  assert.ok(miniCssBlockLast('.settings-dock .reset-confirm-panel').includes('display: grid;'));
  assert.ok(miniCssBlockLast('.settings-dock .reset-confirm-panel').includes('overflow: hidden;'));
  assert.ok(miniCssBlockLast('.settings-dock .reset-confirm-copy').includes('box-sizing: border-box;'));
  assert.ok(miniCssBlockLast('.settings-dock .reset-confirm-copy').includes('font-size: 20rpx;'));
  assert.ok(miniCssBlockLast('.settings-dock .reset-confirm-actions').includes('display: grid;'));
  assert.ok(miniCssBlockLast('.settings-dock .reset-confirm-actions').includes('grid-template-columns: repeat(2, minmax(0, 1fr));'));
  assert.ok(miniCssBlockLast('.settings-dock .reset-confirm-actions').includes('gap: 12rpx;'));
  const settingsResetButtons = cssBlockFrom(
    miniWxss,
    '.settings-dock .reset-confirm-actions .text-button,\n.settings-dock .reset-confirm-actions .ink-button',
    '',
    true,
  );
  assert.ok(settingsResetButtons.includes('margin-left: 0;'));
  assert.ok(settingsResetButtons.includes('min-width: 0;'));
  assert.ok(settingsResetButtons.includes('padding: 0 8rpx;'));
  assert.ok(!miniCssBlockLast('.settings-dock').includes('bottom: 236rpx;'));
  assert.ok(miniCssBlockLast('.global-search-dock').includes('width: 318rpx;'));
  assert.ok(miniCssBlockLast('.global-search-dock').includes('right: 16rpx;'));
  assert.ok(miniCssBlockLast('.global-search-dock').includes('bottom: 244rpx;'));
  assert.ok(miniCssBlockLast('.global-search-dock').includes('grid-template-columns: 40rpx 1fr;'));
  assert.ok(miniCssBlockLast('.global-search-dock .dock-rail').includes('position: relative;'));
  assert.ok(miniCssBlockLast('.global-search-dock .dock-rail').includes('display: grid;'));
  assert.ok(miniCssBlockLast('.global-search-dock .dock-rail').includes('gap: 16rpx;'));
  assert.ok(!miniCssBlockLast('.global-search-dock .dock-rail').includes('position: absolute;'));
  assert.ok(miniCssBlockLast('.global-search-dock .dock-close').includes('min-height: 40rpx;'));
  assert.ok(miniCssBlockLast('.global-search-dock .dock-close').includes('padding: 0;'));
  assert.ok(miniCssBlockLast('.global-search-dock .dock-close::after').includes('border: 0;'));
  assert.ok(miniCssBlockLast('.global-search-dock::before').includes('left: 58rpx;'));
  assert.ok(miniCssBlockLast('.global-search-dock::after').includes('top: -20rpx;'));
  assert.ok(miniCssBlockLast('.global-search-body').includes('display: grid;'));
  assert.ok(miniCssBlockLast('.global-search-body').includes('grid-column: 2;'));
  assert.ok(miniCssBlockLast('.global-search-body').includes('min-width: 0;'));
  assert.ok(miniCssBlockLast('.global-search-body').includes('gap: 18rpx;'));
  assert.ok(miniCssBlockLast('.global-search-box').includes('width: 100%;'));
  assert.ok(miniCssBlockLast('.global-search-box').includes('min-height: 76rpx;'));
  assert.ok(miniCssBlockLast('.global-search-empty').includes('border: 2rpx dashed'));
});
