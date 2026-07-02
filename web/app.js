const DAY_MS = 24 * 60 * 60 * 1000;
const STORAGE_KEY = 'rope-talk-web-mvp-state-v1';
const HOME_STORAGE_KEY = 'rope-talk-web-home-state-v3';
const ROPE_STATE_PREFIX = 'rope-talk-web-rope-state-v1:';
const DEFAULT_ROPE_ID = 'rope-default';
const PAPER = '#caa36f';
const ROPE_BODY = '#ddc8a6';
const ROPE_EDGE = '#b89a72';
const ROPE_SHADOW = 'rgba(86, 63, 37, 0.22)';
const ROPE_HIGHLIGHT = 'rgba(248, 235, 205, 0.58)';
const ROPE_NOTE_PALETTES = [
  {
    a: 'rgba(229, 236, 205, 0.92)',
    b: 'rgba(188, 205, 174, 0.9)',
    spotA: 'rgba(54, 73, 45, 0.13)',
    spotB: 'rgba(106, 118, 73, 0.14)',
    border: 'rgba(65, 87, 55, 0.22)',
    sub: '#65745d',
  },
  {
    a: 'rgba(238, 222, 203, 0.92)',
    b: 'rgba(214, 188, 164, 0.9)',
    spotA: 'rgba(104, 67, 43, 0.12)',
    spotB: 'rgba(134, 93, 61, 0.13)',
    border: 'rgba(112, 75, 47, 0.2)',
    sub: '#776458',
  },
  {
    a: 'rgba(223, 231, 232, 0.92)',
    b: 'rgba(185, 202, 204, 0.9)',
    spotA: 'rgba(47, 76, 83, 0.12)',
    spotB: 'rgba(85, 113, 116, 0.13)',
    border: 'rgba(55, 84, 88, 0.2)',
    sub: '#5f7477',
  },
  {
    a: 'rgba(237, 224, 229, 0.92)',
    b: 'rgba(210, 188, 198, 0.9)',
    spotA: 'rgba(98, 55, 70, 0.11)',
    spotB: 'rgba(126, 79, 92, 0.12)',
    border: 'rgba(103, 67, 78, 0.2)',
    sub: '#765f67',
  },
  {
    a: 'rgba(231, 225, 201, 0.92)',
    b: 'rgba(202, 191, 151, 0.9)',
    spotA: 'rgba(95, 81, 40, 0.11)',
    spotB: 'rgba(128, 111, 63, 0.12)',
    border: 'rgba(104, 88, 50, 0.19)',
    sub: '#746c54',
  },
  {
    a: 'rgba(223, 222, 237, 0.92)',
    b: 'rgba(189, 188, 211, 0.9)',
    spotA: 'rgba(57, 58, 99, 0.1)',
    spotB: 'rgba(84, 84, 126, 0.12)',
    border: 'rgba(68, 68, 105, 0.19)',
    sub: '#64637b',
  },
];
const HIGHLIGHT_INK = {
  fill: 'rgba(176, 37, 31, 0.045)',
  badgeFill: 'rgba(176, 37, 31, 0.055)',
  stroke: 'rgba(176, 37, 31, 0.82)',
  shadow: 'rgba(105, 25, 24, 0.32)',
  tether: 'rgba(176, 37, 31, 0.38)',
  scratch: 'rgba(105, 25, 24, 0.28)',
};
const BADGE_TONES = [
  'paper',
  'brass',
  'copper',
  'wax',
  'sage',
  'ink',
  'indigo',
  'rose',
  'verdigris',
  'plum',
  'ochre',
  'lapis',
  'clay',
  'moss',
  'wine',
  'smoke',
];
const BADGE_MOTIFS = [
  'star',
  'leafSprig',
  'crescent',
  'sunburst',
  'ticketShield',
  'eyelet',
  'pinwheel',
  'knotLoop',
  'stitchedOval',
  'seedCluster',
  'diamondFold',
  'ribbonLoop',
  'comet',
  'windowFrame',
  'scallopFlower',
  'mendedLoop',
];
const REWARD_BADGE_NODES = [
  {
    id: 'days-1',
    kind: 'days',
    family: 'checkin',
    threshold: 1,
    title: '初页旧签',
    mark: '1',
    subtitleOptions: ['第一页被轻轻翻开', '第一天的纸页还带着暖意', '把开始这件事夹进绳里', '第一道日光落在绳上'],
    tone: 'paper',
  },
  {
    id: 'days-2',
    kind: 'days',
    family: 'checkin',
    threshold: 2,
    title: '两日并肩章',
    mark: '2',
    subtitleOptions: ['第二天也并肩留在这里', '两页纸靠得很近', '第一段并肩的小折痕', '绳子记住第二次日落'],
    tone: 'brass',
  },
  {
    id: 'days-3',
    kind: 'days',
    family: 'checkin',
    threshold: 3,
    title: '三日墨夹',
    mark: '3',
    subtitleOptions: ['三天的墨迹慢慢干了', '第三页开始有了手帐味', '小小三日，被旧夹收好', '这根绳子开始认得你们'],
    tone: 'paper',
  },
  {
    id: 'days-5',
    kind: 'days',
    family: 'checkin',
    threshold: 5,
    title: '五日旧票',
    mark: '5',
    subtitleOptions: ['第五天像一张旧票根', '五个早晚被压成纸纹', '小段旅程有了第一张票', '把五天装进一枚旧票签'],
    tone: 'copper',
  },
  {
    id: 'days-7',
    kind: 'days',
    family: 'checkin',
    threshold: 7,
    title: '七日旧章',
    mark: '7',
    subtitleOptions: ['一起走过第一周', '第一圈旧线轻轻收好', '七天的风被夹进纸页', '这根绳子开始有了温度'],
    tone: 'brass',
  },
  {
    id: 'days-14',
    kind: 'days',
    family: 'checkin',
    threshold: 14,
    title: '双周线夹',
    mark: '14',
    subtitleOptions: ['两周被细线轻轻夹住', '十四天的纸边有了旧色', '把第二周也收进手帐', '绳子多了一段安稳的长度'],
    tone: 'sage',
  },
  {
    id: 'days-30',
    kind: 'days',
    family: 'checkin',
    threshold: 30,
    title: '满月铜章',
    mark: '30',
    subtitleOptions: ['一个月的小旧页', '满月时把心事压成铜色', '三十天的日光落在绳上', '第一本月历悄悄合页'],
    tone: 'copper',
  },
  {
    id: 'days-100',
    kind: 'days',
    family: 'checkin',
    threshold: 100,
    title: '百日旧徽',
    mark: '100',
    subtitleOptions: ['百日绳记', '一百天的褶皱都算数', '把一百个早晚夹成旧徽', '绳子记得你们走到这里'],
    tone: 'wax',
  },
  {
    id: 'first-knot',
    kind: 'knot',
    family: 'checkin',
    threshold: 1,
    title: '第一枚绳结',
    mark: '记',
    subtitleOptions: ['第一次把心事系在绳上', '第一枚绳结有了自己的页脚', '从这里开始，绳子也会听你们说话', '第一次记下不必完美的那天'],
    tone: 'paper',
  },
  {
    id: 'resolved-1',
    kind: 'resolved',
    family: 'repair',
    threshold: 1,
    title: '第一枚和章',
    mark: '和',
    subtitleOptions: ['第一次把结解开', '把那句柔软的话留在这里', '第一个结变成了浅浅印记', '愿意回头，就是第一枚徽章'],
    tone: 'sage',
  },
  {
    id: 'resolved-10',
    kind: 'resolved',
    family: 'repair',
    threshold: 10,
    title: '十结铜扣',
    mark: '10',
    subtitleOptions: ['第十次和好', '十个结都没有把绳子拧断', '铜扣收住了十次认真靠近', '这一次也被好好解开了'],
    tone: 'ink',
  },
  {
    id: 'peace-1',
    kind: 'peace',
    family: 'checkin',
    threshold: 1,
    title: '一日平安签',
    mark: '安',
    subtitleOptions: ['第一天平稳地过去了', '没有新结的一页很轻', '把今天的安静夹起来', '绳子松松地垂了一整天'],
    tone: 'sage',
  },
  {
    id: 'peace-30',
    kind: 'peace',
    family: 'checkin',
    threshold: 30,
    title: '平安旧夹',
    mark: '安',
    subtitleOptions: ['安静相守三十天', '三十天没有新结，纸页很轻', '把平稳的日子夹成旧票根', '绳子在这段时间里慢慢松开'],
    tone: 'sage',
  },
];

const canvas = document.querySelector('#ropeCanvas');
const ctx = canvas.getContext('2d');
const phone = document.querySelector('.phone');
const homePage = document.querySelector('#homePage');
const ropeShelf = document.querySelector('#ropeShelf');
const addRopeAction = document.querySelector('#addRopeAction');
const backHomeAction = document.querySelector('#backHomeAction');
const statsBar = document.querySelector('#statsBar');
const settingsToggle = document.querySelector('#settingsToggle');
const settingsClose = document.querySelector('#settingsClose');
const settingsDock = document.querySelector('#settingsDock');
const resetPreviewAction = document.querySelector('#resetPreviewAction');
const resetConfirmPanel = document.querySelector('#resetConfirmPanel');
const confirmResetAction = document.querySelector('#confirmResetAction');
const cancelResetAction = document.querySelector('#cancelResetAction');
const timelineToggle = document.querySelector('#timelineToggle');
const timelineClose = document.querySelector('#timelineClose');
const recordTimelineDock = document.querySelector('#recordTimelineDock');
const recordTimelineList = document.querySelector('#recordTimelineList');
const homeSearchToggle = document.querySelector('#homeSearchToggle');
const globalSearchDock = document.querySelector('#globalSearchDock');
const globalSearchClose = document.querySelector('#globalSearchClose');
const globalSearchInput = document.querySelector('#globalSearchInput');
const globalSearchList = document.querySelector('#globalSearchList');
const exchangeDock = document.querySelector('#exchangeDock');
const exchangeButton = document.querySelector('#exchangeButton');
const exchangeTray = document.querySelector('#exchangeTray');
const writeKnotAction = document.querySelector('#writeKnotAction');
const resolveKnotAction = document.querySelector('#resolveKnotAction');
const notebookAction = document.querySelector('#notebookAction');
const modalLayer = document.querySelector('#modalLayer');
const ropeNameCard = document.querySelector('#ropeNameCard');
const ropeNameInput = document.querySelector('#ropeNameInput');
const cancelRopeName = document.querySelector('#cancelRopeName');
const saveRopeName = document.querySelector('#saveRopeName');
const noteCard = document.querySelector('#noteCard');
const noteInput = document.querySelector('#noteInput');
const detailCard = document.querySelector('#detailCard');
const notebookCard = document.querySelector('#notebookCard');
const notebookList = document.querySelector('#notebookList');
const notebookSearch = document.querySelector('#notebookSearch');
const detailTitle = document.querySelector('#detailTitle');
const detailMeta = document.querySelector('#detailMeta');
const detailContent = document.querySelector('#detailContent');
const resolutionBlock = document.querySelector('#resolutionBlock');
const resolveForm = document.querySelector('#resolveForm');
const resolveInput = document.querySelector('#resolveInput');
const resolveAction = document.querySelector('#resolveAction');
const submitResolve = document.querySelector('#submitResolve');

let dpr = window.devicePixelRatio || 1;
let width = 0;
let height = 0;
let ropeX = 0;
let scrollY = 0;
let maxScrollY = 0;
let contentHeight = 0;
let layoutItems = [];
let pointerStart = null;
let moved = false;
let pendingAnchorY = 180;
let selectedEventId = '';
let selectedTimelineId = '';
let notebookQuery = '';
let resolveMode = '';
let shouldScrollToLatest = true;
let shouldTimelineListScrollLatest = false;
let activeKnotAnimation = null;
let activeHomePullAnimation = false;
let activeHomePull = null;
let ignoreNextRopeClick = false;
let animationFrame = 0;
let searchStabilizeFrame = 0;
let searchHomeRestingX = 0;
let lastStatsSignature = '';
let lastTimelineSignature = '';
let statsHideTimer = 0;
const currentUserId = 'preview-user';

let homeState = loadHomeState();
let activeRopeId = homeState.activeRopeId || homeState.ropes[0]?.id || '';
let viewMode = 'home';
let state = activeRopeId ? loadState() : emptyState();

function daysAgo(days) {
  return new Date(Date.now() - days * DAY_MS).toISOString();
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function demoState() {
  return {
    relationshipStartedAt: daysAgo(18),
    events: [
      {
        id: 'demo-resolved-soft',
        type: 'knot',
        status: 'resolved',
        content: '那天我们都太急着解释自己，后来才发现，先抱一下比先讲道理更重要。',
        createdBy: currentUserId,
        createdAt: daysAgo(15),
        resolvedAt: daysAgo(13),
        resolvedBy: currentUserId,
        resolutionLine: '下次我先把声音放低一点。',
      },
      {
        id: 'demo-open-message',
        type: 'knot',
        status: 'open',
        content: '关于那条没有回的消息，我嘴上说没事，但心里其实还是卡了一下。',
        createdBy: currentUserId,
        createdAt: daysAgo(4),
      },
      {
        id: 'demo-open-tonight',
        type: 'knot',
        status: 'open',
        content: '今天的小别扭，还没有真正变重。',
        createdBy: currentUserId,
        createdAt: daysAgo(1),
      },
    ],
  };
}

function emptyState() {
  return {
    relationshipStartedAt: new Date().toISOString(),
    events: [],
  };
}

function defaultRopes() {
  return [];
}

function defaultHomeState() {
  return {
    activeRopeId: '',
    ropes: defaultRopes(),
  };
}

function ropeStateKey(id) {
  return `${ROPE_STATE_PREFIX}${id}`;
}

function demoStateForRope(rope, index) {
  if (rope.id === DEFAULT_ROPE_ID) return demoState();
  return {
    relationshipStartedAt: rope.createdAt || new Date().toISOString(),
    events: index === 1
      ? [
        {
          id: 'daily-demo-note',
          type: 'knot',
          status: 'resolved',
          content: '这根绳专门放日常里的小别扭，写下来以后就没那么重了。',
          createdBy: currentUserId,
          createdAt: daysAgo(8),
          resolvedAt: daysAgo(7),
          resolvedBy: currentUserId,
          resolutionLine: '后来我们决定先问一句：你今天累不累。',
        },
      ]
      : [],
  };
}

function readStoredJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch (error) {
    console.warn(error);
  }
  return null;
}

function loadHomeState() {
  const stored = readStoredJson(HOME_STORAGE_KEY);
  if (stored && Array.isArray(stored.ropes)) {
    return {
      activeRopeId: stored.activeRopeId || stored.ropes[0]?.id || '',
      ropes: stored.ropes,
    };
  }

  const initial = defaultHomeState();
  localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function saveHomeState() {
  localStorage.setItem(HOME_STORAGE_KEY, JSON.stringify(homeState));
}

function clearStoredRopeStates() {
  Object.keys(localStorage)
    .filter((key) => key.startsWith(ROPE_STATE_PREFIX))
    .forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem(STORAGE_KEY);
}

function loadState() {
  if (!activeRopeId) return emptyState();
  const stored = readStoredJson(ropeStateKey(activeRopeId));
  if (stored && Array.isArray(stored.events)) return stored;

  const rope = homeState.ropes.find((entry) => entry.id === activeRopeId) || homeState.ropes[0];
  const initial = demoStateForRope(rope || { id: DEFAULT_ROPE_ID }, 0);
  saveRopeState(activeRopeId, initial);
  return initial;
}

function saveState() {
  if (!activeRopeId) return;
  saveRopeState(activeRopeId, state);
}

function saveRopeState(id, nextState) {
  localStorage.setItem(ropeStateKey(id), JSON.stringify(nextState));
  if (id === DEFAULT_ROPE_ID) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
}

function toTime(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function daysBetween(start, end = Date.now()) {
  const startTime = toTime(start);
  const endTime = toTime(end);
  if (!startTime || endTime < startTime) return 0;
  return Math.floor((endTime - startTime) / DAY_MS);
}

function hashText(value) {
  let hash = 0;
  const seed = String(value);
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function pickBadgeSubtitle(node, createdAt) {
  const options = node.subtitleOptions || (node.subtitle ? [node.subtitle] : []);
  if (!options.length) return '绳子自动记下的一枚印章。';
  const seed = `${node.id}:${node.kind}:${node.threshold}:${createdAt}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return options[hash % options.length];
}

function createRewardBadge(node, createdAt) {
  return {
    id: `badge-${node.id}`,
    type: 'badge',
    family: node.family || (node.kind === 'resolved' ? 'repair' : 'checkin'),
    title: node.title,
    mark: node.mark,
    subtitle: pickBadgeSubtitle(node, createdAt),
    tone: node.tone,
    createdAt,
  };
}

function sortByTime(items) {
  return items.slice().sort((a, b) => {
    const diff = toTime(a.createdAt) - toTime(b.createdAt);
    if (diff !== 0) return diff;
    return String(a.id).localeCompare(String(b.id));
  });
}

function sortForDisplay(items) {
  return sortByTime(items);
}

function layoutTimelineItems() {
  const items = sortForDisplay(state.events.concat(computeRewardBadges(state)));
  let cursor = 150;
  layoutItems = items.map((item) => {
    const preferred = Number(item.anchorY || cursor);
    const y = Math.max(preferred, cursor);
    cursor = y + 148;
    return { ...item, y };
  });
  const last = layoutItems.at(-1);
  contentHeight = Math.max(height + 80, last ? last.y + 180 : height + 80);
  maxScrollY = Math.max(0, contentHeight - height + 48);
  scrollY = Math.max(0, Math.min(scrollY, maxScrollY));
}

function badgeBaseVariant(item, badgeOrdinal) {
  const seed = hashText(`${item.id}:${item.createdAt}:${item.title}`);
  const toneIndex = (seed + badgeOrdinal * 5) % BADGE_TONES.length;
  const motifIndex = (seed + badgeOrdinal * 7) % BADGE_MOTIFS.length;
  return {
    tone: BADGE_TONES[toneIndex],
    motif: BADGE_MOTIFS[motifIndex],
    toneIndex,
    motifIndex,
  };
}

function pickUnusedBadgeOption(options, used, preferredIndex) {
  for (let offset = 0; offset < options.length; offset += 1) {
    const index = (preferredIndex + offset) % options.length;
    const value = options[index];
    if (!used.has(value)) return { value, index };
  }
  const index = preferredIndex % options.length;
  return { value: options[index], index };
}

function assignVisibleBadgeVariants(items) {
  const variants = new Map();
  const recentTones = [];
  const recentMotifs = [];
  const pageMemory = 6;
  let badgeOrdinal = 0;

  items.forEach((item) => {
    if (item.type !== 'badge') return;
    const variant = badgeBaseVariant(item, badgeOrdinal);
    const usedTones = new Set(recentTones);
    const usedMotifs = new Set(recentMotifs);

    if (usedTones.has(variant.tone)) {
      const picked = pickUnusedBadgeOption(BADGE_TONES, usedTones, variant.toneIndex + badgeOrdinal + 1);
      variant.tone = picked.value;
      variant.toneIndex = picked.index;
    }

    if (usedMotifs.has(variant.motif)) {
      const picked = pickUnusedBadgeOption(BADGE_MOTIFS, usedMotifs, variant.motifIndex + badgeOrdinal + 1);
      variant.motif = picked.value;
      variant.motifIndex = picked.index;
    }

    variants.set(item.id, variant);
    recentTones.push(variant.tone);
    recentMotifs.push(variant.motif);
    if (recentTones.length > pageMemory) recentTones.shift();
    if (recentMotifs.length > pageMemory) recentMotifs.shift();
    badgeOrdinal += 1;
  });

  return variants;
}

function computeRewardBadges(sourceState) {
  const relationshipStartedAt = sourceState.relationshipStartedAt || Date.now();
  const resolvedKnots = sortByTime(sourceState.events.filter((event) => event.type === 'knot' && event.status === 'resolved'));
  const knotEvents = sortByTime(sourceState.events.filter((event) => event.type === 'knot'));
  const openKnots = knotEvents.filter((event) => event.status !== 'resolved');
  const relationshipDays = daysBetween(relationshipStartedAt);

  return REWARD_BADGE_NODES.flatMap((node) => {
    if (node.kind === 'days') {
      if (relationshipDays < node.threshold) return [];
      const createdAt = new Date(toTime(relationshipStartedAt) + node.threshold * DAY_MS).toISOString();
      return [createRewardBadge(node, createdAt)];
    }

    if (node.kind === 'knot') {
      if (knotEvents.length < node.threshold) return [];
      const source = knotEvents[node.threshold - 1];
      return [createRewardBadge(node, source.createdAt)];
    }

    if (node.kind === 'resolved') {
      if (resolvedKnots.length < node.threshold) return [];
      const source = resolvedKnots[node.threshold - 1];
      const createdAt = source.resolvedAt || source.createdAt;
      return [createRewardBadge(node, createdAt)];
    }

    if (node.kind === 'peace') {
      const peaceStart = knotEvents.at(-1)?.createdAt || relationshipStartedAt;
      if (openKnots.length || daysBetween(peaceStart) < node.threshold) return [];
      const createdAt = new Date(toTime(peaceStart) + node.threshold * DAY_MS).toISOString();
      return [createRewardBadge(node, createdAt)];
    }

    return [];
  });
}

function noise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function ropeNotePaletteStyle(rope, tileIndex, usedPaletteIndexes) {
  const seed = Math.abs(hashText(`${rope.id}:${rope.name}:${tileIndex}`));
  let paletteIndex = seed % ROPE_NOTE_PALETTES.length;
  while (usedPaletteIndexes.has(paletteIndex) && usedPaletteIndexes.size < ROPE_NOTE_PALETTES.length) {
    paletteIndex = (paletteIndex + 1) % ROPE_NOTE_PALETTES.length;
  }
  usedPaletteIndexes.add(paletteIndex);
  const palette = ROPE_NOTE_PALETTES[paletteIndex];
  return [
    `--note-paper-a: ${palette.a}`,
    `--note-paper-b: ${palette.b}`,
    `--note-spot-a: ${palette.spotA}`,
    `--note-spot-b: ${palette.spotB}`,
    `--note-border: ${palette.border}`,
    `--note-sub: ${palette.sub}`,
  ].join('; ');
}

function formatDate(value) {
  const date = new Date(toTime(value));
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}.${month}.${day}`;
}

function updateFloatingDockBounds(rect = phone.getBoundingClientRect()) {
  const searchWidth = 182;
  const searchLeft = Math.round(rect.right - 12 - searchWidth);
  const searchTop = Math.round(rect.top + 112);
  const searchHeight = Math.max(260, Math.min(520, Math.round(rect.height - 230)));
  document.documentElement.style.setProperty('--global-search-left', `${searchLeft}px`);
  document.documentElement.style.setProperty('--global-search-top', `${searchTop}px`);
  document.documentElement.style.setProperty('--global-search-height', `${searchHeight}px`);
}

function rememberHomeRestingPosition() {
  if (!globalSearchDock.classList.contains('open')) {
    searchHomeRestingX = homePage.getBoundingClientRect().x;
  }
}

function clearSearchHomeStabilizer() {
  if (searchStabilizeFrame) {
    cancelAnimationFrame(searchStabilizeFrame);
    searchStabilizeFrame = 0;
  }
  homePage.classList.remove('search-stabilized');
  homePage.style.removeProperty('--search-home-offset');
}

function stabilizeHomeAfterSearchOpen(homeXBefore) {
  if (searchStabilizeFrame) cancelAnimationFrame(searchStabilizeFrame);
  searchStabilizeFrame = requestAnimationFrame(() => {
    const homeXAfter = homePage.getBoundingClientRect().x;
    const offset = Math.round(homeXBefore - homeXAfter);
    if (Math.abs(offset) > 1) {
      homePage.style.setProperty('--search-home-offset', `${offset}px`);
      homePage.classList.add('search-stabilized');
    } else {
      clearSearchHomeStabilizer();
    }
    searchStabilizeFrame = 0;
  });
}

function updateCanvasSize() {
  const rect = phone.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  width = Math.round(rect.width);
  height = Math.round(rect.height);
  updateFloatingDockBounds(rect);
  ropeX = Math.round(width / 2);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render();
}

function render() {
  if (!width || !height) return;
  if (viewMode === 'home') {
    renderHome();
    return;
  }
  layoutTimelineItems();
  if (shouldScrollToLatest) {
    scrollY = maxScrollY;
    shouldScrollToLatest = false;
  }
  drawPaper();
  drawRope();
  const badgeVariants = assignVisibleBadgeVariants(layoutItems);
  layoutItems.forEach((item, index) => {
    const screenY = item.y - scrollY;
    if (screenY < -120 || screenY > height + 120) return;
    if (item.id === selectedTimelineId && isRecordTimelineOpen()) drawTimelineHighlight(item, screenY, index);
    if (item.type === 'badge') drawRewardBadge(item, screenY, index, badgeVariants.get(item.id));
    else if (item.status === 'resolved') drawMark(item, screenY, index);
    else drawKnot(item, screenY, index);
  });
  drawScrollCue();
  updateChrome();
}

function requestRenderLoop() {
  if (animationFrame) return;
  animationFrame = requestAnimationFrame(() => {
    animationFrame = 0;
    render();
    if (activeKnotAnimation) requestRenderLoop();
  });
}

function drawPaper() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, width, height);
  drawPaperMottling();
  drawKraftFibers();
  drawPaperStains();
  drawPaperCreases();
  drawPaperEdgeWear();
  drawPaperVignette();
}

function drawPaperMottling() {
  for (let i = 0; i < 58; i += 1) {
    const x = noise(i + 401) * width;
    const y = noise(i + 409) * height;
    const radius = 28 + noise(i + 419) * 96;
    const warm = noise(i + 431) > 0.48;
    const gradient = ctx.createRadialGradient(x, y, 1, x, y, radius);
    gradient.addColorStop(0, warm ? 'rgba(232, 187, 109, 0.095)' : 'rgba(91, 58, 30, 0.07)');
    gradient.addColorStop(0.42, warm ? 'rgba(214, 160, 82, 0.045)' : 'rgba(82, 52, 27, 0.035)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  for (let i = 0; i < 130; i += 1) {
    const x = noise(i + 457) * width;
    const y = noise(i + 463) * height;
    const radius = 0.7 + noise(i + 467) * 3.2;
    const alpha = 0.025 + noise(i + 479) * 0.055;
    ctx.beginPath();
    ctx.fillStyle = `rgba(91, 56, 28, ${alpha})`;
    ctx.ellipse(x, y, radius * (1 + noise(i + 487) * 1.3), radius, noise(i + 491) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawKraftFibers() {
  for (let i = 0; i < 720; i += 1) {
    const x = noise(i + 3) * width;
    const y = noise(i + 19) * height;
    const alpha = 0.035 + noise(i + 29) * 0.085;
    const isLight = noise(i + 37) > 0.62;
    ctx.fillStyle = isLight
      ? `rgba(244, 215, 159, ${alpha * 0.7})`
      : `rgba(80, 52, 27, ${alpha})`;
    ctx.fillRect(x, y, 0.45 + noise(i + 31) * 2.4, 0.35 + noise(i + 41) * 1.8);
  }

  for (let i = 0; i < 148; i += 1) {
    const y = noise(i + 53) * height;
    const x = noise(i + 59) * width;
    const length = 24 + noise(i + 61) * 118;
    const alpha = 0.035 + noise(i + 67) * 0.07;
    drawHandLine(
      x,
      y,
      Math.min(width + 12, x + length),
      y + (noise(i + 71) - 0.5) * 3.4,
      `rgba(84, 55, 29, ${alpha})`,
      0.34 + noise(i + 73) * 0.32,
      i + 101
    );
  }

  for (let i = 0; i < 56; i += 1) {
    const x = noise(i + 511) * width;
    const y = noise(i + 523) * height;
    const length = 38 + noise(i + 541) * 128;
    drawHandLine(
      x,
      y,
      x + (noise(i + 547) - 0.5) * 12,
      Math.min(height + 18, y + length),
      `rgba(65, 42, 22, ${0.018 + noise(i + 557) * 0.045})`,
      0.28 + noise(i + 563) * 0.22,
      i + 571
    );
  }
}

function drawPaperStains() {
  const stains = [
    { x: 0.2, y: 0.19, radius: 62, alpha: 0.08, stretch: 1.35 },
    { x: 0.77, y: 0.36, radius: 88, alpha: 0.07, stretch: 0.8 },
    { x: 0.38, y: 0.78, radius: 72, alpha: 0.055, stretch: 1.16 },
  ];

  stains.forEach((stain, index) => {
    const x = width * stain.x + (noise(index + 601) - 0.5) * 24;
    const y = height * stain.y + (noise(index + 607) - 0.5) * 30;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((noise(index + 613) - 0.5) * 0.5);
    ctx.scale(stain.stretch, 1);
    ctx.beginPath();
    ctx.strokeStyle = `rgba(86, 55, 30, ${stain.alpha})`;
    ctx.lineWidth = 1.1;
    ctx.ellipse(0, 0, stain.radius, stain.radius * 0.62, 0, 0, Math.PI * 2);
    ctx.stroke();

    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, stain.radius * 0.95);
    gradient.addColorStop(0, `rgba(98, 59, 29, ${stain.alpha * 0.34})`);
    gradient.addColorStop(0.72, `rgba(98, 59, 29, ${stain.alpha * 0.18})`);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(-stain.radius, -stain.radius, stain.radius * 2, stain.radius * 2);
    ctx.restore();
  });
}

function drawPaperCreases() {
  const creases = [
    { x: width * 0.18, tilt: -12, alpha: 0.072 },
    { x: width * 0.66, tilt: 8, alpha: 0.055 },
    { x: width * 0.86, tilt: -6, alpha: 0.036 },
  ];

  creases.forEach((crease, index) => {
    ctx.save();
    ctx.globalAlpha = crease.alpha;
    const gradient = ctx.createLinearGradient(crease.x - 18, 0, crease.x + 18, 0);
    gradient.addColorStop(0, 'rgba(255, 232, 178, 0)');
    gradient.addColorStop(0.44, 'rgba(255, 232, 178, 0.9)');
    gradient.addColorStop(0.56, 'rgba(70, 44, 23, 0.85)');
    gradient.addColorStop(1, 'rgba(70, 44, 23, 0)');
    ctx.fillStyle = gradient;
    ctx.translate(crease.x, height / 2);
    ctx.rotate((crease.tilt * Math.PI) / 1800);
    ctx.fillRect(-18, -height, 36, height * 2);
    ctx.restore();

    drawHandLine(
      crease.x + (noise(index + 8) - 0.5) * 6,
      20,
      crease.x + (noise(index + 18) - 0.5) * 16,
      height - 20,
      `rgba(74, 47, 25, ${crease.alpha * 1.2})`,
      0.35,
      index + 211
    );
  });

  for (let i = 0; i < 8; i += 1) {
    const y = height * (0.12 + i * 0.11) + (noise(i + 180) - 0.5) * 20;
    drawHandLine(
      12,
      y,
      width - 10,
      y + (noise(i + 191) - 0.5) * 7,
      'rgba(255, 232, 179, 0.035)',
      0.5,
      i + 235
    );
  }
}

function drawPaperEdgeWear() {
  const edge = Math.max(26, width * 0.08);
  const leftGradient = ctx.createLinearGradient(0, 0, edge, 0);
  leftGradient.addColorStop(0, 'rgba(72, 42, 20, 0.16)');
  leftGradient.addColorStop(0.58, 'rgba(122, 76, 36, 0.045)');
  leftGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = leftGradient;
  ctx.fillRect(0, 0, edge, height);

  const rightGradient = ctx.createLinearGradient(width, 0, width - edge, 0);
  rightGradient.addColorStop(0, 'rgba(62, 38, 20, 0.14)');
  rightGradient.addColorStop(0.65, 'rgba(125, 82, 42, 0.04)');
  rightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rightGradient;
  ctx.fillRect(width - edge, 0, edge, height);

  for (let i = 0; i < 42; i += 1) {
    const y = noise(i + 701) * height;
    const side = noise(i + 709) > 0.5 ? width - 2 : 2;
    const inward = side > width / 2 ? -1 : 1;
    drawHandLine(
      side,
      y,
      side + inward * (8 + noise(i + 719) * 24),
      y + (noise(i + 727) - 0.5) * 10,
      `rgba(62, 39, 22, ${0.045 + noise(i + 733) * 0.07})`,
      0.45 + noise(i + 739) * 0.42,
      i + 743
    );
  }
}

function drawPaperVignette() {
  const gradient = ctx.createRadialGradient(width / 2, height * 0.42, width * 0.18, width / 2, height / 2, Math.max(width, height) * 0.72);
  gradient.addColorStop(0, 'rgba(255, 232, 178, 0.05)');
  gradient.addColorStop(0.72, 'rgba(108, 70, 35, 0.05)');
  gradient.addColorStop(1, 'rgba(68, 44, 23, 0.22)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function ropePoint(y, pass = 0) {
  const worldY = y + scrollY;
  return ropeX + Math.sin(worldY / 62) * 3.6 + Math.sin(worldY / 19 + pass) * 1.4;
}

function drawRope() {
  const layers = [
    { offset: 2.8, width: 14.5, color: ROPE_SHADOW, alpha: 0.42, wobble: 0.9 },
    { offset: 0, width: 12.2, color: ROPE_EDGE, alpha: 0.9, wobble: 0.85 },
    { offset: 0, width: 9.4, color: ROPE_BODY, alpha: 1, wobble: 0.75 },
    { offset: -2.1, width: 1.9, color: ROPE_HIGHLIGHT, alpha: 0.58, wobble: 0.5 },
  ];

  layers.forEach((layer, pass) => {
    ctx.beginPath();
    for (let y = -32; y <= height + 32; y += 9) {
      const x = ropePoint(y, pass) + layer.offset + (noise(y + pass * 13) - 0.5) * layer.wobble;
      if (y === -32) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = layer.color;
    ctx.lineWidth = layer.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = layer.alpha;
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  for (let y = -16; y <= height + 22; y += 44) {
    const x = ropePoint(y);
    drawHandLine(x - 2.8, y - 14, x - 3.7, y + 14, 'rgba(248, 235, 202, 0.24)', 0.75, y);
    drawHandLine(x + 4.2, y - 13, x + 3.4, y + 13, 'rgba(92, 70, 47, 0.18)', 0.7, y + 7);
  }

  for (let y = -8; y <= height + 20; y += 18) {
    const x = ropePoint(y);
    drawHandLine(x - 4.7, y - 7, x + 4.1, y + 7, 'rgba(103, 80, 54, 0.14)', 0.55, y + 19);
    drawHandLine(x + 4, y - 7, x - 4, y + 7, 'rgba(247, 233, 198, 0.12)', 0.45, y + 31);
  }
}

function drawHandLine(x1, y1, x2, y2, color, lineWidth, seed) {
  ctx.beginPath();
  for (let i = 0; i <= 5; i += 1) {
    const t = i / 5;
    const x = x1 + (x2 - x1) * t + (noise(seed + i * 7) - 0.5) * 1.4;
    const y = y1 + (y2 - y1) * t + (noise(seed + i * 11) - 0.5) * 1.4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawRoughOval(x, y, rx, ry, color, lineWidth, seed, rotate = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotate);
  ctx.scale(rx, ry);
  ctx.beginPath();
  for (let i = 0; i <= 26; i += 1) {
    const angle = (Math.PI * 2 * i) / 26;
    const radius = 1 + (noise(seed + i * 3) - 0.5) * 0.11;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth / Math.max(rx, ry);
  ctx.stroke();
  ctx.restore();
}

function strokeBuiltPath(buildPath, color, lineWidth, alpha = 1, offsetX = 0, offsetY = 0) {
  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  buildPath(ctx);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

function buildKnotBackPath(path, x, y, loosen) {
  path.moveTo(x + 1, y - 46);
  path.bezierCurveTo(x + 1, y - 34, x - 10 - loosen, y - 29, x - 24 - loosen, y - 18);
  path.bezierCurveTo(x - 49 - loosen, y + 1, x - 31 - loosen, y + 31, x - 1, y + 24);
  path.bezierCurveTo(x + 25 + loosen, y + 18, x + 38 + loosen, y - 3, x + 21 + loosen, y - 17);
}

function buildKnotFrontPath(path, x, y, loosen) {
  path.moveTo(x - 28 - loosen, y + 11);
  path.bezierCurveTo(x - 10, y - 6, x + 15, y - 6, x + 33 + loosen, y + 10);
  path.bezierCurveTo(x + 47 + loosen, y + 26, x + 10, y + 36, x - 6, y + 22);
  path.bezierCurveTo(x - 19, y + 11, x - 6, y - 9, x + 16, y - 20);
}

function buildKnotTailPath(path, x, y) {
  path.moveTo(x + 2, y + 14);
  path.bezierCurveTo(x + 8, y + 26, x + 5, y + 36, x, y + 47);
}

function getKnotAnimation(item) {
  if (!activeKnotAnimation || activeKnotAnimation.id !== item.id) {
    return { raw: 1, progress: 1, entering: false };
  }
  const elapsed = performance.now() - activeKnotAnimation.startedAt;
  const raw = Math.min(1, elapsed / activeKnotAnimation.duration);
  if (raw >= 1) activeKnotAnimation = null;
  return {
    raw,
    progress: 1 - Math.pow(1 - raw, 3),
    entering: raw < 1,
  };
}

function ropeStroke(buildPath, width = 9.8) {
  strokeBuiltPath(buildPath, ROPE_SHADOW, width + 4.6, 0.42, 2.6, 2.4);
  strokeBuiltPath(buildPath, ROPE_EDGE, width + 2.1, 0.92);
  strokeBuiltPath(buildPath, ROPE_BODY, width, 1);
  strokeBuiltPath(buildPath, ROPE_HIGHLIGHT, Math.max(1.15, width * 0.19), 0.58, -1.7, -1.3);
}

function buildLoopOval(path, side, rx, ry, seed) {
  const cx = side * (rx - 3);
  const steps = 28;
  for (let i = 0; i <= steps; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / steps;
    const wobble = 1 + (noise(seed + i * 3) - 0.5) * 0.07;
    const px = cx + Math.cos(angle) * rx * wobble;
    const py = Math.sin(angle) * ry * (1 + (noise(seed + i * 5) - 0.5) * 0.06);
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  }
  path.closePath();
}

function coverRopeSegment(x, y, seed) {
  strokeBuiltPath((path) => {
    path.moveTo(x, y - 54);
    path.bezierCurveTo(x + 2, y - 31, x - 3, y - 8, x + 1, y + 16);
    path.bezierCurveTo(x + 4, y + 34, x - 2, y + 47, x, y + 56);
  }, PAPER, 20, 0.95);

  for (let i = 0; i < 13; i += 1) {
    const px = x - 13 + noise(seed + i * 5) * 26;
    const py = y - 50 + noise(seed + i * 7) * 104;
    ctx.fillStyle = `rgba(78, 63, 45, ${0.025 + noise(seed + i * 11) * 0.045})`;
    ctx.fillRect(px, py, 0.7 + noise(seed + i * 13), 0.7 + noise(seed + i * 17));
  }
}

function drawKnot(item, y, index) {
  const x = ropeX;
  const seed = toTime(item.createdAt) / 100000;
  const animation = getKnotAnimation(item);
  const progress = animation.progress;
  const scale = animation.entering ? 0.58 + progress * 0.42 : 1;
  const jitter = (noise(seed) - 0.5) * 1.8;
  const side = index % 2 === 0 ? -1 : 1;
  const rx = 36 + noise(seed + 5) * 2 + (animation.entering ? (1 - progress) * 12 : 0);
  const ry = 27 + noise(seed + 9) * 1.5 + (animation.entering ? (1 - progress) * 7 : 0);

  ctx.save();
  ctx.translate(x + (animation.entering ? side * (1 - progress) * 14 : 0), y + jitter - (animation.entering ? (1 - progress) * 16 : 0));
  ctx.globalAlpha = animation.entering ? 0.42 + progress * 0.58 : 1;
  ctx.scale(scale, scale * (animation.entering ? 0.82 + progress * 0.18 : 1));
  ctx.rotate(side * (0.012 + (animation.entering ? (1 - progress) * 0.12 : 0)));

  const loopPath = (path) => buildLoopOval(path, side, rx, ry, seed + 11);
  const frontLipPath = (path) => {
    path.moveTo(side * (rx * 1.84), -1);
    path.bezierCurveTo(side * (rx * 1.72), ry * 0.72, side * (rx * 0.7), ry * 1.08, side * 5, ry * 0.55);
  };

  ropeStroke(loopPath, 10.4);
  ropeStroke(frontLipPath, 10.8);

  drawHandLine(side * 1, -ry * 0.82, side * (rx * 1.18), -ry * 0.38, 'rgba(86, 60, 34, 0.18)', 0.8, seed + 17);
  drawHandLine(side * (rx * 1.66), 2, side * 6, ry * 0.56, 'rgba(86, 60, 34, 0.24)', 0.9, seed + 23);
  drawHandLine(side * (rx * 0.42), -ry * 0.96, side * (rx * 1.45), -ry * 0.2, 'rgba(246, 232, 198, 0.18)', 0.7, seed + 29);
  drawHandLine(side * 9, ry * 0.92, side * (rx * 1.38), ry * 0.34, 'rgba(91, 69, 44, 0.13)', 0.65, seed + 33);
  drawHandLine(side * (rx * 0.08), -ry * 0.28, side * (rx * 0.44), ry * 0.62, 'rgba(78, 58, 36, 0.16)', 0.55, seed + 37);
  drawHandLine(side * (rx * 0.72), -ry * 0.74, side * (rx * 1.08), ry * 0.1, 'rgba(78, 58, 36, 0.16)', 0.55, seed + 41);
  drawHandLine(side * (rx * 1.42), -ry * 0.22, side * (rx * 1.12), ry * 0.7, 'rgba(78, 58, 36, 0.14)', 0.5, seed + 45);
  ctx.restore();

  if (animation.entering) drawNewKnotBirthEffect(item, x, y + jitter, side, seed, animation);
}

function drawNewKnotBirthEffect(item, x, y, side, seed, animation) {
  const raw = animation.raw;
  ctx.save();

  if (raw < 0.78) {
    const pullAlpha = Math.max(0, 1 - raw / 0.78) * 0.62;
    ctx.globalAlpha = pullAlpha;
    drawHandLine(x - side * 78, y - 38, x - side * 24, y - 9, ROPE_EDGE, 2.2, seed + 501);
    drawHandLine(x + side * 74, y + 36, x + side * 25, y + 10, ROPE_BODY, 2.1, seed + 511);
    drawHandLine(x - side * 58, y - 28, x + side * 58, y + 26, 'rgba(248, 235, 205, 0.28)', 0.75, seed + 521);
  }

  if (raw > 0.12) {
    const tagProgress = Math.min(1, (raw - 0.12) / 0.42);
    const fade = raw > 0.92 ? Math.max(0, (1 - raw) / 0.08) : 1;
    const tagX = x + side * (56 + tagProgress * 10);
    const tagY = y - 34 + (1 - tagProgress) * 22;
    ctx.globalAlpha = Math.min(1, tagProgress * 1.2) * fade;
    drawHandLine(x + side * 12, y - 12, tagX - side * 21, tagY + 3, 'rgba(92, 67, 40, 0.18)', 0.75, seed + 531);
    ctx.save();
    ctx.translate(tagX, tagY);
    ctx.rotate(side * (0.16 - tagProgress * 0.08));
    drawStickyNotePaper(48, 26, seed + 541);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `800 10px ${getComputedStyle(document.documentElement).getPropertyValue('--font-hand') || 'serif'}`;
    ctx.fillStyle = 'rgba(65, 42, 27, 0.72)';
    ctx.fillText(shortDate(item.createdAt), 0, -1);
    ctx.restore();
  }

  if (raw > 0.34 && raw < 0.96) {
    const ringProgress = (raw - 0.34) / 0.62;
    ctx.globalAlpha = (1 - Math.abs(ringProgress - 0.46)) * 0.52;
    drawRoughOval(x, y, 52 + ringProgress * 18, 36 + ringProgress * 10, 'rgba(135, 78, 54, 0.3)', 1.1, seed + 551, side * 0.12);
  }

  ctx.restore();
}

function drawMark(item, y, index) {
  drawResolvedStickyNote(item, y, index);
}

function resolvedNoteCenter(item, y, index) {
  const seed = toTime(item.createdAt) / 100000;
  const side = itemSide(index);
  return {
    x: ropeX + side * (38 + noise(seed + 8) * 5),
    y: y + (noise(seed + 12) - 0.5) * 4,
    side,
    seed,
  };
}

function resolvedNoteDate(item) {
  return shortDate(item.resolvedAt || item.createdAt);
}

function drawResolvedStickyNote(item, y, index) {
  const note = resolvedNoteCenter(item, y, index);
  drawStickyTape(ropeX, y, note.x, note.y, note.side, note.seed);
  ctx.save();
  ctx.translate(note.x, note.y);
  ctx.rotate(note.side * (0.045 + noise(note.seed + 4) * 0.035));
  drawStickyNotePaper(58, 38, note.seed);
  drawHandwrittenResolvedDate(item, note.seed);
  ctx.font = `700 8px ${getComputedStyle(document.documentElement).getPropertyValue('--font-hand') || 'serif'}`;
  ctx.fillStyle = 'rgba(91, 64, 39, 0.52)';
  ctx.fillText('解开', 0, 12);
  ctx.restore();
}

function drawHandwrittenResolvedDate(item, seed) {
  const dateText = resolvedNoteDate(item);
  const handFont = getComputedStyle(document.documentElement).getPropertyValue('--font-hand') || 'serif';
  ctx.save();
  ctx.rotate((noise(seed + 26) - 0.5) * 0.045);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 14px ${handFont}`;
  ctx.fillStyle = 'rgba(52, 34, 23, 0.82)';
  ctx.fillText(dateText, -0.35, -4.15);
  ctx.fillStyle = 'rgba(96, 58, 32, 0.5)';
  ctx.fillText(dateText, 0.55, -3.45);
  drawHandLine(-19, 4.2, 19, 3.1 + (noise(seed + 33) - 0.5) * 1.2, 'rgba(95, 58, 34, 0.42)', 0.72, seed + 41);
  ctx.restore();
}

function drawStickyNotePaper(widthTag, heightTag, seed) {
  ctx.save();
  ctx.shadowColor = 'rgba(72, 48, 24, 0.18)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  const corners = [
    [-widthTag * 0.5, -heightTag * 0.5 + 2],
    [widthTag * 0.5 - 2, -heightTag * 0.5],
    [widthTag * 0.5, heightTag * 0.5 - 4],
    [-widthTag * 0.5 + 3, heightTag * 0.5],
  ];
  corners.forEach(([x, y], index) => {
    const px = x + (noise(seed + index * 17) - 0.5) * 1.6;
    const py = y + (noise(seed + index * 19) - 0.5) * 1.4;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = '#dbc28a';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(112, 84, 49, 0.34)';
  ctx.lineWidth = 1.1;
  ctx.stroke();

  ctx.fillStyle = 'rgba(244, 224, 173, 0.5)';
  ctx.beginPath();
  ctx.moveTo(widthTag * 0.32, heightTag * 0.5 - 2);
  ctx.lineTo(widthTag * 0.5 - 3, heightTag * 0.28);
  ctx.lineTo(widthTag * 0.5 - 1, heightTag * 0.5 - 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStickyTape(anchorX, anchorY, noteX, noteY, side, seed) {
  drawHandLine(anchorX + side * 2, anchorY - 4, noteX - side * 22, noteY - 16, 'rgba(92, 67, 40, 0.18)', 0.75, seed + 21);
  ctx.save();
  ctx.translate(noteX - side * 2, noteY - 19);
  ctx.rotate(side * (0.08 + noise(seed + 5) * 0.025));
  ctx.fillStyle = 'rgba(241, 220, 176, 0.7)';
  ctx.strokeStyle = 'rgba(127, 96, 57, 0.22)';
  ctx.lineWidth = 0.8;
  ctx.fillRect(-22, -5, 44, 10);
  ctx.strokeRect(-22, -5, 44, 10);
  drawHandLine(-18, -1, 17, 0, 'rgba(126, 94, 55, 0.12)', 0.45, seed + 31);
  drawHandLine(-16, 3, 14, 2, 'rgba(255, 245, 214, 0.26)', 0.45, seed + 37);
  ctx.restore();
}

function drawTimelineHighlight(item, y, index) {
  const seed = toTime(item.createdAt) / 100000;
  const isBadge = item.type === 'badge';
  const isResolved = item.status === 'resolved';
  const side = isBadge ? itemSide(index + 1) : itemSide(index);
  const resolvedCenter = isResolved ? resolvedNoteCenter(item, y, index) : null;
  const centerX = isBadge
    ? ropeX + side * (48 + noise(seed + 5) * 10)
    : isResolved
      ? resolvedCenter.x
      : ropeX;
  const centerY = isBadge ? y + 46 : isResolved ? resolvedCenter.y : y;
  const radiusX = isBadge ? 54 : isResolved ? 44 : 74;
  const radiusY = isBadge ? 44 : isResolved ? 34 : 54;

  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = isBadge ? HIGHLIGHT_INK.badgeFill : HIGHLIGHT_INK.fill;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, radiusX, radiusY, (noise(seed + 17) - 0.5) * 0.18, 0, Math.PI * 2);
  ctx.fill();

  for (let ring = 0; ring < 2; ring += 1) {
    ctx.beginPath();
    for (let i = 0; i <= 28; i += 1) {
      const angle = (Math.PI * 2 * i) / 28;
      const wobble = 1 + (noise(seed + ring * 60 + i * 5) - 0.5) * 0.08;
      const px = centerX + Math.cos(angle) * (radiusX + ring * 3) * wobble;
      const py = centerY + Math.sin(angle) * (radiusY + ring * 2) * wobble;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = ring ? HIGHLIGHT_INK.shadow : HIGHLIGHT_INK.stroke;
    ctx.lineWidth = ring ? 1.15 : 2.35;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  if (isBadge) {
    drawHandLine(ropeX, y - 6, centerX, centerY - radiusY + 4, HIGHLIGHT_INK.tether, 0.8, seed + 151);
  }

  for (let i = 0; i < 5; i += 1) {
    drawHandLine(
      centerX - radiusX * 0.42 + noise(seed + i * 13) * radiusX * 0.84,
      centerY - radiusY - 8 + noise(seed + i * 17) * 12,
      centerX - radiusX * 0.2 + noise(seed + i * 19) * radiusX * 0.86,
      centerY - radiusY - 4 + noise(seed + i * 23) * 14,
      HIGHLIGHT_INK.scratch,
      0.55,
      seed + i * 31
    );
  }
  ctx.restore();
}

function drawRewardBadge(item, y, index, variant) {
  const side = itemSide(index + 1);
  const seed = toTime(item.createdAt) / 100000;
  const badgeX = ropeX + side * (48 + noise(seed + 5) * 10);
  const badgeY = y + 46;
  const tilt = side * (0.05 + noise(seed + 8) * 0.045);
  const visual = variant || badgeBaseVariant(item, index);
  const palette = badgePalette(visual.tone);
  const isRepair = item.family === 'repair';

  drawBadgeHanger(ropeX, y, badgeX, badgeY, side, seed, palette);

  ctx.save();
  ctx.translate(badgeX, badgeY + (noise(seed + 3) - 0.5) * 3);
  ctx.rotate(tilt);

  const widthTag = isRepair ? 58 : 62;
  const heightTag = isRepair ? 58 : 50;
  if (isRepair) drawRepairBadgeSeal(widthTag, heightTag, palette, seed);
  else drawCheckinBadgePlate(widthTag, heightTag, palette, seed);

  drawBadgeMotif(item, widthTag, heightTag, palette, seed, isRepair, visual.motif);
  drawBadgeAging(widthTag, heightTag, seed, palette);
  ctx.restore();
}

function badgeFamilyLabel(item) {
  return item.family === 'repair' ? '解结' : '打卡';
}

function drawBadgeHanger(anchorX, anchorY, badgeX, badgeY, side, seed, palette) {
  const ringY = anchorY - 3;
  const knotY = badgeY - 30;
  drawBadgeRing(anchorX, ringY, side, seed, palette);

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = palette.cord;
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(anchorX + side * 2, ringY + 7);
  ctx.bezierCurveTo(
    anchorX + side * 14,
    anchorY + 14,
    badgeX - side * 16,
    knotY - 10,
    badgeX - side * 15,
    knotY + 4
  );
  ctx.stroke();

  ctx.strokeStyle = palette.cordHighlight;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(anchorX - side * 3, ringY + 8);
  ctx.bezierCurveTo(
    anchorX + side * 8,
    anchorY + 19,
    badgeX + side * 12,
    knotY - 7,
    badgeX + side * 13,
    knotY + 6
  );
  ctx.stroke();

  ctx.fillStyle = palette.edge;
  ctx.beginPath();
  ctx.ellipse(badgeX, knotY + 7, 7.4, 4.8, side * 0.24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.highlight;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function badgePalette(tone) {
  const palettes = {
    paper: {
      fill: '#c2a879',
      edge: '#7c603a',
      shadow: 'rgba(72, 49, 25, 0.24)',
      highlight: 'rgba(246, 226, 181, 0.44)',
      ink: '#4b3420',
      fadedInk: 'rgba(75, 52, 32, 0.72)',
      oxide: 'rgba(112, 82, 47, 0.16)',
      cord: 'rgba(119, 86, 51, 0.48)',
      cordHighlight: 'rgba(245, 219, 174, 0.42)',
      ringShadow: 'rgba(86, 57, 30, 0.26)',
    },
    brass: {
      fill: '#b98d45',
      edge: '#70502a',
      shadow: 'rgba(62, 42, 20, 0.28)',
      highlight: 'rgba(245, 213, 139, 0.42)',
      ink: '#4a321c',
      fadedInk: 'rgba(74, 50, 28, 0.72)',
      oxide: 'rgba(61, 91, 72, 0.2)',
      cord: 'rgba(136, 96, 37, 0.5)',
      cordHighlight: 'rgba(249, 220, 136, 0.4)',
      ringShadow: 'rgba(93, 62, 18, 0.3)',
    },
    copper: {
      fill: '#a96742',
      edge: '#633922',
      shadow: 'rgba(59, 31, 18, 0.3)',
      highlight: 'rgba(235, 169, 110, 0.38)',
      ink: '#3b2418',
      fadedInk: 'rgba(59, 36, 24, 0.74)',
      oxide: 'rgba(63, 111, 97, 0.22)',
      cord: 'rgba(126, 68, 42, 0.5)',
      cordHighlight: 'rgba(240, 169, 111, 0.38)',
      ringShadow: 'rgba(82, 40, 24, 0.31)',
    },
    wax: {
      fill: '#9d4f46',
      edge: '#63302c',
      shadow: 'rgba(63, 25, 24, 0.28)',
      highlight: 'rgba(245, 173, 153, 0.34)',
      ink: '#f4e0bf',
      fadedInk: 'rgba(246, 224, 191, 0.72)',
      oxide: 'rgba(62, 44, 33, 0.18)',
      cord: 'rgba(111, 45, 44, 0.5)',
      cordHighlight: 'rgba(246, 176, 156, 0.34)',
      ringShadow: 'rgba(73, 24, 25, 0.32)',
    },
    sage: {
      fill: '#9a9b76',
      edge: '#5c5d42',
      shadow: 'rgba(50, 52, 35, 0.28)',
      highlight: 'rgba(223, 222, 163, 0.34)',
      ink: '#3f3e2a',
      fadedInk: 'rgba(63, 62, 42, 0.7)',
      oxide: 'rgba(80, 109, 89, 0.2)',
      cord: 'rgba(83, 91, 63, 0.5)',
      cordHighlight: 'rgba(224, 223, 166, 0.34)',
      ringShadow: 'rgba(48, 56, 38, 0.3)',
    },
    ink: {
      fill: '#6b6258',
      edge: '#38322d',
      shadow: 'rgba(42, 35, 30, 0.32)',
      highlight: 'rgba(197, 184, 166, 0.3)',
      ink: '#efe0bd',
      fadedInk: 'rgba(239, 224, 189, 0.72)',
      oxide: 'rgba(77, 101, 88, 0.18)',
      cord: 'rgba(57, 51, 46, 0.52)',
      cordHighlight: 'rgba(203, 191, 174, 0.32)',
      ringShadow: 'rgba(34, 29, 26, 0.36)',
    },
    indigo: {
      fill: '#68728f',
      edge: '#343d5e',
      shadow: 'rgba(38, 44, 71, 0.3)',
      highlight: 'rgba(191, 201, 231, 0.3)',
      ink: '#f1e5c7',
      fadedInk: 'rgba(239, 229, 199, 0.68)',
      oxide: 'rgba(55, 74, 92, 0.2)',
      cord: 'rgba(54, 63, 97, 0.5)',
      cordHighlight: 'rgba(191, 203, 232, 0.32)',
      ringShadow: 'rgba(32, 39, 66, 0.34)',
    },
    rose: {
      fill: '#b87972',
      edge: '#74413f',
      shadow: 'rgba(83, 42, 39, 0.28)',
      highlight: 'rgba(245, 194, 182, 0.32)',
      ink: '#4c2c2b',
      fadedInk: 'rgba(76, 44, 43, 0.68)',
      oxide: 'rgba(104, 69, 54, 0.18)',
      cord: 'rgba(129, 67, 64, 0.48)',
      cordHighlight: 'rgba(247, 197, 185, 0.32)',
      ringShadow: 'rgba(82, 42, 40, 0.3)',
    },
    verdigris: {
      fill: '#6f9a8c',
      edge: '#3b645c',
      shadow: 'rgba(35, 73, 67, 0.28)',
      highlight: 'rgba(187, 232, 211, 0.28)',
      ink: '#283f39',
      fadedInk: 'rgba(40, 63, 57, 0.7)',
      oxide: 'rgba(86, 126, 108, 0.24)',
      cord: 'rgba(54, 101, 91, 0.5)',
      cordHighlight: 'rgba(188, 232, 212, 0.3)',
      ringShadow: 'rgba(34, 72, 66, 0.32)',
    },
    plum: {
      fill: '#80627a',
      edge: '#4d344b',
      shadow: 'rgba(57, 36, 56, 0.29)',
      highlight: 'rgba(220, 189, 211, 0.3)',
      ink: '#efe0c7',
      fadedInk: 'rgba(239, 224, 199, 0.68)',
      oxide: 'rgba(82, 61, 76, 0.2)',
      cord: 'rgba(79, 51, 77, 0.5)',
      cordHighlight: 'rgba(220, 190, 211, 0.3)',
      ringShadow: 'rgba(52, 32, 51, 0.33)',
    },
    ochre: {
      fill: '#c19a4c',
      edge: '#755622',
      shadow: 'rgba(78, 53, 18, 0.27)',
      highlight: 'rgba(246, 221, 145, 0.36)',
      ink: '#51370e',
      fadedInk: 'rgba(81, 55, 14, 0.68)',
      oxide: 'rgba(107, 86, 41, 0.18)',
      cord: 'rgba(135, 94, 34, 0.5)',
      cordHighlight: 'rgba(247, 222, 146, 0.36)',
      ringShadow: 'rgba(81, 55, 19, 0.29)',
    },
    lapis: {
      fill: '#596f93',
      edge: '#30466b',
      shadow: 'rgba(34, 48, 78, 0.3)',
      highlight: 'rgba(182, 203, 233, 0.3)',
      ink: '#ede0c1',
      fadedInk: 'rgba(237, 224, 193, 0.7)',
      oxide: 'rgba(54, 79, 108, 0.22)',
      cord: 'rgba(49, 69, 103, 0.5)',
      cordHighlight: 'rgba(184, 205, 234, 0.3)',
      ringShadow: 'rgba(30, 42, 70, 0.34)',
    },
    clay: {
      fill: '#b06f55',
      edge: '#6d3f31',
      shadow: 'rgba(70, 36, 27, 0.29)',
      highlight: 'rgba(235, 179, 145, 0.32)',
      ink: '#42281f',
      fadedInk: 'rgba(66, 40, 31, 0.68)',
      oxide: 'rgba(100, 63, 45, 0.2)',
      cord: 'rgba(117, 60, 45, 0.5)',
      cordHighlight: 'rgba(237, 181, 147, 0.32)',
      ringShadow: 'rgba(72, 37, 27, 0.31)',
    },
    moss: {
      fill: '#7f8759',
      edge: '#4c552f',
      shadow: 'rgba(44, 54, 27, 0.29)',
      highlight: 'rgba(206, 218, 151, 0.31)',
      ink: '#313820',
      fadedInk: 'rgba(49, 56, 32, 0.68)',
      oxide: 'rgba(77, 103, 74, 0.22)',
      cord: 'rgba(72, 86, 43, 0.5)',
      cordHighlight: 'rgba(208, 219, 153, 0.31)',
      ringShadow: 'rgba(39, 49, 25, 0.32)',
    },
    wine: {
      fill: '#8e4f59',
      edge: '#5a2932',
      shadow: 'rgba(66, 25, 33, 0.29)',
      highlight: 'rgba(232, 161, 172, 0.31)',
      ink: '#f1dfc1',
      fadedInk: 'rgba(241, 223, 193, 0.68)',
      oxide: 'rgba(82, 46, 52, 0.2)',
      cord: 'rgba(96, 40, 50, 0.5)',
      cordHighlight: 'rgba(233, 163, 174, 0.31)',
      ringShadow: 'rgba(64, 24, 31, 0.33)',
    },
    smoke: {
      fill: '#8b8172',
      edge: '#554c41',
      shadow: 'rgba(56, 48, 40, 0.28)',
      highlight: 'rgba(216, 203, 184, 0.31)',
      ink: '#372f28',
      fadedInk: 'rgba(55, 47, 40, 0.68)',
      oxide: 'rgba(91, 82, 70, 0.18)',
      cord: 'rgba(86, 76, 65, 0.5)',
      cordHighlight: 'rgba(217, 204, 185, 0.31)',
      ringShadow: 'rgba(48, 41, 35, 0.32)',
    },
  };
  return palettes[tone] || palettes.brass;
}

function drawCheckinBadgePlate(widthTag, heightTag, palette, seed) {
  ctx.save();
  ctx.shadowColor = palette.shadow;
  ctx.shadowBlur = 7;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  const points = [
    [-widthTag * 0.5 + 8, -heightTag * 0.5],
    [widthTag * 0.5 - 5, -heightTag * 0.5 + 2],
    [widthTag * 0.5, -heightTag * 0.16],
    [widthTag * 0.5 - 6, heightTag * 0.5],
    [-widthTag * 0.5 + 4, heightTag * 0.5 - 1],
    [-widthTag * 0.5, heightTag * 0.06],
  ];
  points.forEach(([x, y], index) => {
    const px = x + (noise(seed + index * 17) - 0.5) * 2.4;
    const py = y + (noise(seed + index * 19) - 0.5) * 2;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fillStyle = palette.fill;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = palette.edge;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.strokeStyle = palette.highlight;
  ctx.lineWidth = 0.9;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(-widthTag * 0.36, -heightTag * 0.34);
  ctx.lineTo(widthTag * 0.34, -heightTag * 0.34 + (noise(seed + 7) - 0.5) * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = 'rgba(69, 45, 25, 0.18)';
  ctx.beginPath();
  ctx.ellipse(-widthTag * 0.34, -heightTag * 0.22, 4.6, 3.9, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(247, 229, 187, 0.34)';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  for (let i = 0; i < 3; i += 1) {
    drawHandLine(
      -widthTag * 0.36 + i * 7,
      heightTag * 0.26 + noise(seed + i) * 2,
      widthTag * 0.28 + i * 2,
      heightTag * 0.22 + (noise(seed + i + 10) - 0.5) * 3,
      `rgba(73, 48, 28, ${0.11 + i * 0.025})`,
      0.55,
      seed + i * 29
    );
  }
  ctx.restore();
}

function drawRepairBadgeSeal(widthTag, heightTag, palette, seed) {
  ctx.save();
  ctx.shadowColor = palette.shadow;
  ctx.shadowBlur = 9;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  for (let i = 0; i <= 28; i += 1) {
    const angle = (Math.PI * 2 * i) / 28;
    const ripple = 1 + Math.sin(angle * 5 + seed) * 0.035 + (noise(seed + i * 13) - 0.5) * 0.07;
    const x = Math.cos(angle) * widthTag * 0.48 * ripple;
    const y = Math.sin(angle) * heightTag * 0.48 * ripple;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = palette.fill;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = palette.edge;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.strokeStyle = palette.highlight;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(-1, -3, widthTag * 0.32, heightTag * 0.28, -0.18, 0, Math.PI * 2);
  ctx.stroke();

  drawHandLine(-widthTag * 0.28, heightTag * 0.24, widthTag * 0.28, -heightTag * 0.2, palette.edge, 1.1, seed + 31);
  drawHandLine(-widthTag * 0.24, -heightTag * 0.18, widthTag * 0.3, heightTag * 0.2, palette.highlight, 0.75, seed + 37);
  drawHandLine(-widthTag * 0.34, heightTag * 0.02, widthTag * 0.34, heightTag * 0.04, 'rgba(49, 31, 22, 0.24)', 0.72, seed + 43);
  ctx.restore();
}

function drawBadgeMotif(item, widthTag, heightTag, palette, seed, isRepair, motifName) {
  const motif = motifName || BADGE_MOTIFS[hashText(`${item.id}:${item.title}:${item.family}`) % BADGE_MOTIFS.length];
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = palette.ink;
  ctx.fillStyle = palette.highlight;
  ctx.globalAlpha = isRepair ? 0.76 : 0.68;

  if (motif === 'star') {
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? 17 : 7;
      const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 10;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = 0.95;
    ctx.stroke();
  } else if (motif === 'leafSprig') {
    ctx.lineWidth = 1.1;
    drawHandLine(-20, 8, 20, -8, palette.ink, 0.95, seed + 101);
    [-10, 0, 10].forEach((offset, index) => {
      ctx.beginPath();
      ctx.ellipse(offset - 2, -offset * 0.28, 6, 11, -0.72, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = palette.edge;
      ctx.stroke();
      drawHandLine(offset - 6, -offset * 0.28, offset + 3, -offset * 0.28 - 7, palette.highlight, 0.55, seed + index + 109);
    });
  } else if (motif === 'crescent') {
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0.35 * Math.PI, 1.68 * Math.PI);
    ctx.arc(7, -1, 13, 1.66 * Math.PI, 0.38 * Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = 1;
    ctx.stroke();
    drawHandLine(-10, 13, 14, -14, palette.highlight, 0.72, seed + 119);
  } else if (motif === 'sunburst') {
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8;
      drawHandLine(0, 0, Math.cos(angle) * 19, Math.sin(angle) * 13, palette.ink, 0.75, seed + i + 127);
    }
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (motif === 'ticketShield') {
    ctx.beginPath();
    ctx.moveTo(-18, -8);
    ctx.lineTo(0, -17);
    ctx.lineTo(18, -8);
    ctx.lineTo(13, 16);
    ctx.lineTo(0, 9);
    ctx.lineTo(-13, 16);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = 0.95;
    ctx.stroke();
    drawHandLine(-13, -6, 12, -5, palette.highlight, 0.7, seed + 137);
  } else if (motif === 'eyelet') {
    ctx.beginPath();
    ctx.ellipse(0, 0, 19, 12, -0.12, 0, Math.PI * 2);
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
    ctx.fill();
    for (let i = -1; i <= 1; i += 1) {
      drawHandLine(-16, i * 6, 16, i * 5 + (noise(seed + i + 149) - 0.5) * 2, palette.highlight, 0.55, seed + i + 151);
    }
  } else if (motif === 'pinwheel') {
    for (let i = 0; i < 4; i += 1) {
      ctx.save();
      ctx.rotate((Math.PI / 2) * i + (noise(seed + i + 201) - 0.5) * 0.08);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(16, -4, 18, -17);
      ctx.quadraticCurveTo(5, -13, 0, 0);
      ctx.fill();
      ctx.strokeStyle = palette.edge;
      ctx.lineWidth = 0.85;
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
    ctx.fillStyle = palette.ink;
    ctx.fill();
  } else if (motif === 'knotLoop') {
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 2.1;
    ctx.beginPath();
    ctx.ellipse(-7, 0, 13, 8, -0.62, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(8, 0, 13, 8, 0.62, 0, Math.PI * 2);
    ctx.stroke();
    drawHandLine(-18, 0, 18, 0, palette.highlight, 0.85, seed + 221);
  } else if (motif === 'stitchedOval') {
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 13, -0.1, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 9; i += 1) {
      const angle = (Math.PI * 2 * i) / 9;
      const x = Math.cos(angle) * 20;
      const y = Math.sin(angle) * 13;
      drawHandLine(x - 2.4, y - 2.4, x + 2.4, y + 2.4, palette.highlight, 0.75, seed + i + 231);
    }
  } else if (motif === 'seedCluster') {
    for (let i = 0; i < 9; i += 1) {
      const x = -13 + (i % 3) * 13 + (noise(seed + i + 241) - 0.5) * 2;
      const y = -8 + Math.floor(i / 3) * 8 + (noise(seed + i + 251) - 0.5) * 2;
      ctx.beginPath();
      ctx.ellipse(x, y, 3.8, 2.4, noise(seed + i + 261) * Math.PI, 0, Math.PI * 2);
      ctx.fillStyle = i % 2 ? palette.highlight : palette.ink;
      ctx.fill();
    }
  } else if (motif === 'diamondFold') {
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(18, 0);
    ctx.lineTo(0, 18);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = 0.95;
    ctx.stroke();
    drawHandLine(0, -17, 0, 17, palette.ink, 0.7, seed + 271);
    drawHandLine(-17, 0, 17, 0, palette.highlight, 0.7, seed + 277);
  } else if (motif === 'ribbonLoop') {
    ctx.beginPath();
    ctx.ellipse(-9, -2, 11, 8, -0.28, 0, Math.PI * 2);
    ctx.ellipse(10, -2, 11, 8, 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    drawHandLine(-4, 7, -10, 18, palette.ink, 0.85, seed + 281);
    drawHandLine(5, 7, 12, 18, palette.highlight, 0.85, seed + 287);
  } else if (motif === 'comet') {
    ctx.beginPath();
    ctx.arc(-7, -1, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = 0.9;
    ctx.stroke();
    for (let i = 0; i < 4; i += 1) {
      drawHandLine(2, -8 + i * 5, 22, -14 + i * 7, i % 2 ? palette.highlight : palette.ink, 0.75, seed + i + 291);
    }
  } else if (motif === 'windowFrame') {
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 1.35;
    ctx.strokeRect(-17, -13, 34, 26);
    drawHandLine(0, -13, 0, 13, palette.highlight, 0.85, seed + 301);
    drawHandLine(-17, 0, 17, 0, palette.highlight, 0.85, seed + 307);
    ctx.fillStyle = palette.oxide;
    ctx.fillRect(-13, -9, 8, 6);
    ctx.fillRect(5, 3, 8, 6);
  } else if (motif === 'scallopFlower') {
    for (let i = 0; i < 6; i += 1) {
      ctx.save();
      ctx.rotate((Math.PI * 2 * i) / 6);
      ctx.beginPath();
      ctx.ellipse(0, -12, 5.8, 10.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = palette.edge;
      ctx.lineWidth = 0.75;
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 4.8, 0, Math.PI * 2);
    ctx.fillStyle = palette.ink;
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, 13);
    ctx.bezierCurveTo(-24, -4, -12, -24, 0, -10);
    ctx.bezierCurveTo(12, -24, 24, -4, 0, 13);
    ctx.fill();
    ctx.strokeStyle = palette.edge;
    ctx.lineWidth = 1.15;
    ctx.stroke();
    drawHandLine(-14, 10, 14, -10, palette.ink, 0.82, seed + 317);
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.oxide;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(
      -widthTag * 0.22 + noise(seed + i + 163) * widthTag * 0.44,
      -heightTag * 0.2 + noise(seed + i + 173) * heightTag * 0.42,
      1.2 + noise(seed + i + 181) * 1.8,
      0.8 + noise(seed + i + 191) * 1.5,
      noise(seed + i + 199) * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
}

function drawBadgeRing(x, y, side, seed, palette) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(side * 0.12);

  ctx.strokeStyle = palette.ringShadow;
  ctx.lineWidth = 8.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 11, side * 0.1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = palette.edge;
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(0, 0, 15.2, 10.4, side * 0.1, -0.18, Math.PI * 1.78);
  ctx.stroke();

  ctx.strokeStyle = palette.highlight;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(-side * 2, -2, 10, 6.6, side * 0.1, Math.PI * 1.02, Math.PI * 1.64);
  ctx.stroke();

  for (let i = 0; i < 5; i += 1) {
    drawHandLine(
      -side * (4 + noise(seed + i) * 12),
      -9 + i * 5,
      side * (8 + noise(seed + i + 20) * 12),
      -8 + i * 5 + (noise(seed + i + 40) - 0.5) * 3,
      `rgba(52, 34, 19, ${0.08 + noise(seed + i + 60) * 0.08})`,
      0.42,
      seed + i + 80
    );
  }
  ctx.restore();
}

function drawAgedBadgePlate(widthTag, heightTag, palette, seed) {
  ctx.save();
  ctx.shadowColor = palette.shadow;
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;
  ctx.beginPath();
  for (let i = 0; i <= 22; i += 1) {
    const angle = (Math.PI * 2 * i) / 22;
    const radius = 1 + (noise(seed + i * 5) - 0.5) * 0.08;
    const x = Math.cos(angle) * widthTag * 0.5 * radius;
    const y = Math.sin(angle) * heightTag * 0.5 * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = palette.fill;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = palette.edge;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  ctx.strokeStyle = palette.highlight;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(-3, -4, widthTag * 0.36, heightTag * 0.32, -0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawBadgeAging(widthTag, heightTag, seed, palette) {
  ctx.save();
  for (let i = 0; i < 18; i += 1) {
    const x = -widthTag * 0.42 + noise(seed + i * 9) * widthTag * 0.84;
    const y = -heightTag * 0.38 + noise(seed + i * 11) * heightTag * 0.76;
    ctx.fillStyle = i % 3 === 0 ? palette.oxide : `rgba(55, 35, 18, ${0.055 + noise(seed + i * 13) * 0.08})`;
    ctx.beginPath();
    ctx.ellipse(x, y, 1.2 + noise(seed + i * 15) * 3.2, 0.8 + noise(seed + i * 17) * 2.4, noise(seed + i * 19) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 9; i += 1) {
    drawHandLine(
      -widthTag * 0.36 + noise(seed + i * 23) * widthTag * 0.72,
      -heightTag * 0.3 + noise(seed + i * 29) * heightTag * 0.6,
      -widthTag * 0.2 + noise(seed + i * 31) * widthTag * 0.72,
      -heightTag * 0.25 + noise(seed + i * 37) * heightTag * 0.6,
      `rgba(255, 238, 196, ${0.08 + noise(seed + i * 41) * 0.1})`,
      0.42,
      seed + i * 43
    );
  }
  ctx.restore();
}

function itemSide(index) {
  return index % 2 === 0 ? -1 : 1;
}

function drawScrollCue() {
  if (maxScrollY <= 8) return;
  const progress = scrollY / maxScrollY;
  const trackHeight = 56;
  const y = 132 + (height - 258 - trackHeight) * progress;
  ctx.save();
  ctx.globalAlpha = 0.34;
  ctx.strokeStyle = 'rgba(75, 63, 51, 0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width - 18, 132);
  ctx.lineTo(width - 18, height - 126);
  ctx.stroke();
  ctx.fillStyle = 'rgba(75, 63, 51, 0.42)';
  ctx.fillRect(width - 20, y, 4, trackHeight);
  ctx.restore();
}

function updateChrome() {
  const openCount = state.events.filter((event) => event.status !== 'resolved').length;
  const resolvedCount = state.events.filter((event) => event.status === 'resolved').length;
  const days = daysBetween(state.relationshipStartedAt);
  const stats = [
    ['相伴', `${days}天`],
    ['未解', `${openCount}`],
    ['已解', `${resolvedCount}`],
  ];
  const signature = stats.map(([, value]) => value).join('|');

  if (signature !== lastStatsSignature) {
    statsBar.innerHTML = stats
      .map(([label, value]) => `<span class="stat"><b class="stat-value">${value}</b><span class="stat-label">${label}</span></span>`)
      .join('');
    statsBar.classList.remove('stats-flash');
    void statsBar.offsetWidth;
    statsBar.classList.add('stats-flash');
    lastStatsSignature = signature;
  }

  updateRecordTimeline();
}

function ropeSummary(rope) {
  const ropeState = loadRopeStateForHome(rope.id);
  const openCount = ropeState.events.filter((event) => event.status !== 'resolved').length;
  const resolvedCount = ropeState.events.filter((event) => event.status === 'resolved').length;
  return { openCount, resolvedCount };
}

function loadRopeStateForHome(id) {
  const stored = readStoredJson(ropeStateKey(id));
  return stored && Array.isArray(stored.events) ? stored : emptyState();
}

function renderHome() {
  if (!ropeShelf) return;
  phone.classList.add('home-mode');
  phone.classList.remove('rope-mode');
  renderGlobalSearchList();

  const rows = Math.max(4, Math.ceil(homeState.ropes.length / 2));
  const usedNotePaletteIndexes = new Set();
  const shelfRows = Array.from({ length: rows }, (_, rowIndex) => {
    const rowRopes = homeState.ropes.slice(rowIndex * 2, rowIndex * 2 + 2);
    const slots = Array.from({ length: 2 }, (_, slotIndex) => {
      const rope = rowRopes[slotIndex];
      if (!rope) {
        return '<div class="cabinet-slot empty-slot" aria-hidden="true"></div>';
      }

        const summary = ropeSummary(rope);
        const tileIndex = rowIndex * 2 + slotIndex;
        const noteStyle = ropeNotePaletteStyle(rope, tileIndex, usedNotePaletteIndexes);
        return `
          <button class="cabinet-slot rope-tile" type="button" data-rope-id="${escapeHtml(rope.id)}" style="--tile-index: ${tileIndex}" aria-label="打开${escapeHtml(rope.name)}">
            <span class="rope-coil" aria-hidden="true">
              <span class="rope-coil-line rope-coil-line-a"></span>
              <span class="rope-coil-line rope-coil-line-b"></span>
              <span class="rope-coil-line rope-coil-line-c"></span>
            </span>
            <span class="rope-note" style="${noteStyle}">
              <b>${escapeHtml(rope.name)}</b>
              <span>${summary.openCount}结 · ${summary.resolvedCount}解</span>
            </span>
          </button>
        `;
    }).join('');

    return `
      <div class="cabinet-row" style="--row-index: ${rowIndex}; --row-center: ${(rows - 1) / 2}">
        <span class="cabinet-back" aria-hidden="true"></span>
        <div class="cabinet-slots">${slots}</div>
        <span class="cabinet-front" aria-hidden="true"></span>
      </div>
    `;
  }).join('');

  ropeShelf.innerHTML = `
    <div class="cabinet-stack" style="--home-rows: ${rows}">
      <span class="cabinet-top" aria-hidden="true"></span>
      ${shelfRows}
      <span class="cabinet-bottom" aria-hidden="true"></span>
    </div>
  `;
  rememberHomeRestingPosition();
}

function globalSearchItems(query) {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return homeState.ropes.flatMap((rope) => {
    const ropeState = loadRopeStateForHome(rope.id);
    return ropeState.events
      .filter((event) => event.type === 'knot')
      .filter((event) => {
        const haystack = [
          rope.name,
          event.content,
          event.resolutionLine || '',
          formatDate(event.createdAt),
          shortDate(event.createdAt),
          event.resolvedAt ? formatDate(event.resolvedAt) : '',
          event.resolvedAt ? shortDate(event.resolvedAt) : '',
        ].join(' ').toLowerCase();
        return haystack.includes(needle);
      })
      .map((event) => ({ rope, event }));
  });
}

function renderGlobalSearchList() {
  if (!globalSearchList || !globalSearchInput) return;
  const query = globalSearchInput.value.trim();
  const items = globalSearchItems(query);
  if (!query) {
    globalSearchList.innerHTML = '<div class="global-search-empty">写下关键词，会从每根绳里一起找。</div>';
    return;
  }

  globalSearchList.innerHTML = items.length
    ? items
      .map(({ rope, event }) => `
        <button class="global-search-entry" type="button" data-rope-id="${escapeHtml(rope.id)}" data-event-id="${escapeHtml(event.id)}">
          <span class="global-search-rope">${escapeHtml(rope.name)}</span>
          <span class="global-search-copy">${escapeHtml(event.content)}</span>
          <span class="global-search-date">${escapeHtml(shortDate(event.createdAt))}</span>
        </button>
      `)
      .join('')
    : '<div class="global-search-empty">没有找到这段绳记。</div>';
}

function nextVisibleAnchorY() {
  const visibleAnchor = scrollY + Math.min(Math.max(height * 0.42, 210), height - 230);
  const lastAnchor = state.events.reduce((max, event) => Math.max(max, Number(event.anchorY || 0)), 0);
  return Math.max(130, visibleAnchor, lastAnchor + 132);
}

function toggleExchangeTray(forceOpen) {
  const isOpen = forceOpen == null ? !exchangeDock.classList.contains('open') : forceOpen;
  if (isOpen) {
    toggleRecordTimeline(false);
    toggleSettingsDock(false);
    toggleGlobalSearch(false);
  }
  exchangeDock.classList.toggle('open', isOpen);
  exchangeButton.setAttribute('aria-expanded', String(isOpen));
  exchangeTray.setAttribute('aria-hidden', String(!isOpen));
}

function toggleRecordTimeline(forceOpen) {
  const isOpen = forceOpen == null ? !recordTimelineDock.classList.contains('open') : forceOpen;
  if (isOpen) {
    toggleSettingsDock(false);
    toggleGlobalSearch(false);
    toggleExchangeTray(false);
    shouldTimelineListScrollLatest = true;
  }
  recordTimelineDock.classList.toggle('open', isOpen);
  timelineToggle.classList.toggle('open', isOpen);
  timelineToggle.setAttribute('aria-expanded', String(isOpen));
  recordTimelineDock.setAttribute('aria-hidden', String(!isOpen));
  render();
}

function toggleGlobalSearch(forceOpen) {
  const isOpen = forceOpen == null ? !globalSearchDock.classList.contains('open') : forceOpen;
  const homeXBefore = searchHomeRestingX || homePage.getBoundingClientRect().x;
  if (isOpen) {
    updateFloatingDockBounds();
    toggleSettingsDock(false);
    toggleRecordTimeline(false);
    toggleExchangeTray(false);
    renderGlobalSearchList();
  }
  globalSearchDock.classList.toggle('open', isOpen);
  homeSearchToggle.classList.remove('open');
  homeSearchToggle.setAttribute('aria-expanded', String(isOpen));
  globalSearchDock.setAttribute('aria-hidden', String(!isOpen));
  homeSearchToggle.blur();
  if (isOpen) stabilizeHomeAfterSearchOpen(homeXBefore);
  else {
    clearSearchHomeStabilizer();
    globalSearchInput.blur();
    requestAnimationFrame(rememberHomeRestingPosition);
  }
}

function toggleSettingsDock(forceOpen) {
  const isOpen = forceOpen == null ? !settingsDock.classList.contains('open') : forceOpen;
  if (isOpen) {
    toggleExchangeTray(false);
    toggleRecordTimeline(false);
    toggleGlobalSearch(false);
  }
  settingsDock.classList.toggle('open', isOpen);
  settingsToggle.classList.toggle('open', isOpen);
  settingsToggle.setAttribute('aria-expanded', String(isOpen));
  settingsDock.setAttribute('aria-hidden', String(!isOpen));
  if (!isOpen) resetConfirmPanel.classList.add('hidden');
}

function askResetConfirmation() {
  resetConfirmPanel.classList.remove('hidden');
}

function resetPreviewState() {
  clearStoredRopeStates();
  homeState = defaultHomeState();
  activeRopeId = '';
  viewMode = 'home';
  state = emptyState();
  saveHomeState();
  scrollY = 0;
  selectedEventId = '';
  selectedTimelineId = '';
  resolveMode = '';
  activeKnotAnimation = null;
  lastStatsSignature = '';
  lastTimelineSignature = '__reset__';
  shouldScrollToLatest = true;
  closeModal();
  toggleSettingsDock(false);
  phone.classList.add('home-mode');
  phone.classList.remove('rope-mode');
  renderHome();
}

function activeRopeMeta() {
  return homeState.ropes.find((rope) => rope.id === activeRopeId) || homeState.ropes[0];
}

function enterRope(id) {
  const rope = homeState.ropes.find((entry) => entry.id === id);
  if (!rope) return;
  activeRopeId = id;
  homeState.activeRopeId = id;
  saveHomeState();
  state = loadState();
  viewMode = 'rope';
  shouldScrollToLatest = true;
  selectedEventId = '';
  selectedTimelineId = '';
  lastStatsSignature = '';
  lastTimelineSignature = '';
  closeFloatingDocks();
  closeModal();
  phone.classList.remove('home-mode');
  phone.classList.add('rope-mode');
  updateCanvasSize();
}

function primeRopeTransitionView(id) {
  const rope = homeState.ropes.find((entry) => entry.id === id);
  if (!rope) return false;
  activeRopeId = id;
  homeState.activeRopeId = id;
  saveHomeState();
  state = loadState();
  viewMode = 'rope';
  shouldScrollToLatest = true;
  selectedEventId = '';
  selectedTimelineId = '';
  lastStatsSignature = '';
  lastTimelineSignature = '';
  updateCanvasSize();
  return true;
}

function completePrimedRopeTransition(id) {
  const rope = homeState.ropes.find((entry) => entry.id === id);
  if (!rope || activeRopeId !== id || viewMode !== 'rope') return false;
  closeFloatingDocks();
  closeModal();
  phone.classList.remove('home-mode');
  phone.classList.add('rope-mode');
  return true;
}

function applyHomePullFocus(button) {
  const sourceCord = button.querySelector('.rope-coil');
  if (!sourceCord) return false;
  const phoneRect = phone.getBoundingClientRect();
  const cordRect = sourceCord.getBoundingClientRect();
  const pageRect = homePage.getBoundingClientRect();
  const focusX = cordRect.left + cordRect.width / 2 - pageRect.left;
  const focusY = cordRect.top + cordRect.height / 2 - pageRect.top;
  const targetX = phoneRect.width / 2;
  const targetY = phoneRect.height * 0.48;
  const scale = Math.min(1.78, Math.max(1.48, phoneRect.height / Math.max(470, cordRect.height * 6.2)));
  const zoomX = targetX - focusX * scale;
  const zoomY = targetY - focusY * scale;
  homePage.style.setProperty('--pull-zoom-scale', String(scale));
  homePage.style.setProperty('--pull-zoom-x', `${Math.round(zoomX)}px`);
  homePage.style.setProperty('--pull-zoom-y', `${Math.round(zoomY)}px`);
  homePage.style.setProperty('--pull-focus-local-x', `${Math.round(focusX)}px`);
  homePage.style.setProperty('--pull-focus-local-y', `${Math.round(focusY)}px`);
  return true;
}

function clearHomePullTransition(button) {
  if (activeHomePull?.dropTimer) window.clearTimeout(activeHomePull.dropTimer);
  if (activeHomePull?.returnTimer) window.clearTimeout(activeHomePull.returnTimer);
  activeHomePullAnimation = false;
  phone.classList.remove('home-pull-centering', 'home-pull-ready', 'home-pull-dragging', 'home-pull-returning', 'home-pull-revealing', 'home-pull-drop');
  homePage.style.removeProperty('--pull-focus-x');
  homePage.style.removeProperty('--pull-focus-y');
  homePage.style.removeProperty('--pull-zoom-scale');
  homePage.style.removeProperty('--pull-zoom-x');
  homePage.style.removeProperty('--pull-zoom-y');
  homePage.style.removeProperty('--pull-drag-y');
  homePage.style.removeProperty('--pull-focus-local-x');
  homePage.style.removeProperty('--pull-focus-local-y');
  const focusButtons = button ? [button] : Array.from(document.querySelectorAll('.focus-rope-tile, .pulling-rope, .dragging-rope'));
  focusButtons.forEach((entry) => {
    entry.classList.remove('focus-rope-tile', 'dragging-rope', 'pulling-rope', 'pulling-rope-again');
    entry.style.removeProperty('--pull-cord-y');
  });
  activeHomePull = null;
}

function homePullThreshold() {
  const rect = phone.getBoundingClientRect();
  return Math.min(132, Math.max(92, rect.height * 0.16));
}

function setHomePullDrag(rawY) {
  if (!activeHomePull) return;
  const dragY = Math.max(0, Math.min(260, rawY));
  const cordY = Math.min(68, dragY * 0.34);
  activeHomePull.dragY = dragY;
  homePage.style.setProperty('--pull-drag-y', `${Math.round(dragY)}px`);
  activeHomePull.button.style.setProperty('--pull-cord-y', `${Math.round(cordY)}px`);
}

function shouldStartHomePullDrag(event) {
  if (!activeHomePullAnimation || !activeHomePull || activeHomePull.phase !== 'focused') return false;
  const button = event.target.closest('.focus-rope-tile');
  if (button) return button === activeHomePull.button;
  if (event.target.closest('.modal-layer, .floating-dock, .home-control-bar, input, textarea')) return false;
  const rect = phone.getBoundingClientRect();
  return event.clientX >= rect.left
    && event.clientX <= rect.right
    && event.clientY >= rect.top
    && event.clientY <= rect.bottom;
}

function startHomePullDrag(event) {
  if (!shouldStartHomePullDrag(event)) return;
  event.preventDefault();
  activeHomePull.phase = 'dragging';
  activeHomePull.pointerId = event.pointerId;
  activeHomePull.dragStartY = event.clientY;
  activeHomePull.threshold = homePullThreshold();
  activeHomePull.button.classList.add('dragging-rope');
  phone.classList.add('home-pull-dragging');
  setHomePullDrag(0);
  const button = activeHomePull.button;
  if (button.setPointerCapture) button.setPointerCapture(event.pointerId);
}

function updateHomePullDrag(event) {
  if (!activeHomePull || activeHomePull.phase !== 'dragging' || activeHomePull.pointerId !== event.pointerId) return;
  event.preventDefault();
  setHomePullDrag(event.clientY - activeHomePull.dragStartY);
}

function commitHomePullDrag() {
  if (!activeHomePull) return;
  const pull = activeHomePull;
  pull.phase = 'dropping';
  pull.button.classList.remove('dragging-rope');
  pull.button.classList.add('pulling-rope');
  phone.classList.remove('home-pull-dragging');
  if (pull.transitionPrepared) phone.classList.add('home-pull-revealing');
  phone.classList.add('home-pull-drop');
  pull.dropTimer = window.setTimeout(() => {
    if (activeHomePull !== pull) return;
    clearHomePullTransition(pull.button);
    if (!pull.transitionPrepared || !completePrimedRopeTransition(pull.ropeId)) {
      enterRope(pull.ropeId);
    }
  }, 1740);
}

function cancelHomePullDrag() {
  if (!activeHomePull) return;
  const pull = activeHomePull;
  pull.phase = 'returning';
  pull.button.classList.remove('dragging-rope');
  phone.classList.remove('home-pull-dragging');
  phone.classList.add('home-pull-returning');
  window.requestAnimationFrame(() => setHomePullDrag(0));
  pull.returnTimer = window.setTimeout(() => {
    if (activeHomePull !== pull) return;
    viewMode = 'home';
    clearHomePullTransition(pull.button);
    ignoreNextRopeClick = false;
    renderHome();
  }, 360);
}

function finishHomePullDrag(event) {
  if (!activeHomePull || activeHomePull.phase !== 'dragging' || activeHomePull.pointerId !== event.pointerId) return;
  event.preventDefault();
  ignoreNextRopeClick = true;
  try {
    if (activeHomePull.button.releasePointerCapture) activeHomePull.button.releasePointerCapture(event.pointerId);
  } catch (error) {
    // The browser may already release capture after a quick flick.
  }
  if (activeHomePull.dragY >= activeHomePull.threshold) commitHomePullDrag();
  else cancelHomePullDrag();
}

function playHomePullTransition(button, ropeId) {
  if (activeHomePullAnimation || !button || !ropeId) return;
  activeHomePullAnimation = true;
  closeFloatingDocks();
  closeModal();

  if (!applyHomePullFocus(button)) {
    activeHomePullAnimation = false;
    enterRope(ropeId);
    return;
  }
  button.classList.add('focus-rope-tile');
  const transitionPrepared = primeRopeTransitionView(ropeId);
  activeHomePull = {
    button,
    ropeId,
    transitionPrepared,
    phase: 'focused',
    dragStartY: 0,
    dragY: 0,
    threshold: homePullThreshold(),
    pointerId: 0,
    dropTimer: 0,
    returnTimer: 0,
  };
  phone.classList.add('home-pull-centering');
}

function goHome() {
  viewMode = 'home';
  clearHomePullTransition();
  closeFloatingDocks();
  closeModal();
  phone.classList.add('home-mode');
  phone.classList.remove('rope-mode');
  renderHome();
}

function openRopeNameModal() {
  ropeNameInput.value = '';
  closeFloatingDocks();
  modalLayer.classList.remove('hidden');
  ropeNameCard.classList.remove('hidden');
  noteCard.classList.add('hidden');
  detailCard.classList.add('hidden');
  notebookCard.classList.add('hidden');
  setTimeout(() => ropeNameInput.focus(), 20);
}

function addRope() {
  openRopeNameModal();
}

function addNamedRope() {
  const name = ropeNameInput.value.trim();
  if (!name) {
    ropeNameInput.focus();
    return;
  }

  const rope = {
    id: createId('rope'),
    name,
    createdAt: new Date().toISOString(),
  };
  homeState.ropes.push(rope);
  homeState.activeRopeId = rope.id;
  saveHomeState();
  saveRopeState(rope.id, emptyState());
  closeModal();
  renderHome();
}

function isRecordTimelineOpen() {
  return recordTimelineDock.classList.contains('open');
}

function isSettingsDockOpen() {
  return settingsDock.classList.contains('open');
}

function isGlobalSearchOpen() {
  return globalSearchDock.classList.contains('open');
}

function closeFloatingDocks() {
  let closed = false;
  if (isSettingsDockOpen()) {
    toggleSettingsDock(false);
    closed = true;
  }
  if (isRecordTimelineOpen()) {
    selectedTimelineId = '';
    lastTimelineSignature = '';
    toggleRecordTimeline(false);
    closed = true;
  }
  if (isGlobalSearchOpen()) {
    toggleGlobalSearch(false);
    closed = true;
  }
  return closed;
}

function nudgeStatsBar() {
  statsBar.classList.add('scrolling');
  window.clearTimeout(statsHideTimer);
  statsHideTimer = window.setTimeout(() => {
    statsBar.classList.remove('scrolling');
  }, 640);
}

function shortDate(value) {
  const date = new Date(toTime(value));
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}.${day}`;
}

function timelineItems() {
  return sortByTime(state.events.concat(computeRewardBadges(state)));
}

function updateRecordTimeline() {
  const items = timelineItems();
  const signature = items
    .map((item) => `${item.id}:${item.type}:${item.status || ''}:${item.createdAt}:${item.resolvedAt || ''}`)
    .join('|');

  if (signature === lastTimelineSignature) return;

  if (!items.length) {
    recordTimelineList.innerHTML = '<div class="record-timeline-empty"><span>还没有</span><span>记录</span></div>';
    lastTimelineSignature = signature;
    return;
  }

  recordTimelineList.innerHTML = items
    .map((item) => {
      const isBadge = item.type === 'badge';
      const isResolved = item.status === 'resolved';
      const kind = item.type === 'badge' ? '印章' : isResolved ? '印记' : '绳结';
      const cssClass = isBadge ? 'badge' : isResolved ? 'resolved' : 'open';
      const isSelected = item.id === selectedTimelineId;
      return `
        <button class="record-timeline-item ${cssClass}${isSelected ? ' selected' : ''}" type="button" data-event-id="${escapeHtml(item.id)}" role="listitem" aria-label="${escapeHtml(shortDate(item.createdAt))} ${kind}">
          <span>
            <span class="record-date">${escapeHtml(shortDate(item.createdAt))}</span>
            <span class="record-kind">${kind}</span>
          </span>
        </button>
      `;
    })
    .join('');
  lastTimelineSignature = signature;
  if (shouldTimelineListScrollLatest) {
    shouldTimelineListScrollLatest = false;
    requestAnimationFrame(() => {
      recordTimelineList.scrollTop = recordTimelineList.scrollHeight;
    });
  }
}

function focusTimelineEvent(id) {
  const isSelectedAgain = selectedTimelineId === id;
  selectedTimelineId = isSelectedAgain ? '' : id;
  lastTimelineSignature = '';
  if (!selectedTimelineId) {
    render();
    return;
  }
  layoutTimelineItems();
  const item = layoutItems.find((entry) => entry.id === id);
  if (item) {
    scrollY = Math.max(0, Math.min(maxScrollY, item.y - height * 0.46));
  }
  render();
  requestAnimationFrame(() => {
    const button = Array.from(recordTimelineList.querySelectorAll('[data-event-id]'))
      .find((entry) => entry.dataset.eventId === id);
    if (button) button.scrollIntoView({ block: 'nearest' });
  });
}

function latestOpenKnot() {
  return sortByTime(state.events.filter((event) => event.status !== 'resolved')).pop() || null;
}

function openWriteFromExchange() {
  pendingAnchorY = nextVisibleAnchorY();
  toggleExchangeTray(false);
  openNote();
}

function notebookItems() {
  return timelineItems().slice().reverse();
}

function notebookKind(item) {
  if (item.type === 'badge') return '印章';
  return item.status === 'resolved' ? '印记' : '绳结';
}

function notebookTitle(item) {
  if (item.type === 'badge') return item.title;
  if (item.status === 'resolved') return `已解开 · ${shortDate(item.resolvedAt || item.createdAt)}`;
  return `未解 · ${shortDate(item.createdAt)}`;
}

function notebookCopy(item) {
  if (item.type === 'badge') return item.subtitle || '绳子自动记下的一枚印章。';
  if (item.status === 'resolved' && item.resolutionLine) return `${item.content} / ${item.resolutionLine}`;
  return item.content;
}

function notebookMatches(item, query) {
  if (!query) return true;
  if (query && item.type === 'badge') return false;
  const haystack = [
    notebookKind(item),
    notebookTitle(item),
    notebookCopy(item),
    formatDate(item.createdAt),
    shortDate(item.createdAt),
    item.resolvedAt ? formatDate(item.resolvedAt) : '',
    item.resolvedAt ? shortDate(item.resolvedAt) : '',
  ].join(' ').toLowerCase();
  return haystack.includes(query);
}

function renderNotebookList() {
  const query = notebookQuery.trim().toLowerCase();
  const items = notebookItems().filter((item) => notebookMatches(item, query));
  notebookList.innerHTML = items.length
    ? items
      .map((item) => {
        const cssClass = item.type === 'badge' ? 'badge' : item.status === 'resolved' ? 'resolved' : 'open';
        return `
          <button class="notebook-entry ${cssClass}" type="button" data-notebook-id="${escapeHtml(item.id)}" role="listitem">
            <span class="notebook-entry-kind">${notebookKind(item)}</span>
            <span>
              <span class="notebook-entry-title">${escapeHtml(notebookTitle(item))}</span>
              <span class="notebook-entry-copy">${escapeHtml(notebookCopy(item))}</span>
            </span>
          </button>
        `;
      })
      .join('')
    : `<div class="notebook-empty">${query ? '没有找到这段绳记。' : '这本绳本还没有内容。'}</div>`;
}

function openNotebook() {
  toggleExchangeTray(false);
  notebookQuery = '';
  notebookSearch.value = '';
  renderNotebookList();

  modalLayer.classList.remove('hidden');
  ropeNameCard.classList.add('hidden');
  noteCard.classList.add('hidden');
  detailCard.classList.add('hidden');
  notebookCard.classList.remove('hidden');
}

function openNotebookItem(id) {
  const item = notebookItems().find((entry) => entry.id === id);
  if (!item) return;
  if (item.type === 'badge') {
    openBadgeDetail(item);
    return;
  }
  openDetail(item.id);
}

function openResolveFromExchange() {
  const event = latestOpenKnot();
  toggleExchangeTray(false);
  if (event) {
    openDetail(event.id);
    return;
  }

  selectedEventId = '';
  detailTitle.textContent = '没有未解的结';
  detailMeta.textContent = formatDate(Date.now());
  detailContent.textContent = '这页绳子现在是松的。等有没说完的话，再把它写成一个结。';
  resolutionBlock.innerHTML = '';
  resolutionBlock.classList.add('hidden');
  resolveForm.classList.add('hidden');
  resolveAction.classList.add('hidden');
  submitResolve.classList.add('hidden');
  modalLayer.classList.remove('hidden');
  ropeNameCard.classList.add('hidden');
  noteCard.classList.add('hidden');
  detailCard.classList.remove('hidden');
  notebookCard.classList.add('hidden');
}

function hitTest(x, y) {
  for (let index = layoutItems.length - 1; index >= 0; index -= 1) {
    const item = layoutItems[index];
    const screenY = item.y - scrollY;
    if (screenY < -90 || screenY > height + 90) continue;
    if (item.type === 'badge') {
      const seed = toTime(item.createdAt) / 100000;
      const badgeX = ropeX + itemSide(index + 1) * (48 + noise(seed + 5) * 10);
      const badgeY = screenY + 46;
      if (Math.abs(x - badgeX) <= 50 && Math.abs(y - badgeY) <= 46) return item;
      continue;
    }
    const note = item.status === 'resolved' ? resolvedNoteCenter(item, screenY, index) : null;
    const hitX = note ? note.x : ropeX;
    const hitY = note ? note.y : screenY;
    const radiusX = item.status === 'resolved' ? 48 : 68;
    const radiusY = item.status === 'resolved' ? 38 : 58;
    if (Math.abs(x - hitX) <= radiusX && Math.abs(y - hitY) <= radiusY) return item;
  }
  return null;
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function handleTap(point) {
  const hit = hitTest(point.x, point.y);
  if (isSettingsDockOpen()) {
    toggleSettingsDock(false);
    return;
  }

  if (isRecordTimelineOpen()) {
    if (hit) focusTimelineEvent(hit.id);
    else {
      selectedTimelineId = '';
      lastTimelineSignature = '';
      toggleRecordTimeline(false);
    }
    return;
  }

  if (hit) {
    if (hit.type === 'badge') {
      openBadgeDetail(hit);
      return;
    }
    openDetail(hit.id);
    return;
  }

  // Blank rope taps are intentionally inert; writing starts from the journal tray.
}

function openNote() {
  noteInput.value = '';
  toggleExchangeTray(false);
  modalLayer.classList.remove('hidden');
  ropeNameCard.classList.add('hidden');
  noteCard.classList.remove('hidden');
  detailCard.classList.add('hidden');
  notebookCard.classList.add('hidden');
  setTimeout(() => noteInput.focus(), 20);
}

function closeModal() {
  modalLayer.classList.add('hidden');
  ropeNameCard.classList.add('hidden');
  noteCard.classList.add('hidden');
  detailCard.classList.add('hidden');
  notebookCard.classList.add('hidden');
  resolveForm.classList.add('hidden');
  resolveAction.classList.add('hidden');
  submitResolve.classList.add('hidden');
  selectedEventId = '';
  resolveMode = '';
}

function saveNote() {
  const content = noteInput.value.trim();
  if (!content) {
    noteInput.focus();
    return;
  }

  state.events.push({
    id: createId('knot'),
    type: 'knot',
    status: 'open',
    content,
    anchorY: pendingAnchorY,
    createdBy: currentUserId,
    createdAt: new Date().toISOString(),
  });
  const created = state.events.at(-1);
  activeKnotAnimation = {
    id: created.id,
    startedAt: performance.now(),
    duration: 1280,
  };
  saveState();
  closeModal();
  shouldScrollToLatest = true;
  render();
  requestRenderLoop();
}

function eventById(id) {
  return state.events.find((event) => event.id === id);
}

function openDetail(id) {
  const event = eventById(id);
  if (!event) return;
  selectedEventId = id;
  resolveMode = '';

  const isResolved = event.status === 'resolved';
  const meta = isResolved && event.resolvedAt
    ? `结下 ${formatDate(event.createdAt)} · 解开 ${formatDate(event.resolvedAt)}`
    : `结下 ${formatDate(event.createdAt)}`;

  detailTitle.textContent = isResolved ? '一个淡淡的印记' : '一个还没解开的结';
  detailMeta.textContent = meta;
  detailContent.textContent = event.content;
  resolutionBlock.innerHTML = '';
  resolutionBlock.classList.add('hidden');
  resolveForm.classList.add('hidden');
  submitResolve.classList.add('hidden');
  resolveAction.classList.add('hidden');

  if (isResolved && event.resolutionLine) {
    resolutionBlock.classList.remove('hidden');
    resolutionBlock.innerHTML = `<div class="line-note">${escapeHtml(event.resolutionLine)}</div>`;
  }

  if (!isResolved) {
    resolveAction.textContent = '解开';
    resolveAction.dataset.mode = 'resolve';
    resolveAction.classList.remove('hidden');
  }

  modalLayer.classList.remove('hidden');
  ropeNameCard.classList.add('hidden');
  noteCard.classList.add('hidden');
  detailCard.classList.remove('hidden');
  notebookCard.classList.add('hidden');
}

function openBadgeDetail(badge) {
  selectedEventId = '';
  resolveMode = '';
  detailTitle.textContent = badge.title;
  detailMeta.textContent = `${formatDate(badge.createdAt)} 夹上 · 印章`;
  detailContent.textContent = badge.subtitle || '这是绳子自动记住的一枚印章。';
  resolutionBlock.innerHTML = '<div class="line-note">到这个日子，绳子替你们盖下一枚印章。</div>';
  resolutionBlock.classList.remove('hidden');
  resolveForm.classList.add('hidden');
  submitResolve.classList.add('hidden');
  resolveAction.classList.add('hidden');
  modalLayer.classList.remove('hidden');
  ropeNameCard.classList.add('hidden');
  noteCard.classList.add('hidden');
  detailCard.classList.remove('hidden');
  notebookCard.classList.add('hidden');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function openResolve(mode) {
  resolveMode = mode;
  resolveInput.value = '';
  resolveForm.classList.remove('hidden');
  resolveAction.classList.add('hidden');
  submitResolve.classList.remove('hidden');
  setTimeout(() => resolveInput.focus(), 20);
}

function writeResolve() {
  const event = eventById(selectedEventId);
  if (!event || !resolveMode) return;
  const line = resolveInput.value.trim();
  const now = new Date().toISOString();

  event.status = 'resolved';
  event.resolvedAt = now;
  event.resolvedBy = currentUserId;
  event.resolutionLine = line;

  saveState();
  closeModal();
  render();
}

canvas.addEventListener('pointerdown', (event) => {
  canvas.setPointerCapture(event.pointerId);
  pointerStart = canvasPoint(event);
  moved = false;
});

canvas.addEventListener('pointermove', (event) => {
  if (!pointerStart) return;
  const point = canvasPoint(event);
  const deltaY = point.y - pointerStart.y;
  if (Math.abs(deltaY) > 3) moved = true;
  pointerStart = point;
  scrollY = Math.max(0, Math.min(maxScrollY, scrollY - deltaY));
  nudgeStatsBar();
  render();
});

canvas.addEventListener('pointerup', (event) => {
  const point = canvasPoint(event);
  if (!moved) handleTap(point);
  pointerStart = null;
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  scrollY = Math.max(0, Math.min(maxScrollY, scrollY + event.deltaY));
  nudgeStatsBar();
  render();
}, { passive: false });

document.querySelector('#cancelNote').addEventListener('click', closeModal);
document.querySelector('#saveNote').addEventListener('click', saveNote);
cancelRopeName.addEventListener('click', closeModal);
saveRopeName.addEventListener('click', addNamedRope);
ropeNameInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') addNamedRope();
});
document.querySelector('#closeDetail').addEventListener('click', closeModal);
document.querySelector('#closeNotebook').addEventListener('click', closeModal);
ropeShelf.addEventListener('click', (event) => {
  if (ignoreNextRopeClick) {
    ignoreNextRopeClick = false;
    return;
  }
  const button = event.target.closest('[data-rope-id]');
  if (!button) return;
  playHomePullTransition(button, button.dataset.ropeId);
});
ropeShelf.addEventListener('pointerdown', startHomePullDrag);
ropeShelf.addEventListener('pointermove', updateHomePullDrag);
ropeShelf.addEventListener('pointerup', finishHomePullDrag);
ropeShelf.addEventListener('pointercancel', finishHomePullDrag);
phone.addEventListener('pointerdown', startHomePullDrag);
phone.addEventListener('pointermove', updateHomePullDrag);
phone.addEventListener('pointerup', finishHomePullDrag);
phone.addEventListener('pointercancel', finishHomePullDrag);
addRopeAction.addEventListener('click', addRope);
backHomeAction.addEventListener('click', goHome);
settingsToggle.addEventListener('click', () => toggleSettingsDock());
settingsClose.addEventListener('click', () => toggleSettingsDock(false));
resetPreviewAction.addEventListener('click', askResetConfirmation);
cancelResetAction.addEventListener('click', () => resetConfirmPanel.classList.add('hidden'));
confirmResetAction.addEventListener('click', resetPreviewState);
recordTimelineList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-event-id]');
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  focusTimelineEvent(button.dataset.eventId);
});
timelineToggle.addEventListener('click', () => toggleRecordTimeline());
timelineClose.addEventListener('click', () => toggleRecordTimeline(false));
homeSearchToggle.addEventListener('click', () => toggleGlobalSearch());
globalSearchClose.addEventListener('click', () => toggleGlobalSearch(false));
globalSearchInput.addEventListener('input', renderGlobalSearchList);
globalSearchList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-rope-id][data-event-id]');
  if (!button) return;
  enterRope(button.dataset.ropeId);
  openDetail(button.dataset.eventId);
});
exchangeButton.addEventListener('click', () => toggleExchangeTray());
writeKnotAction.addEventListener('click', openWriteFromExchange);
resolveKnotAction.addEventListener('click', openResolveFromExchange);
notebookAction.addEventListener('click', openNotebook);
notebookList.addEventListener('click', (event) => {
  const button = event.target.closest('[data-notebook-id]');
  if (!button) return;
  openNotebookItem(button.dataset.notebookId);
});
notebookSearch.addEventListener('input', (event) => {
  notebookQuery = event.target.value;
  renderNotebookList();
});
resolveAction.addEventListener('click', () => openResolve(resolveAction.dataset.mode));
submitResolve.addEventListener('click', writeResolve);
modalLayer.addEventListener('click', (event) => {
  if (event.target === modalLayer) closeModal();
});
document.addEventListener('pointerdown', (event) => {
  if (!isSettingsDockOpen() && !isRecordTimelineOpen() && !isGlobalSearchOpen()) return;
  const target = event.target;
  const insideSettings = settingsDock.contains(target) || settingsToggle.contains(target);
  const insideTimeline = recordTimelineDock.contains(target) || timelineToggle.contains(target);
  const insideGlobalSearch = globalSearchDock.contains(target) || homeSearchToggle.contains(target);
  if (insideSettings || insideTimeline || insideGlobalSearch || target === canvas) return;
  closeFloatingDocks();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (closeFloatingDocks()) return;
    toggleExchangeTray(false);
  }
});
window.addEventListener('resize', updateCanvasSize);
window.addEventListener('load', updateCanvasSize);

phone.classList.add('home-mode');
updateCanvasSize();
requestAnimationFrame(updateCanvasSize);
