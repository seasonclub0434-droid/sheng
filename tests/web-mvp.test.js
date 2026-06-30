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
const pkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
const badgeMechanismPath = path.join(root, 'docs/badge-system.md');
const badgeMechanismDoc = fs.existsSync(badgeMechanismPath) ? fs.readFileSync(badgeMechanismPath, 'utf8') : '';
const assetVersion = 'notebook-search-records-1';

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

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

test('github pages root serves the browser preview', () => {
  assert.ok(pagesHtml.includes('<title>绳话</title>'));
  assert.ok(pagesHtml.includes('id="ropeCanvas"'));
  assert.ok(pagesHtml.includes('id="timelineToggle"'));
  assert.ok(pagesHtml.includes(`href="./web/styles.css?v=${assetVersion}"`));
  assert.ok(pagesHtml.includes(`src="./web/app.js?v=${assetVersion}"`));
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
  assert.ok(html.includes('id="resetPreviewAction"'));
  assert.ok(html.includes('id="resetConfirmPanel"'));
  assert.ok(html.includes('id="confirmResetAction"'));
  assert.ok(html.includes('id="cancelResetAction"'));
  assert.ok(pagesHtml.includes('id="settingsToggle"'));
  assert.ok(js.includes('const settingsToggle'));
  assert.ok(js.includes('const resetConfirmPanel'));
  assert.ok(js.includes('function toggleSettingsDock('));
  assert.ok(js.includes('function askResetConfirmation('));
  assert.ok(js.includes('function emptyState('));
  assert.ok(js.includes('function resetPreviewState('));
  assert.ok(js.includes('state = emptyState()'));
  assert.ok(js.includes('events: []'));
  assert.ok(!js.includes('state = demoState()'));
  assert.ok(js.includes('localStorage.setItem(STORAGE_KEY, JSON.stringify(state))'));
  assert.ok(js.includes("lastTimelineSignature = '__reset__'"));
  assert.ok(js.includes('settingsToggle.addEventListener'));
  assert.ok(js.includes('resetPreviewAction.addEventListener'));
  assert.ok(js.includes('confirmResetAction.addEventListener'));
  assert.ok(css.includes('.settings-toggle'));
  assert.ok(css.includes('.settings-dock.open'));
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
  assert.ok(js.includes("if (query && item.type === 'badge') return false;"));
  assert.ok(js.indexOf("if (query && item.type === 'badge') return false;") < js.indexOf('const haystack = ['));
  assert.ok(js.includes('notebookTitle(item),'));
  assert.ok(js.includes('notebookCopy(item),'));
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
  assert.ok(js.includes("if (isRecordTimelineOpen()) {\n      focusTimelineEvent(hit.id);\n      return;\n    }"));
  assert.ok(js.indexOf('if (isRecordTimelineOpen())') < js.indexOf("if (hit.type === 'badge')"));
  assert.ok(js.includes('const isSelectedAgain = selectedTimelineId === id'));
  assert.ok(js.includes("selectedTimelineId = isSelectedAgain ? '' : id"));
  assert.ok(js.includes("if (!selectedTimelineId)"));
  assert.ok(js.includes('function drawTimelineHighlight('));
  assert.ok(js.includes('drawTimelineHighlight(item, screenY, index)'));
  assert.ok(js.includes('const HIGHLIGHT_INK'));
  assert.ok(js.includes("stroke: 'rgba(176, 37, 31, 0.82)'"));
  assert.ok(js.includes('ctx.lineWidth = ring ? 1.15 : 2.35'));
  assert.ok(js.includes("item.id === selectedTimelineId"));
  assert.ok(js.includes("record-timeline-item ${cssClass}${isSelected ? ' selected' : ''}"));
  assert.ok(css.includes('.record-timeline-item.selected'));
  assert.ok(css.includes('#a8322c'));
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
  assert.ok(js.includes('const usedTones = new Set()'));
  assert.ok(js.includes('const usedMotifs = new Set()'));
  assert.ok(js.includes('usedTones.has(variant.tone)'));
  assert.ok(js.includes('usedMotifs.has(variant.motif)'));
  assert.ok(js.includes('const badgeVariants = assignVisibleBadgeVariants(layoutItems, scrollY, height)'));
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
