const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const pagesHtmlPath = path.join(root, 'index.html');
const pagesHtml = fs.existsSync(pagesHtmlPath) ? fs.readFileSync(pagesHtmlPath, 'utf8') : '';
const html = fs.readFileSync(path.join(root, 'web/index.html'), 'utf8');
const js = fs.readFileSync(path.join(root, 'web/app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'web/styles.css'), 'utf8');
const pkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');

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
  assert.ok(pagesHtml.includes('href="./web/styles.css?v=timeline-select-topbar-1"'));
  assert.ok(pagesHtml.includes('src="./web/app.js?v=timeline-select-topbar-1"'));
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

test('browser preview adds a notebook for reviewing resolved knots and badges', () => {
  assert.ok(html.includes('id="notebookCard"'));
  assert.ok(html.includes('id="notebookList"'));
  assert.ok(html.includes('绳本'));
  assert.ok(html.includes('收好'));
  assert.ok(js.includes('const notebookAction'));
  assert.ok(js.includes('const notebookList'));
  assert.ok(js.includes('function openNotebook('));
  assert.ok(js.includes('function notebookItems('));
  assert.ok(js.includes('function openNotebookItem('));
  assert.ok(js.includes('resolutionLine'));
  assert.ok(css.includes('.notebook-list'));
  assert.ok(css.includes('.notebook-entry'));
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
  assert.ok(js.includes("const kind = item.type === 'badge' ? '徽章'"));
  assert.ok(css.includes('.timeline-toggle'));
  assert.ok(css.includes('.record-timeline-dock.open'));
  assert.ok(css.includes('.record-timeline-item.badge::before'));
  assert.ok(css.includes('.record-timeline-dock'));
  assert.ok(css.includes('.record-timeline-item'));
  assert.ok(css.includes('writing-mode: vertical-rl'));
  assert.ok(!js.includes('相伴100天'));
  assert.ok(!js.includes('和平30天'));
});

test('browser preview highlights the selected rope item from the timeline', () => {
  assert.ok(js.includes('let selectedTimelineId'));
  assert.ok(js.includes('function isRecordTimelineOpen('));
  assert.ok(js.includes("if (item.id === selectedTimelineId && isRecordTimelineOpen())"));
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
  assert.ok(html.includes('styles.css?v=timeline-select-topbar-1'));
  assert.ok(html.includes('app.js?v=timeline-select-topbar-1'));
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
  assert.ok(html.includes('styles.css?v=timeline-select-topbar-1'));
  assert.ok(html.includes('app.js?v=timeline-select-topbar-1'));
});

test('browser preview adds aged reward badges hanging from the rope', () => {
  assert.ok(js.includes('const REWARD_BADGE_NODES'));
  assert.ok(js.includes('function computeRewardBadges('));
  assert.ok(js.includes('function drawRewardBadge('));
  assert.ok(js.includes('function drawBadgeHanger('));
  assert.ok(js.includes('function drawBadgeRing('));
  assert.ok(js.includes('function drawBadgeAging('));
  assert.ok(js.includes('const badgeY = y + 46'));
  assert.ok(js.includes("type: 'badge'"));
  assert.ok(js.includes('七日旧章'));
  assert.ok(js.includes('满月铜章'));
  assert.ok(js.includes('百日旧徽'));
  assert.ok(js.includes('平安旧夹'));
  assert.ok(js.includes('drawRewardBadge(item, screenY, index)'));
  assert.ok(html.includes('styles.css?v=timeline-select-topbar-1'));
  assert.ok(html.includes('app.js?v=timeline-select-topbar-1'));
});

test('browser preview removes rope dust effects and uses rough kraft paper texture', () => {
  assert.ok(!js.includes('drawAgingTrace'));
  assert.ok(!js.includes('previewDustStage'));
  assert.ok(!js.includes('drawRopeRidgeDust'));
  assert.ok(!js.includes('drawKnotSmudgeHalo'));
  assert.ok(!js.includes('drawFrayedFibers'));
  assert.ok(!js.includes('drawOldWeb'));
  assert.ok(js.includes("const PAPER = '#caa36f'"));
  assert.ok(html.includes('styles.css?v=timeline-select-topbar-1'));
  assert.ok(html.includes('app.js?v=timeline-select-topbar-1'));
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
