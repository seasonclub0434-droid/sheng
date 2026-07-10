const {
  computeMilestones,
  daysBetween,
  getDustStage,
  layoutTimelineItems,
  sortByTime,
  toTime,
} = require('../../utils/timeline');
const store = require('../../services/rope-store');

const ROPE_COLOR = '#ddc8a6';
const ROPE_SHADOW = 'rgba(86, 63, 37, 0.22)';
const ROPE_LIGHT = 'rgba(248, 235, 205, 0.58)';
const ROPE_EDGE = '#b89a72';
const INK = '#342d27';
const PAPER = '#caa36f';
const SINGLE_ROPE_PALETTE = {
  shadow: ROPE_SHADOW,
  edge: ROPE_EDGE,
  core: ROPE_COLOR,
  light: ROPE_LIGHT,
};
const COUPLE_WHITE_ROPE = {
  shadow: 'rgba(82, 61, 39, 0.2)',
  edge: '#b99d74',
  core: '#e4d2b2',
  light: 'rgba(255, 244, 218, 0.72)',
};
const COUPLE_RED_ROPE = {
  shadow: 'rgba(75, 31, 24, 0.24)',
  edge: '#8b4938',
  core: '#b96850',
  light: 'rgba(236, 174, 139, 0.5)',
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

function pointFromTouch(touch) {
  return {
    x: touch.x != null ? touch.x : touch.clientX,
    y: touch.y != null ? touch.y : touch.clientY,
  };
}

function noise(seed) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

function hashText(value) {
  let hash = 0;
  const seed = String(value);
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function formatDate(value) {
  const time = toTime(value);
  if (!time) return '';
  const date = new Date(time);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}.${month}.${day}`;
}

function shortDate(value) {
  const time = toTime(value);
  if (!time) return '';
  const date = new Date(time);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}.${day}`;
}

Page({
  data: {
    canvasWidth: 375,
    canvasHeight: 667,
    homeShelfHeight: 612,
    safeTop: 0,
    menuButtonLeft: 0,
    menuButtonBottom: 0,
    loading: true,
    saving: false,
    viewMode: 'rope',
    homeRopes: [],
    homeRows: [],
    statsItems: [],
    settingsOpen: false,
    resetConfirmOpen: false,
    timelineOpen: false,
    exchangeOpen: false,
    globalSearchOpen: false,
    globalSearchText: '',
    globalSearchResults: [],
    recordTimelineItems: [],
    selectedTimelineId: '',
    addRopeMode: '',
    addRopeName: '',
    canCreateRope: false,
    ropeMode: 'single',
    statusText: '一根共同记下来的绳子',
    events: [],
    showNote: false,
    noteText: '',
    noteStrand: 'shared',
    showNotebook: false,
    notebookSearchText: '',
    notebookItems: [],
    showDetail: false,
    selectedEvent: null,
    selectedState: {},
    resolveMode: '',
    resolveText: '',
  },

  session: null,
  canvas: null,
  ctx: null,
  dpr: 1,
  ropeX: 187,
  scrollY: 0,
  maxScrollY: 0,
  contentHeight: 0,
  layoutItems: [],
  uiHits: [],
  touchStart: null,
  moved: false,
  renderPending: false,
  renderFallbackTimer: null,
  pendingAnchorY: 180,
  shouldScrollToLatest: true,

  onLoad(options) {
    const info = wx.getSystemInfoSync();
    const menuButton = typeof wx.getMenuButtonBoundingClientRect === 'function' ? wx.getMenuButtonBoundingClientRect() : null;
    const safeTop = info.safeArea ? Math.max(info.safeArea.top - 6, 0) : 0;
    const homeShelfHeight = Math.round((info.windowWidth * (60 + 4 * 270 + 84)) / 750);
    this.setData({
      canvasWidth: info.windowWidth,
      canvasHeight: info.windowHeight,
      homeShelfHeight,
      safeTop,
      menuButtonLeft: menuButton && Number.isFinite(menuButton.left) ? menuButton.left : info.windowWidth,
      menuButtonBottom: menuButton && Number.isFinite(menuButton.bottom) ? menuButton.bottom : 0,
    });
    this.ropeX = Math.round(info.windowWidth / 2);
    this.bootstrap(options || {});
  },

  onReady() {
    this.initCanvas();
  },

  onPullDownRefresh() {
    this.reload().finally(() => wx.stopPullDownRefresh());
  },

  onShareAppMessage() {
    const ropeId = this.session && this.session.ropeId ? this.session.ropeId : '';
    return {
      title: '和我一起看这根绳子',
      path: `/pages/rope/rope?ropeId=${ropeId}`,
    };
  },

  noop() {},

  setDataAsync(data) {
    return new Promise((resolve) => this.setData(data, resolve));
  },

  resumeCanvas() {
    this.canvas = null;
    this.ctx = null;
    this.renderPending = false;
    if (this.renderFallbackTimer) {
      clearTimeout(this.renderFallbackTimer);
      this.renderFallbackTimer = null;
    }
    setTimeout(() => this.initCanvas(), 0);
  },

  buildHomeRows(ropes) {
    const rows = Math.max(4, Math.ceil((ropes || []).length / 2));
    return Array.from({ length: rows }, (_, rowIndex) => {
      const slots = [0, 1].map((slotIndex) => {
        const tileIndex = rowIndex * 2 + slotIndex;
        const rope = (ropes || [])[tileIndex];
        if (!rope) return { slotKey: `empty-${rowIndex}-${slotIndex}`, tileIndex };
        return {
          slotKey: rope.ropeId,
          ropeId: rope.ropeId,
          tileIndex: rowIndex * 2 + slotIndex,
          name: rope.name,
          mode: rope.mode,
          openCount: rope.openCount || 0,
          resolvedCount: rope.resolvedCount || 0,
          noteTone: tileIndex % 4,
        };
      });
      return { rowIndex, rowCenter: (rows - 1) / 2, slots };
    });
  },

  rpx(value) {
    return ((this.data.canvasWidth || 375) * value) / 750;
  },

  homeShelfMetrics(rowCount) {
    const rows = Math.max(4, rowCount || 4);
    return {
      homeShelfHeight: Math.round(this.rpx(60 + rows * 270 + 84)),
    };
  },

  buildStatsItems(events, relationshipStartedAt) {
    const openCount = events.filter((event) => event.type === 'knot' && event.status !== 'resolved').length;
    const resolvedCount = events.filter((event) => event.type === 'knot' && event.status === 'resolved').length;
    const days = daysBetween(relationshipStartedAt, Date.now());
    return [
      { value: `${days}天`, label: '相伴' },
      { value: openCount, label: '未解' },
      { value: resolvedCount, label: '已解' },
    ];
  },

  buildRecordTimelineItems(events, relationshipStartedAt) {
    const ornaments = computeMilestones({ events, relationshipStartedAt, now: Date.now() });
    return sortByTime(events.concat(ornaments)).map((item) => ({
      id: item.id || item._id,
      date: shortDate(item.createdAt),
      kind: this.timelineKindForItem(item),
      status: item.type === 'ornament' ? 'badge' : item.status === 'resolved' ? 'resolved' : 'open',
      y: item.y || item.anchorY || 0,
    }));
  },

  timelineKindForItem(item) {
    if (item.type === 'ornament') return '印章';
    const kind = item.status === 'resolved' ? '印记' : '绳结';
    return this.isCoupleMode() ? `${this.strandLabel(item.strand)} · ${kind}` : kind;
  },

  buildNotebookItems(events, keyword) {
    const needle = (keyword || '').trim().toLowerCase();
    return events
      .filter((event) => event.type === 'knot' && (event.status === 'resolved' || event.content))
      .filter((event) => {
        if (!needle) return true;
        return [event.content, event.resolutionLine, formatDate(event.createdAt), event.resolvedAt ? formatDate(event.resolvedAt) : '']
          .join(' ')
          .toLowerCase()
          .includes(needle);
      })
      .map((event) => ({
        id: event.id || event._id,
        title: this.isCoupleMode()
          ? `${this.strandLabel(event.strand)}${event.status === 'resolved' ? '已解开的结' : '记下的结'}`
          : event.status === 'resolved' ? '已解开的结' : '记下的结',
        meta: event.status === 'resolved' && event.resolvedAt
          ? `结下 ${formatDate(event.createdAt)} · 解开 ${formatDate(event.resolvedAt)}`
          : `结下 ${formatDate(event.createdAt)}`,
        content: event.content,
      }));
  },

  buildGlobalSearchResults(keyword, ropes) {
    const needle = (keyword || '').trim().toLowerCase();
    if (!needle) return [];
    return (ropes || [])
      .filter((rope) => [rope.name, rope.mode].join(' ').toLowerCase().includes(needle))
      .map((rope) => ({
        id: `rope-${rope.ropeId}`,
        ropeId: rope.ropeId,
        ropeName: rope.name,
        content: `${rope.openCount || 0}结 · ${rope.resolvedCount || 0}解`,
      }));
  },

  enterLoginGate() {
    this.setData({ viewMode: 'home' });
  },

  goHome() {
    this.session = null;
    this.canvas = null;
    this.ctx = null;
    this.scrollY = 0;
    this.setData({
      showNote: false,
      showDetail: false,
      showNotebook: false,
      exchangeOpen: false,
      timelineOpen: false,
    });
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.redirectTo({ url: '/pages/index/index' });
  },

  openAddRopePage() {
    this.canvas = null;
    this.ctx = null;
    this.setData({
      viewMode: 'add',
      settingsOpen: false,
      globalSearchOpen: false,
      addRopeMode: '',
      addRopeName: '',
      canCreateRope: false,
    });
  },

  selectAddRopeMode(event) {
    const mode = event.currentTarget.dataset.ropeMode;
    const name = this.data.addRopeName.trim();
    this.setData({
      addRopeMode: mode,
      canCreateRope: Boolean(mode && name),
    });
  },

  onAddRopeNameInput(event) {
    const name = event.detail.value;
    this.setData({
      addRopeName: name,
      canCreateRope: Boolean(this.data.addRopeMode && name.trim()),
    });
  },

  async createNamedRope() {
    if (this.data.saving) return;
    const name = this.data.addRopeName.trim();
    const mode = this.data.addRopeMode;

    if (!mode) {
      wx.showToast({ title: '先选择一种模式', icon: 'none' });
      return;
    }
    if (!name) {
      wx.showToast({ title: '先给绳子起名', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    try {
      await store.createRope(this.homeSession || {}, {
        name,
        mode,
      });
      this.setData({ saving: false });
      await this.reloadHome('home');
      wx.showToast({ title: '已放进柜子', icon: 'none' });
    } catch (error) {
      console.error(error);
      this.setData({ saving: false });
      wx.showToast({ title: '这根绳没放上去', icon: 'none' });
    }
  },

  async enterRopeFromShelf(event) {
    const ropeId = event.currentTarget.dataset.ropeId;
    if (!ropeId) return;
    await this.enterRope(ropeId);
  },

  async enterRope(ropeId) {
    this.canvas = null;
    this.ctx = null;
    await this.setDataAsync({ loading: true, viewMode: 'rope' });
    this.initCanvas();
    this.session = await store.setCurrentRope(ropeId);
    await this.reload();
    this.initCanvas();
  },

  toggleSettingsDock() {
    this.setData({
      settingsOpen: !this.data.settingsOpen,
      globalSearchOpen: false,
      resetConfirmOpen: false,
    });
  },

  closeSettingsDock() {
    this.setData({ settingsOpen: false, resetConfirmOpen: false });
  },

  askResetConfirmation() {
    this.setData({ resetConfirmOpen: true });
  },

  cancelResetConfirmation() {
    this.setData({ resetConfirmOpen: false });
  },

  async confirmResetPreview() {
    await store.resetAll();
    this.session = null;
    this.setData({
      resetConfirmOpen: false,
      settingsOpen: false,
      globalSearchOpen: false,
      viewMode: 'home',
      events: [],
      showNote: false,
      showDetail: false,
      showNotebook: false,
    });
    await this.reloadHome('home');
    this.render();
  },

  toggleGlobalSearchDock() {
    this.setData({
      globalSearchOpen: !this.data.globalSearchOpen,
      settingsOpen: false,
    });
  },

  closeGlobalSearchDock() {
    this.setData({ globalSearchOpen: false, globalSearchText: '', globalSearchResults: [] });
  },

  onGlobalSearchInput(event) {
    const value = event.detail.value;
    this.setData({
      globalSearchText: value,
      globalSearchResults: this.buildGlobalSearchResults(value, this.data.homeRopes),
    });
  },

  toggleTimelineDock() {
    this.setData({
      timelineOpen: !this.data.timelineOpen,
      exchangeOpen: false,
    }, () => this.render());
  },

  closeTimelineDock() {
    this.setData({ timelineOpen: false }, () => this.render());
  },

  selectTimelineItem(event) {
    const eventId = event.currentTarget.dataset.eventId;
    this.selectTimelineId(eventId);
  },

  selectTimelineId(eventId) {
    const selectedTimelineId = this.data.selectedTimelineId === eventId ? '' : eventId;
    if (selectedTimelineId) {
      const target = this.layoutItems.find((item) => (item.id || item._id) === selectedTimelineId);
      if (target) {
        this.scrollY = Math.max(
          0,
          Math.min(this.maxScrollY, target.y - Math.round(this.data.canvasHeight * 0.46))
        );
        this.shouldScrollToLatest = false;
      }
    }
    this.setData({ selectedTimelineId }, () => this.render());
  },

  toggleExchangeDock() {
    this.setData({
      exchangeOpen: !this.data.exchangeOpen,
      timelineOpen: false,
    }, () => this.render());
  },

  openWriteKnot() {
    if (!this.session || !this.session.ropeId) return;
    this.pendingAnchorY = this.scrollY + Math.round(this.data.canvasHeight * 0.76);
    this.setData({
      showNote: true,
      noteText: '',
      noteStrand: this.isCoupleMode() ? 'white' : 'shared',
      exchangeOpen: false,
    });
  },

  openLatestResolve() {
    const latest = this.data.events
      .slice()
      .reverse()
      .find((event) => event.type === 'knot' && event.status !== 'resolved');
    if (!latest) {
      wx.showToast({ title: '还没有未解的结', icon: 'none' });
      return;
    }
    this.setData({ exchangeOpen: false });
    this.openDetail(latest);
  },

  openNotebook() {
    this.setData({
      showNotebook: true,
      exchangeOpen: false,
      notebookSearchText: '',
      notebookItems: this.buildNotebookItems(this.data.events, ''),
    });
  },

  closeNotebook() {
    this.setData({ showNotebook: false, notebookSearchText: '', notebookItems: [] }, () => {
      this.resumeCanvas();
    });
  },

  onNotebookSearchInput(event) {
    const value = event.detail.value;
    this.setData({
      notebookSearchText: value,
      notebookItems: this.buildNotebookItems(this.data.events, value),
    });
  },

  async bootstrap(options) {
    try {
      this.session = options.ropeId
        ? await store.setCurrentRope(options.ropeId)
        : await store.initSession();
      if (!this.session || !this.session.ropeId) {
        wx.redirectTo({ url: '/pages/index/index' });
        return;
      }
      await this.setDataAsync({ loading: true, viewMode: 'rope' });
      await this.reload();
      this.initCanvas();
    } catch (error) {
      console.error(error);
      wx.showToast({ title: '手帐暂时打不开', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async reloadHome(nextViewMode) {
    const home = await store.loadHomeState();
    const rows = this.buildHomeRows(home.ropes);
    const shelfMetrics = this.homeShelfMetrics(rows.length);
    this.homeSession = home;
    await this.setDataAsync({
      loading: false,
      viewMode: nextViewMode || this.data.viewMode || 'login',
      homeRopes: home.ropes,
      homeRows: rows,
      globalSearchResults: this.buildGlobalSearchResults(this.data.globalSearchText, home.ropes),
      ...shelfMetrics,
    });
  },

  async reload() {
    if (!this.session) return;
    const state = await store.loadState(this.session);
    const relationshipStartedAt = state.rope.relationshipStartedAt;
    this.session.rope = state.rope;
    this.setData({
      loading: false,
      ropeMode: state.rope.mode || 'single',
      events: state.events,
      statusText: this.buildStatusText(state.events, relationshipStartedAt),
      statsItems: this.buildStatsItems(state.events, relationshipStartedAt),
      recordTimelineItems: this.buildRecordTimelineItems(state.events, relationshipStartedAt),
      notebookItems: this.buildNotebookItems(state.events, ''),
    });
    this.shouldScrollToLatest = true;
    this.render();
  },

  initCanvas(retryCount) {
    const retries = retryCount || 0;
    wx.createSelectorQuery()
      .in(this)
      .select('#ropeCanvas')
      .fields({ node: true, size: true })
      .exec((result) => {
        const canvasInfo = result && result[0];
        if (!canvasInfo || !canvasInfo.node) {
          if (this.data.viewMode === 'rope' && retries < 5) {
            setTimeout(() => this.initCanvas(retries + 1), 60);
          }
          return;
        }

        this.canvas = canvasInfo.node;
        this.ctx = this.canvas.getContext('2d');
        this.dpr = wx.getSystemInfoSync().pixelRatio || 1;
        this.canvas.width = Math.round(canvasInfo.width * this.dpr);
        this.canvas.height = Math.round(canvasInfo.height * this.dpr);
        this.ctx.scale(this.dpr, this.dpr);
        this.render();
      });
  },

  buildStatusText(events, relationshipStartedAt) {
    const openCount = events.filter((event) => event.type === 'knot' && event.status !== 'resolved').length;
    const resolvedCount = events.filter((event) => event.type === 'knot' && event.status === 'resolved').length;
    const days = daysBetween(relationshipStartedAt, Date.now());
    const isCouple = this.isCoupleMode();

    if (!events.length) return isCouple ? '两根绳还在等第一句话' : '一根共同记下来的绳子';
    if (openCount) return isCouple
      ? `${openCount}个双人结还在，${resolvedCount}个已经松开`
      : `${openCount}个结还在，${resolvedCount}个已经解开`;
    if (days >= 30) return isCouple ? `两根绳安静相伴${days}天` : `安静相伴${days}天`;
    return isCouple ? `${resolvedCount}个双人结已经变成印记` : `${resolvedCount}个结已经变成印记`;
  },

  onCanvasTouchStart(event) {
    if (this.data.viewMode !== 'rope') return;
    if (!event.touches || !event.touches.length) return;
    this.touchStart = pointFromTouch(event.touches[0]);
    this.moved = false;
  },

  onCanvasTouchMove(event) {
    if (this.data.viewMode !== 'rope') return;
    if (!this.touchStart || !event.touches || !event.touches.length) return;
    const point = pointFromTouch(event.touches[0]);
    const deltaY = point.y - this.touchStart.y;
    if (Math.abs(deltaY) > 3) this.moved = true;
    this.touchStart = point;
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY - deltaY));
    this.requestRender();
  },

  onCanvasTouchEnd(event) {
    if (this.data.viewMode !== 'rope') return;
    const changed = event.changedTouches && event.changedTouches[0];
    if (!changed || !this.touchStart) return;
    const point = pointFromTouch(changed);
    if (!this.moved) this.handleCanvasTap(point);
    this.touchStart = null;
  },

  handleCanvasTap(point) {
    const uiHit = this.findUiHit(point.x, point.y);
    if (uiHit) {
      this.handleCanvasUiHit(uiHit);
      return;
    }

    if (this.closeCanvasDocks()) return;

    const hit = this.findHitItem(point.x, point.y);
    if (hit) {
      if (hit.type === 'ornament') {
        this.openOrnament(hit);
      } else {
        this.openDetail(hit.event || hit);
      }
      return;
    }

    // Blank rope taps are intentionally inert; writing starts from the journal action.
  },

  closeCanvasDocks() {
    const patch = {};
    if (this.data.timelineOpen) patch.timelineOpen = false;
    if (this.data.exchangeOpen) patch.exchangeOpen = false;
    if (!Object.keys(patch).length) return false;
    this.setData(patch, () => this.render());
    return true;
  },

  findUiHit(x, y) {
    for (let index = this.uiHits.length - 1; index >= 0; index -= 1) {
      const hit = this.uiHits[index];
      if (
        x >= hit.x &&
        x <= hit.x + hit.width &&
        y >= hit.y &&
        y <= hit.y + hit.height
      ) {
        return hit;
      }
    }
    return null;
  },

  handleCanvasUiHit(hit) {
    if (hit.id === 'back') {
      this.goHome();
    } else if (hit.id === 'timeline') {
      this.toggleTimelineDock();
    } else if (hit.id === 'timeline-close') {
      this.closeTimelineDock();
    } else if (hit.id === 'timeline-item') {
      this.selectTimelineId(hit.eventId);
    } else if (hit.id === 'exchange') {
      this.toggleExchangeDock();
    } else if (hit.id === 'write') {
      this.openWriteKnot();
    } else if (hit.id === 'resolve') {
      this.openLatestResolve();
    } else if (hit.id === 'notebook') {
      this.openNotebook();
    }
  },

  findHitItem(x, y) {
    for (let index = this.layoutItems.length - 1; index >= 0; index -= 1) {
      const item = this.layoutItems[index];
      const screenY = item.y - this.scrollY;
      if (screenY < -80 || screenY > this.data.canvasHeight + 80) continue;
      const ornamentX = this.ornamentCenterX(index, screenY);
      const note = item.status === 'resolved' ? this.resolvedNoteCenter(item, screenY, index) : null;
      const hitX = item.type === 'ornament' ? ornamentX : note ? note.x : this.knotCenterX(item, screenY);
      const hitY = note ? note.y : screenY;
      const radiusX = item.type === 'ornament' ? 58 : item.status === 'resolved' ? 48 : 68;
      const radiusY = item.type === 'ornament' ? 42 : item.status === 'resolved' ? 38 : 58;
      if (Math.abs(x - hitX) <= radiusX && Math.abs(y - hitY) <= radiusY) return item;
    }
    return null;
  },

  itemSide(index) {
    return index % 2 === 0 ? -1 : 1;
  },

  normalizeStrand(strand) {
    return ['white', 'red', 'shared'].includes(strand) ? strand : 'shared';
  },

  strandSide(strand) {
    const normalized = this.normalizeStrand(strand);
    if (normalized === 'white') return -1;
    if (normalized === 'red') return 1;
    return 0;
  },

  strandLabel(strand) {
    const normalized = this.normalizeStrand(strand);
    if (normalized === 'white') return '白绳';
    if (normalized === 'red') return '红绳';
    return '同结';
  },

  eventStrand(item) {
    return this.normalizeStrand(item && item.strand ? item.strand : 'shared');
  },

  isCoupleMode() {
    return (this.data.ropeMode || (this.session && this.session.rope && this.session.rope.mode) || 'single') === 'couple';
  },

  ornamentAnchorX(index, y) {
    const side = this.itemSide(index);
    return this.isCoupleMode() ? this.coupleRopePoint(y, side, 0) : this.ropeX;
  },

  ornamentCenterX(index, y) {
    const side = this.itemSide(index);
    return this.isCoupleMode()
      ? this.coupleRopePoint(y, side, 0) + side * 54
      : this.ropeX + side * 68;
  },

  knotCenterX(item, y) {
    if (!this.isCoupleMode()) return this.ropeX;
    const side = this.strandSide(item && item.strand);
    return side ? this.coupleRopePoint(y, side, 0) : this.ropeX;
  },

  badgeBaseVariant(item, badgeOrdinal) {
    const seed = hashText(`${item.id}:${item.createdAt}:${item.title}`);
    const toneIndex = (seed + badgeOrdinal * 5) % BADGE_TONES.length;
    const motifIndex = (seed + badgeOrdinal * 7) % BADGE_MOTIFS.length;
    return {
      tone: BADGE_TONES[toneIndex],
      motif: BADGE_MOTIFS[motifIndex],
      toneIndex,
      motifIndex,
    };
  },

  pickUnusedBadgeOption(options, used, preferredIndex) {
    for (let offset = 0; offset < options.length; offset += 1) {
      const index = (preferredIndex + offset) % options.length;
      const value = options[index];
      if (!used.has(value)) return { value, index };
    }
    const index = preferredIndex % options.length;
    return { value: options[index], index };
  },

  buildVisibleOrnamentVisuals(items, height) {
    const visuals = {};
    const visibleOrnaments = [];
    let ornamentOrdinal = 0;

    items.forEach((item, index) => {
      if (item.type !== 'ornament') return;
      const visual = this.badgeBaseVariant(item, ornamentOrdinal);
      visuals[item.id] = visual;
      const screenY = item.y - this.scrollY;
      if (screenY > -110 && screenY < height + 110) {
        visibleOrnaments.push({ item, index, ornamentOrdinal, screenY });
      }
      ornamentOrdinal += 1;
    });

    const usedTones = new Set();
    const usedMotifs = new Set();
    visibleOrnaments
      .sort((a, b) => a.screenY - b.screenY || a.index - b.index)
      .forEach(({ item, ornamentOrdinal }, visibleIndex) => {
        const visual = visuals[item.id];
        if (usedTones.has(visual.tone)) {
          const picked = this.pickUnusedBadgeOption(BADGE_TONES, usedTones, visual.toneIndex + visibleIndex + ornamentOrdinal + 1);
          visual.tone = picked.value;
          visual.toneIndex = picked.index;
        }
        if (usedMotifs.has(visual.motif)) {
          const picked = this.pickUnusedBadgeOption(BADGE_MOTIFS, usedMotifs, visual.motifIndex + visibleIndex + ornamentOrdinal + 1);
          visual.motif = picked.value;
          visual.motifIndex = picked.index;
        }
        usedTones.add(visual.tone);
        usedMotifs.add(visual.motif);
      });

    return visuals;
  },

  addUiHit(id, x, y, width, height, extra) {
    this.uiHits.push({
      id,
      x,
      y,
      width,
      height,
      ...(extra || {}),
    });
  },

  roundRectPath(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  },

  fillPaperRect(ctx, x, y, width, height, radius, seed) {
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    gradient.addColorStop(0, 'rgba(255, 249, 225, 0.86)');
    gradient.addColorStop(1, 'rgba(219, 190, 132, 0.72)');
    ctx.save();
    ctx.shadowColor = 'rgba(64, 43, 22, 0.14)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 7;
    this.roundRectPath(ctx, x, y, width, height, radius);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(92, 67, 39, 0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.globalAlpha = 0.18;
    for (let i = 0; i < 9; i += 1) {
      const lineY = y + 8 + noise(seed + i * 5) * Math.max(8, height - 16);
      this.drawHandLine(ctx, x + 8, lineY, x + width - 8, lineY + (noise(seed + i * 9) - 0.5) * 3, 'rgba(91, 62, 33, 0.18)', 0.45, seed + i * 13);
    }
    ctx.restore();
  },

  drawTapeCanvas(ctx, x, y, width, height, rotation, seed) {
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(rotation || 0);

    const tx = -width / 2;
    const ty = -height / 2;
    const gradient = ctx.createLinearGradient(tx, ty, tx + width, ty + height);
    gradient.addColorStop(0, 'rgba(109, 75, 42, 0.12)');
    gradient.addColorStop(0.45, 'rgba(255, 238, 194, 0.24)');
    gradient.addColorStop(1, 'rgba(109, 75, 42, 0.1)');

    this.roundRectPath(ctx, tx, ty, width, height, this.rpx(2));
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(93, 64, 38, 0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.globalAlpha = 0.32;
    this.drawHandLine(
      ctx,
      tx + this.rpx(5),
      ty + height * 0.54,
      tx + width - this.rpx(5),
      ty + height * (0.48 + noise(seed || 0) * 0.1),
      'rgba(255, 248, 224, 0.34)',
      0.7,
      (seed || 0) + 17,
    );
    ctx.restore();
  },

  getRopeChromeMetrics(width) {
    const statsWidth = Math.min(width - this.rpx(88), this.rpx(620));
    const statsX = (width - statsWidth) / 2;
    const capsuleClearY = this.data.menuButtonBottom ? this.data.menuButtonBottom + this.rpx(12) : 0;
    const statsY = Math.max(this.data.safeTop + this.rpx(72), capsuleClearY);
    const sideTabY = Math.max(statsY + this.rpx(92 + 68), this.data.safeTop + this.rpx(188));

    return {
      statsX,
      statsY,
      statsWidth,
      sideTabY,
    };
  },

  drawCanvasUi(ctx, width, height) {
    this.uiHits = [];
    if (this.data.showNote || this.data.showDetail || this.data.showNotebook) return;

    const chrome = this.getRopeChromeMetrics(width);
    this.drawStatsCanvas(ctx, width, chrome);
    this.drawSideTabCanvas(ctx, 'back', '返回', this.rpx(8), chrome.sideTabY);
    this.drawSideTabCanvas(ctx, 'timeline', '绳历', width - this.rpx(84), chrome.sideTabY);
    if (this.data.timelineOpen) this.drawTimelineDockCanvas(ctx, width, height);
    this.drawExchangeCanvas(ctx, width, height);
  },

  drawStatsCanvas(ctx, width, chrome) {
    const metrics = chrome || this.getRopeChromeMetrics(width);
    const x = metrics.statsX;
    const y = metrics.statsY;
    const barWidth = metrics.statsWidth;
    const barHeight = this.rpx(92);
    this.fillPaperRect(ctx, x, y, barWidth, barHeight, this.rpx(14), 9001);
    this.drawTapeCanvas(ctx, x + barWidth - this.rpx(120), y - this.rpx(10), this.rpx(84), this.rpx(28), -5 * Math.PI / 180, 9101);

    const items = this.data.statsItems && this.data.statsItems.length
      ? this.data.statsItems
      : [
        { value: '0天', label: '相伴' },
        { value: 0, label: '未解' },
        { value: 0, label: '已解' },
      ];
    items.forEach((item, index) => {
      const centerX = x + (barWidth * (index + 0.5)) / 3;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#342d27';
      ctx.font = `bold ${Math.round(this.rpx(36))}px sans-serif`;
      ctx.fillText(String(item.value), centerX, y + this.rpx(34));
      ctx.fillStyle = '#766756';
      ctx.font = `${Math.round(this.rpx(22))}px sans-serif`;
      ctx.fillText(String(item.label), centerX, y + this.rpx(66));
      ctx.restore();
    });
  },

  drawSideTabCanvas(ctx, id, text, x, y) {
    const width = this.rpx(76);
    const height = this.rpx(176);
    this.fillPaperRect(ctx, x, y, width, height, this.rpx(12), id === 'back' ? 610 : 720);
    const tapeWidth = this.rpx(44);
    const tapeHeight = this.rpx(28);
    const tapeX = id === 'back' ? x + this.rpx(16) : x + width - this.rpx(16) - tapeWidth;
    const tapeRotation = id === 'back' ? 9 * Math.PI / 180 : -9 * Math.PI / 180;
    this.drawTapeCanvas(ctx, tapeX, y - this.rpx(14), tapeWidth, tapeHeight, tapeRotation, id === 'back' ? 618 : 728);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4c4036';
    ctx.font = `bold ${Math.round(this.rpx(28))}px sans-serif`;
    const chars = text.split('');
    const startY = y + height / 2 - ((chars.length - 1) * this.rpx(30)) / 2;
    chars.forEach((char, index) => {
      ctx.fillText(char, x + width / 2, startY + index * this.rpx(30));
    });
    ctx.restore();
    this.addUiHit(id, x, y, width, height);
  },

  drawExchangeCanvas(ctx, width, height) {
    const buttonWidth = this.rpx(244);
    const buttonHeight = this.rpx(116);
    const buttonX = (width - buttonWidth) / 2;
    const buttonY = height - this.rpx(40) - buttonHeight;

    if (this.data.exchangeOpen) {
      const trayX = this.rpx(36);
      const trayWidth = width - this.rpx(72);
      const columnGap = this.rpx(24);
      const rowGap = this.rpx(24);
      const columnWidth = (trayWidth - columnGap) / 2;
      const rowHeight = this.rpx(144);
      const notebookHeight = this.rpx(124);
      const firstY = buttonY - this.rpx(36) - rowHeight - rowGap - notebookHeight;
      const actions = [
        {
          id: 'write',
          label: '写一个结',
          hint: '把没说完的话系上',
          x: trayX,
          y: firstY,
          width: columnWidth,
          height: rowHeight,
          rotate: -0.036,
        },
        {
          id: 'resolve',
          label: '解一个结',
          hint: '翻开最近的未解',
          x: trayX + columnWidth + columnGap,
          y: firstY,
          width: columnWidth,
          height: rowHeight,
          rotate: 0.031,
        },
        {
          id: 'notebook',
          label: '翻绳本',
          hint: '回看已解的结和挂上的印章',
          x: trayX,
          y: firstY + rowHeight + rowGap,
          width: trayWidth,
          height: notebookHeight,
          rotate: -0.01,
        },
      ];
      actions.forEach((action, index) => {
        this.drawExchangeActionCanvas(ctx, action, 820 + index * 20);
        this.addUiHit(action.id, action.x, action.y, action.width, action.height);
      });
    }

    this.fillPaperRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, this.rpx(20), 760);
    this.drawTapeCanvas(ctx, buttonX + buttonWidth - this.rpx(78), buttonY - this.rpx(12), this.rpx(58), this.rpx(24), -7 * Math.PI / 180, 768);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#342d27';
    ctx.font = `bold ${Math.round(this.rpx(34))}px sans-serif`;
    ctx.fillText('记绳', buttonX + buttonWidth / 2, buttonY + this.rpx(42));
    ctx.fillStyle = '#766a5d';
    ctx.font = `${Math.round(this.rpx(22))}px sans-serif`;
    ctx.fillText('翻开纸签', buttonX + buttonWidth / 2, buttonY + this.rpx(76));
    ctx.restore();
    this.addUiHit('exchange', buttonX, buttonY, buttonWidth, buttonHeight);
  },

  drawExchangeActionCanvas(ctx, action, seed) {
    const centerX = action.x + action.width / 2;
    const centerY = action.y + action.height / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(action.rotate || 0);
    this.fillPaperRect(ctx, -action.width / 2, -action.height / 2, action.width, action.height, this.rpx(14), seed);

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#3e342c';
    ctx.font = `bold ${Math.round(this.rpx(30))}px sans-serif`;
    ctx.fillText(action.label, -action.width / 2 + this.rpx(24), -action.height / 2 + this.rpx(46));
    ctx.fillStyle = '#786b5d';
    ctx.font = `${Math.round(this.rpx(22))}px sans-serif`;
    const hint = action.hint.length > 11 ? `${action.hint.slice(0, 11)}...` : action.hint;
    ctx.fillText(hint, -action.width / 2 + this.rpx(24), -action.height / 2 + this.rpx(86));

    ctx.strokeStyle = 'rgba(122, 87, 51, 0.12)';
    ctx.lineWidth = 1;
    this.drawHandLine(
      ctx,
      -action.width / 2 + this.rpx(20),
      -action.height / 2 + this.rpx(18),
      action.width / 2 - this.rpx(20),
      -action.height / 2 + this.rpx(17),
      'rgba(122, 87, 51, 0.12)',
      0.8,
      seed + 7
    );

    ctx.fillStyle = 'rgba(126, 96, 64, 0.08)';
    ctx.strokeStyle = 'rgba(104, 77, 49, 0.08)';
    ctx.lineWidth = 1;
    ctx.translate(action.width / 2 - this.rpx(20), action.height / 2 - this.rpx(20));
    ctx.rotate(0.73);
    ctx.fillRect(-this.rpx(22), -this.rpx(22), this.rpx(44), this.rpx(44));
    ctx.strokeRect(-this.rpx(22), -this.rpx(22), this.rpx(44), this.rpx(44));
    ctx.restore();
  },

  drawTimelineDockCanvas(ctx, width, height) {
    const dockWidth = this.rpx(276);
    const x = width - this.rpx(24) - dockWidth;
    const y = this.data.safeTop + 112;
    const dockHeight = Math.max(this.rpx(320), height - y - this.rpx(236));
    this.fillPaperRect(ctx, x, y, dockWidth, dockHeight, this.rpx(18), 1180);

    ctx.save();
    ctx.strokeStyle = 'rgba(89, 63, 38, 0.24)';
    ctx.lineWidth = 1;
    if (ctx.setLineDash) ctx.setLineDash([this.rpx(12), this.rpx(12)]);
    ctx.beginPath();
    ctx.moveTo(x + this.rpx(62), y + this.rpx(26));
    ctx.lineTo(x + this.rpx(62), y + dockHeight - this.rpx(26));
    ctx.stroke();
    if (ctx.setLineDash) ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(117, 89, 58, 0.12)';
    ctx.strokeStyle = 'rgba(92, 69, 45, 0.08)';
    ctx.translate(x + dockWidth - this.rpx(68), y - this.rpx(20));
    ctx.rotate(-0.14);
    ctx.fillRect(0, 0, this.rpx(72), this.rpx(40));
    ctx.strokeRect(0, 0, this.rpx(72), this.rpx(40));
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#3d342c';
    ctx.font = `bold ${Math.round(this.rpx(26))}px sans-serif`;
    ctx.fillText('绳', x + this.rpx(28), y + this.rpx(48));
    ctx.fillText('历', x + this.rpx(28), y + this.rpx(80));
    this.fillPaperRect(ctx, x + this.rpx(12), y + this.rpx(108), this.rpx(40), this.rpx(40), this.rpx(20), 1288);
    ctx.fillStyle = '#6c5743';
    ctx.font = `${Math.round(this.rpx(30))}px sans-serif`;
    ctx.fillText('×', x + this.rpx(32), y + this.rpx(128));
    ctx.restore();
    this.addUiHit('timeline-close', x + this.rpx(8), y + this.rpx(96), this.rpx(52), this.rpx(60));

    const bodyX = x + this.rpx(70);
    const bodyWidth = dockWidth - this.rpx(88);
    const hintY = y + this.rpx(24);
    this.fillPaperRect(ctx, bodyX, hintY, bodyWidth, this.rpx(92), this.rpx(12), 1310);
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7a4f43';
    ctx.font = `${Math.round(this.rpx(20))}px sans-serif`;
    ctx.fillText('点日期会圈住绳', bodyX + this.rpx(12), hintY + this.rpx(24));
    ctx.fillText('上的位置，再点', bodyX + this.rpx(12), hintY + this.rpx(50));
    ctx.fillText('一次取消。', bodyX + this.rpx(12), hintY + this.rpx(76));
    ctx.restore();

    const itemHeight = this.rpx(76);
    const itemGap = this.rpx(18);
    const listY = hintY + this.rpx(110);
    const maxItems = Math.max(1, Math.floor((dockHeight - this.rpx(150)) / (itemHeight + itemGap)));
    const allItems = this.data.recordTimelineItems || [];
    const visibleItems = allItems.slice(-maxItems);

    if (!visibleItems.length) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#7c6d5e';
      ctx.font = `${Math.round(this.rpx(24))}px sans-serif`;
      ctx.fillText('还没有记录', bodyX + bodyWidth / 2, listY + this.rpx(42));
      ctx.restore();
      return;
    }

    visibleItems.forEach((item, index) => {
      const itemY = listY + index * (itemHeight + itemGap);
      this.fillPaperRect(ctx, bodyX, itemY, bodyWidth, itemHeight, this.rpx(12), 1380 + index * 13);
      if (item.id === this.data.selectedTimelineId) {
        ctx.save();
        this.roundRectPath(ctx, bodyX + 2, itemY + 2, bodyWidth - 4, itemHeight - 4, this.rpx(10));
        ctx.strokeStyle = 'rgba(176, 37, 31, 0.72)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
      const dotX = bodyX + this.rpx(16);
      const dotY = itemY + this.rpx(22);
      const kind = item.kind || '绳结';
      const dotColor = item.status === 'badge'
        ? '#a56a3d'
        : item.status === 'resolved'
          ? '#a6a094'
          : '#6f5844';
      ctx.save();
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(dotX, dotY, this.rpx(8), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ead8b4';
      ctx.lineWidth = Math.max(1, this.rpx(3));
      ctx.stroke();
      ctx.fillStyle = '#4a3425';
      ctx.font = `bold ${Math.round(this.rpx(24))}px sans-serif`;
      ctx.fillText(item.date || '今天', bodyX + this.rpx(34), itemY + this.rpx(22));
      ctx.fillStyle = '#7a6857';
      ctx.font = `${Math.round(this.rpx(20))}px sans-serif`;
      ctx.fillText(kind, bodyX + this.rpx(34), itemY + this.rpx(50));
      ctx.restore();
      this.addUiHit('timeline-item', bodyX, itemY, bodyWidth, itemHeight, { eventId: item.id });
    });
  },

  drawTimelineSelection(ctx, item, y, index) {
    const note = item.status === 'resolved' ? this.resolvedNoteCenter(item, y, index) : null;
    const x = item.type === 'ornament' ? this.ornamentCenterX(index, y) : note ? note.x : this.knotCenterX(item, y);
    const centerY = note ? note.y : y;
    const rx = item.type === 'ornament' ? 58 : item.status === 'resolved' ? 48 : 68;
    const ry = item.type === 'ornament' ? 42 : item.status === 'resolved' ? 38 : 58;
    ctx.save();
    this.drawRoughOval(ctx, x, centerY, rx, ry, 'rgba(176, 37, 31, 0.82)', 2.2, toTime(item.createdAt) / 100000 + 177, -0.08);
    this.drawRoughOval(ctx, x + 1, centerY + 1, rx + 5, ry + 4, 'rgba(176, 37, 31, 0.22)', 1.1, toTime(item.createdAt) / 100000 + 191, 0.05);
    ctx.restore();
  },

  closeNote() {
    this.setData({ showNote: false, noteText: '', noteStrand: 'shared' }, () => {
      this.resumeCanvas();
    });
  },

  onNoteInput(event) {
    this.setData({ noteText: event.detail.value });
  },

  selectNoteStrand(event) {
    const strand = this.normalizeStrand(event.currentTarget.dataset.strand);
    this.setData({ noteStrand: strand });
  },

  async submitKnot() {
    const content = this.data.noteText.trim();
    if (!content) {
      wx.showToast({ title: '留一句就好', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    try {
      const event = await store.createKnot(this.session, {
        content,
        anchorY: this.pendingAnchorY,
        strand: this.isCoupleMode() ? this.normalizeStrand(this.data.noteStrand) : 'shared',
      });
      const events = this.replaceEvent(event);
      this.setData({
        events,
        saving: false,
        showNote: false,
        noteText: '',
        noteStrand: 'shared',
        statusText: this.buildStatusText(events, this.session.rope.relationshipStartedAt),
        statsItems: this.buildStatsItems(events, this.session.rope.relationshipStartedAt),
        recordTimelineItems: this.buildRecordTimelineItems(events, this.session.rope.relationshipStartedAt),
        notebookItems: this.buildNotebookItems(events, this.data.notebookSearchText),
      }, () => {
        this.shouldScrollToLatest = true;
        this.resumeCanvas();
      });
    } catch (error) {
      console.error(error);
      this.setData({ saving: false });
      wx.showToast({ title: '这个结没系上', icon: 'none' });
    }
  },

  openDetail(event) {
    this.setData({
      showDetail: true,
      selectedEvent: event,
      selectedState: this.buildSelectedState(event),
      resolveMode: '',
      resolveText: '',
    });
  },

  openOrnament(item) {
    this.setData({
      showDetail: true,
      selectedEvent: null,
      selectedState: {
        title: item.title,
        meta: item.subtitle || formatDate(item.createdAt),
        content: '这枚小挂饰是绳子自己长出来的纪念。',
        isResolved: true,
      },
      resolveMode: '',
      resolveText: '',
    });
  },

  closeDetail() {
    this.setData({
      showDetail: false,
      selectedEvent: null,
      selectedState: {},
      resolveMode: '',
      resolveText: '',
    }, () => {
      this.resumeCanvas();
    });
  },

  buildSelectedState(event) {
    const request = event.resolveRequest || null;
    const isResolved = event.status === 'resolved';
    const isRequester = Boolean(request && request.requestedBy === this.session.openid);
    const canRequest = !isResolved;
    const canAccept = false;
    const dustStage = getDustStage(event, Date.now());
    const strandPrefix = this.isCoupleMode() ? `${this.strandLabel(event.strand)} · ` : '';
    const dustText = {
      none: '',
      specks: '有一点灰',
      dense: '灰尘变密了',
      fibers: '长出细细绒毛',
      web: '结旁挂起蛛网',
    }[dustStage];

    return {
      title: isResolved ? `${strandPrefix}一个淡淡的印记` : `${strandPrefix}一个还没解开的结`,
      meta: isResolved && event.resolvedAt
        ? `结下 ${formatDate(event.createdAt)} · 解开 ${formatDate(event.resolvedAt)}`
        : [`结下 ${formatDate(event.createdAt)}`, dustText].filter(Boolean).join(' · '),
      content: event.content,
      isResolved,
      hasRequest: Boolean(request),
      isRequester,
      canRequest,
      canAccept,
      requesterLine: request && request.requesterLine ? request.requesterLine : '',
      accepterLine: request && request.accepterLine ? request.accepterLine : '',
    };
  },

  openResolveRequest() {
    this.setData({ resolveMode: 'resolve', resolveText: '' });
  },

  openResolveAccept() {
    this.setData({ resolveMode: 'accept', resolveText: '' });
  },

  onResolveInput(event) {
    this.setData({ resolveText: event.detail.value });
  },

  async submitResolve() {
    if (!this.data.selectedEvent || !this.data.resolveMode) return;
    this.setData({ saving: true });

    try {
      const selected = this.data.selectedEvent;
      const text = this.data.resolveText.trim();
      const updated = await store.confirmResolve(this.session, selected, text);

      const events = updated ? this.replaceEvent(updated) : this.data.events;
      this.setData({
        events,
        saving: false,
        showDetail: false,
        selectedEvent: null,
        selectedState: {},
        resolveMode: '',
        resolveText: '',
        statusText: this.buildStatusText(events, this.session.rope.relationshipStartedAt),
        statsItems: this.buildStatsItems(events, this.session.rope.relationshipStartedAt),
        recordTimelineItems: this.buildRecordTimelineItems(events, this.session.rope.relationshipStartedAt),
        notebookItems: this.buildNotebookItems(events, this.data.notebookSearchText),
      }, () => {
        this.resumeCanvas();
      });
    } catch (error) {
      console.error(error);
      this.setData({ saving: false });
      wx.showToast({ title: '这句话没送出去', icon: 'none' });
    }
  },

  replaceEvent(updated) {
    const events = this.data.events.slice();
    const id = updated._id || updated.id;
    const index = events.findIndex((event) => (event._id || event.id) === id);
    if (index >= 0) {
      events[index] = updated;
    } else {
      events.push(updated);
    }
    return events.sort((a, b) => toTime(a.createdAt) - toTime(b.createdAt));
  },

  requestRender() {
    if (this.renderPending) return;
    this.renderPending = true;

    const runRender = () => {
      this.renderPending = false;
      this.renderFallbackTimer = null;
      this.render();
    };

    if (this.canvas && typeof this.canvas.requestAnimationFrame === 'function') {
      this.canvas.requestAnimationFrame(runRender);
      return;
    }

    this.renderFallbackTimer = setTimeout(runRender, 16);
  },

  render() {
    if (!this.ctx) return;
    if (this.data.viewMode !== 'rope') {
      this.ctx.clearRect(0, 0, this.data.canvasWidth, this.data.canvasHeight);
      return;
    }
    const width = this.data.canvasWidth;
    const height = this.data.canvasHeight;
    const events = this.data.events || [];
    const relationshipStartedAt =
      this.session && this.session.rope ? this.session.rope.relationshipStartedAt : Date.now();
    const ornaments = computeMilestones({
      events,
      relationshipStartedAt,
      now: Date.now(),
    });
    const items = layoutTimelineItems({
      events,
      ornaments,
      topPadding: 142,
      minGap: 148,
    });

    const lastItem = items[items.length - 1];
    this.layoutItems = items;
    this.contentHeight = Math.max(height + 80, lastItem ? lastItem.y + 172 : height + 80);
    this.maxScrollY = Math.max(0, this.contentHeight - height + 38);
    if (this.shouldScrollToLatest) {
      this.scrollY = this.maxScrollY;
      this.shouldScrollToLatest = false;
    } else {
      this.scrollY = Math.max(0, Math.min(this.scrollY, this.maxScrollY));
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);
    this.drawPaper(ctx, width, height);
    this.drawRope(ctx, width, height);
    const ornamentVisuals = this.buildVisibleOrnamentVisuals(items, height);

    items.forEach((item, index) => {
      const screenY = item.y - this.scrollY;
      if (screenY < -110 || screenY > height + 110) return;
      if (item.type === 'ornament') {
        this.drawOrnament(ctx, item, index, screenY, ornamentVisuals[item.id]);
      } else if (item.status === 'resolved') {
        this.drawMark(ctx, item, screenY, index);
      } else {
        this.drawKnot(ctx, item, screenY, index);
      }
      if (this.data.timelineOpen && item.id === this.data.selectedTimelineId) {
        this.drawTimelineSelection(ctx, item, screenY, index);
      }
    });

    this.drawScrollCue(ctx, width, height);
    this.drawCanvasUi(ctx, width, height);
  },

  drawPaper(ctx, width, height) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 44; i += 1) {
      const x = noise(i + 401) * width;
      const y = noise(i + 409) * height;
      const radius = 24 + noise(i + 419) * 78;
      const gradient = ctx.createRadialGradient(x, y, 1, x, y, radius);
      const warm = noise(i + 431) > 0.48;
      gradient.addColorStop(0, warm ? 'rgba(232, 187, 109, 0.09)' : 'rgba(91, 58, 30, 0.07)');
      gradient.addColorStop(0.45, warm ? 'rgba(214, 160, 82, 0.04)' : 'rgba(82, 52, 27, 0.034)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    for (let i = 0; i < 420; i += 1) {
      const x = noise(i + 3) * width;
      const y = noise(i + 19) * height;
      const length = 4 + noise(i + 23) * 15;
      const alpha = 0.018 + noise(i + 29) * 0.042;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((noise(i + 31) - 0.5) * 0.55);
      ctx.fillStyle = `rgba(92, 59, 30, ${alpha})`;
      ctx.fillRect(0, 0, length, 0.55 + noise(i + 37) * 0.75);
      ctx.restore();
    }

    for (let i = 0; i < 160; i += 1) {
      const x = noise(i + 457) * width;
      const y = noise(i + 463) * height;
      const radius = 0.7 + noise(i + 467) * 2.6;
      const alpha = 0.025 + noise(i + 479) * 0.052;
      ctx.beginPath();
      ctx.fillStyle = `rgba(91, 56, 28, ${alpha})`;
      ctx.ellipse(x, y, radius * (1 + noise(i + 487)), radius, noise(i + 491) * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }

    const vignette = ctx.createRadialGradient(width / 2, height * 0.42, height * 0.08, width / 2, height * 0.45, height * 0.72);
    vignette.addColorStop(0, 'rgba(255, 236, 178, 0.03)');
    vignette.addColorStop(0.72, 'rgba(78, 48, 22, 0.03)');
    vignette.addColorStop(1, 'rgba(46, 28, 12, 0.12)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  },

  ropePoint(y, pass) {
    const worldY = y + this.scrollY;
    const sway = Math.sin(worldY / 62) * 3.6 + Math.sin(worldY / 19 + pass) * 1.4;
    return this.ropeX + sway;
  },

  coupleRopePoint(y, side, pass) {
    const worldY = y + this.scrollY;
    const breathingGap = this.rpx(38) + Math.sin(worldY / 128 + side * 0.7) * this.rpx(4.2);
    const sway = Math.sin(worldY / 72 + pass + side * 0.5) * 2.5 + Math.sin(worldY / 27 + side) * 0.9;
    return this.ropeX + side * breathingGap + sway;
  },

  drawRope(ctx, width, height) {
    if (this.isCoupleMode()) {
      this.drawCoupleRope(ctx, width, height);
      return;
    }

    const top = -28;
    const bottom = height + 28;
    const layers = [
      { offset: 2.8, width: 14.5, color: ROPE_SHADOW, alpha: 0.42, wobble: 0.9 },
      { offset: 0, width: 12.2, color: ROPE_EDGE, alpha: 0.9, wobble: 0.85 },
      { offset: 0, width: 9.4, color: ROPE_COLOR, alpha: 1, wobble: 0.75 },
      { offset: -2.1, width: 1.9, color: ROPE_LIGHT, alpha: 0.58, wobble: 0.5 },
    ];

    layers.forEach((layer, pass) => {
      ctx.beginPath();
      for (let y = top - 4; y <= bottom + 4; y += 9) {
        const x = this.ropePoint(y, pass) + layer.offset + (noise(y + pass * 13) - 0.5) * layer.wobble;
        if (y === top - 4) ctx.moveTo(x, y);
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

    for (let y = top + 12; y <= bottom; y += 44) {
      const x = this.ropePoint(y, 0);
      this.drawHandLine(ctx, x - 2.8, y - 14, x - 3.7, y + 14, 'rgba(248, 235, 202, 0.24)', 0.75, y);
      this.drawHandLine(ctx, x + 4.2, y - 13, x + 3.4, y + 13, 'rgba(92, 70, 47, 0.18)', 0.7, y + 7);
    }

    for (let y = top + 20; y <= bottom; y += 18) {
      const x = this.ropePoint(y, 0);
      this.drawHandLine(ctx, x - 4.7, y - 7, x + 4.1, y + 7, 'rgba(103, 80, 54, 0.14)', 0.55, y + 19);
      this.drawHandLine(ctx, x + 4, y - 7, x - 4, y + 7, 'rgba(247, 233, 198, 0.12)', 0.45, y + 31);
    }
  },

  drawRopeStrand(ctx, top, bottom, pointAt, palette, seedBase) {
    const layers = [
      { offset: 2.6, width: 13.8, color: palette.shadow, alpha: 0.38, wobble: 0.85 },
      { offset: 0, width: 11.6, color: palette.edge, alpha: 0.86, wobble: 0.8 },
      { offset: 0, width: 8.8, color: palette.core, alpha: 0.98, wobble: 0.72 },
      { offset: -1.8, width: 1.7, color: palette.light, alpha: 0.62, wobble: 0.46 },
    ];

    layers.forEach((layer, pass) => {
      ctx.beginPath();
      for (let y = top - 4; y <= bottom + 4; y += 9) {
        const x = pointAt(y, pass) + layer.offset + (noise(seedBase + y + pass * 13) - 0.5) * layer.wobble;
        if (y === top - 4) ctx.moveTo(x, y);
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

    for (let y = top + 12; y <= bottom; y += 44) {
      const x = pointAt(y, 0);
      this.drawHandLine(ctx, x - 2.6, y - 14, x - 3.5, y + 14, palette.light, 0.68, seedBase + y);
      this.drawHandLine(ctx, x + 3.7, y - 13, x + 3.1, y + 13, 'rgba(79, 57, 39, 0.16)', 0.64, seedBase + y + 7);
    }

    for (let y = top + 20; y <= bottom; y += 20) {
      const x = pointAt(y, 0);
      this.drawHandLine(ctx, x - 4.3, y - 7, x + 3.8, y + 7, 'rgba(92, 67, 44, 0.13)', 0.48, seedBase + y + 19);
      this.drawHandLine(ctx, x + 3.7, y - 7, x - 3.7, y + 7, 'rgba(255, 242, 208, 0.12)', 0.42, seedBase + y + 31);
    }
  },

  drawCoupleRope(ctx, width, height) {
    const top = -30;
    const bottom = height + 30;
    this.drawRopeStrand(ctx, top, bottom, (y, pass) => this.coupleRopePoint(y, -1, pass), COUPLE_WHITE_ROPE, 3100);
    this.drawRopeStrand(ctx, top, bottom, (y, pass) => this.coupleRopePoint(y, 1, pass), COUPLE_RED_ROPE, 4200);

    ctx.save();
    ctx.globalAlpha = 0.34;
    for (let y = top + 54; y <= bottom; y += 118) {
      const leftX = this.coupleRopePoint(y - 18, -1, 0);
      const rightX = this.coupleRopePoint(y + 20, 1, 0);
      this.drawHandLine(ctx, leftX + 2, y - 20, rightX - 2, y + 18, 'rgba(226, 203, 166, 0.42)', 1.15, y + 6100);
      this.drawHandLine(ctx, rightX - 1, y + 18, leftX + 4, y + 52, 'rgba(152, 74, 58, 0.28)', 1.05, y + 6200);
    }
    ctx.restore();
  },

  drawHandLine(ctx, x1, y1, x2, y2, color, width, seed) {
    ctx.beginPath();
    const steps = 5;
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t + (noise(seed + i * 7) - 0.5) * 1.4;
      const y = y1 + (y2 - y1) * t + (noise(seed + i * 11) - 0.5) * 1.4;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.stroke();
  },

  drawRoughOval(ctx, x, y, rx, ry, color, width, seed, rotate) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotate || 0);
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
    ctx.lineWidth = width / Math.max(rx, ry);
    ctx.stroke();
    ctx.restore();
  },

  strokeBuiltPath(ctx, buildPath, color, width, alpha, offsetX, offsetY) {
    ctx.save();
    ctx.translate(offsetX || 0, offsetY || 0);
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.beginPath();
    buildPath(ctx);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.restore();
  },

  ropeStroke(ctx, buildPath, width) {
    this.ropeStrokeWithPalette(ctx, buildPath, width, SINGLE_ROPE_PALETTE);
  },

  ropeStrokeWithPalette(ctx, buildPath, width, palette) {
    this.strokeBuiltPath(ctx, buildPath, palette.shadow, width + 4.6, 0.42, 2.6, 2.4);
    this.strokeBuiltPath(ctx, buildPath, palette.edge, width + 2.1, 0.92);
    this.strokeBuiltPath(ctx, buildPath, palette.core, width, 1);
    this.strokeBuiltPath(ctx, buildPath, palette.light, Math.max(1.15, width * 0.19), 0.58, -1.7, -1.3);
  },

  buildLoopOval(path, side, rx, ry, seed) {
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
  },

  coverRopeSegment(ctx, x, y, seed) {
    this.strokeBuiltPath(ctx, (path) => {
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
  },

  buildKnotBackPath(path, x, y, loosen) {
    path.moveTo(x + 1, y - 46);
    path.bezierCurveTo(x + 1, y - 34, x - 10 - loosen, y - 29, x - 24 - loosen, y - 18);
    path.bezierCurveTo(x - 49 - loosen, y + 1, x - 31 - loosen, y + 31, x - 1, y + 24);
    path.bezierCurveTo(x + 25 + loosen, y + 18, x + 38 + loosen, y - 3, x + 21 + loosen, y - 17);
  },

  buildKnotFrontPath(path, x, y, loosen) {
    path.moveTo(x - 28 - loosen, y + 11);
    path.bezierCurveTo(x - 10, y - 6, x + 15, y - 6, x + 33 + loosen, y + 10);
    path.bezierCurveTo(x + 47 + loosen, y + 26, x + 10, y + 36, x - 6, y + 22);
    path.bezierCurveTo(x - 19, y + 11, x - 6, y - 9, x + 16, y - 20);
  },

  buildKnotTailPath(path, x, y) {
    path.moveTo(x + 2, y + 14);
    path.bezierCurveTo(x + 8, y + 26, x + 5, y + 36, x, y + 47);
  },

  drawKnot(ctx, item, y, index) {
    if (this.isCoupleMode()) {
      const strand = this.eventStrand(item);
      if (strand === 'white' || strand === 'red') {
        this.drawCoupleStrandKnot(ctx, item, y, index, strand);
      } else {
        this.drawCoupleKnot(ctx, item, y, index);
      }
      return;
    }

    const x = this.ropeX;
    const seed = toTime(item.createdAt) / 100000;
    const jitter = (noise(seed) - 0.5) * 1.8;
    const side = index % 2 === 0 ? -1 : 1;
    const rx = 36 + noise(seed + 5) * 2;
    const ry = 27 + noise(seed + 9) * 1.5;

    ctx.save();
    ctx.translate(x, y + jitter);
    ctx.rotate(side * 0.012);

    const loopPath = (path) => this.buildLoopOval(path, side, rx, ry, seed + 11);
    const frontLipPath = (path) => {
      path.moveTo(side * (rx * 1.84), -1);
      path.bezierCurveTo(side * (rx * 1.72), ry * 0.72, side * (rx * 0.7), ry * 1.08, side * 5, ry * 0.55);
    };

    this.ropeStroke(ctx, loopPath, 10.4);
    this.ropeStroke(ctx, frontLipPath, 10.8);

    this.drawHandLine(ctx, side * 1, -ry * 0.82, side * (rx * 1.18), -ry * 0.38, 'rgba(86, 60, 34, 0.18)', 0.8, seed + 17);
    this.drawHandLine(ctx, side * (rx * 1.66), 2, side * 6, ry * 0.56, 'rgba(86, 60, 34, 0.24)', 0.9, seed + 23);
    this.drawHandLine(ctx, side * (rx * 0.42), -ry * 0.96, side * (rx * 1.45), -ry * 0.2, 'rgba(246, 232, 198, 0.18)', 0.7, seed + 29);
    this.drawHandLine(ctx, side * 9, ry * 0.92, side * (rx * 1.38), ry * 0.34, 'rgba(91, 69, 44, 0.13)', 0.65, seed + 33);
    this.drawHandLine(ctx, side * (rx * 0.08), -ry * 0.28, side * (rx * 0.44), ry * 0.62, 'rgba(78, 58, 36, 0.16)', 0.55, seed + 37);
    this.drawHandLine(ctx, side * (rx * 0.72), -ry * 0.74, side * (rx * 1.08), ry * 0.1, 'rgba(78, 58, 36, 0.16)', 0.55, seed + 41);
    this.drawHandLine(ctx, side * (rx * 1.42), -ry * 0.22, side * (rx * 1.12), ry * 0.7, 'rgba(78, 58, 36, 0.14)', 0.5, seed + 45);
    ctx.restore();

    this.drawDust(ctx, item, x, y);
  },

  drawCoupleStrandKnot(ctx, item, y, index, strand) {
    const side = this.strandSide(strand);
    const x = this.coupleRopePoint(y, side, 0);
    const palette = side < 0 ? COUPLE_WHITE_ROPE : COUPLE_RED_ROPE;
    const seed = toTime(item.createdAt) / 100000;
    const jitter = (noise(seed) - 0.5) * 1.8;
    const turn = side * (0.02 + (index % 2) * 0.006);

    ctx.save();
    ctx.translate(x, y + jitter);
    ctx.rotate(turn);

    const loopPath = (path) => {
      path.moveTo(side * -5, -34);
      path.bezierCurveTo(side * -40, -28, side * -48, 22, side * -7, 24);
      path.bezierCurveTo(side * 24, 25, side * 38, -2, side * 14, -16);
      path.bezierCurveTo(side * -1, -25, side * -17, -18, side * -27, -3);
    };
    const wrapPath = (path) => {
      path.moveTo(side * -32, 6);
      path.bezierCurveTo(side * -10, -11, side * 15, -8, side * 34, 10);
      path.bezierCurveTo(side * 45, 22, side * 8, 32, side * -8, 20);
    };

    this.ropeStrokeWithPalette(ctx, loopPath, 9.8, palette);
    this.ropeStrokeWithPalette(ctx, wrapPath, 10.2, palette);
    this.drawHandLine(ctx, side * -23, -11, side * 10, 3, palette.light, 0.72, seed + 641);
    this.drawHandLine(ctx, side * 28, 5, side * -4, 18, 'rgba(78, 58, 36, 0.18)', 0.7, seed + 643);
    ctx.restore();

    this.drawDust(ctx, item, x, y);
  },

  drawCoupleKnot(ctx, item, y, index) {
    const x = this.ropeX;
    const seed = toTime(item.createdAt) / 100000;
    const jitter = (noise(seed) - 0.5) * 1.8;
    const turn = index % 2 === 0 ? -1 : 1;
    const whiteAnchor = this.coupleRopePoint(y, -1, 0);
    const redAnchor = this.coupleRopePoint(y, 1, 0);

    ctx.save();
    ctx.globalAlpha = 0.94;
    this.drawHandLine(ctx, whiteAnchor + 2, y - 30, x - 24, y - 6, COUPLE_WHITE_ROPE.edge, 2.1, seed + 701);
    this.drawHandLine(ctx, redAnchor - 2, y - 30, x + 24, y - 4, COUPLE_RED_ROPE.edge, 2, seed + 703);
    ctx.restore();

    ctx.save();
    ctx.translate(x, y + jitter);
    ctx.rotate(turn * 0.014);

    const whiteLoop = (path) => {
      path.moveTo(-34, -34);
      path.bezierCurveTo(-76, -28, -80, 24, -37, 24);
      path.bezierCurveTo(-6, 24, 9, 1, -11, -14);
      path.bezierCurveTo(-23, -24, -38, -19, -50, -6);
    };
    const redLoop = (path) => {
      path.moveTo(34, -34);
      path.bezierCurveTo(78, -28, 80, 24, 37, 24);
      path.bezierCurveTo(4, 24, -9, 1, 11, -14);
      path.bezierCurveTo(24, -24, 39, -18, 51, -5);
    };
    const whiteBridge = (path) => {
      path.moveTo(-62, 4);
      path.bezierCurveTo(-28, -19, 25, -11, 62, 10);
    };
    const redBridge = (path) => {
      path.moveTo(60, -8);
      path.bezierCurveTo(22, 16, -23, 14, -60, -7);
    };

    this.ropeStrokeWithPalette(ctx, whiteLoop, 9.8, COUPLE_WHITE_ROPE);
    this.ropeStrokeWithPalette(ctx, redLoop, 9.8, COUPLE_RED_ROPE);
    this.ropeStrokeWithPalette(ctx, whiteBridge, 10.4, COUPLE_WHITE_ROPE);
    this.ropeStrokeWithPalette(ctx, redBridge, 10.2, COUPLE_RED_ROPE);

    this.drawHandLine(ctx, -52, -14, -9, 3, 'rgba(255, 243, 214, 0.26)', 0.72, seed + 731);
    this.drawHandLine(ctx, 47, -12, 8, 4, 'rgba(246, 174, 139, 0.24)', 0.7, seed + 733);
    this.drawHandLine(ctx, -14, 18, 17, -11, 'rgba(86, 58, 39, 0.2)', 0.85, seed + 735);
    ctx.restore();

    this.drawDust(ctx, item, x, y);
  },

  drawDust(ctx, item, x, y) {
    const stage = getDustStage(item, Date.now());
    if (stage === 'none') return;

    const seed = toTime(item.createdAt) / 50000;
    const count = stage === 'specks' ? 18 : stage === 'dense' ? 38 : stage === 'fibers' ? 42 : 54;
    for (let i = 0; i < count; i += 1) {
      const angle = noise(seed + i * 2) * Math.PI * 2;
      const radius = 31 + noise(seed + i * 5) * (stage === 'specks' ? 15 : 31);
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius * 0.78;
      const alpha = 0.055 + noise(seed + i * 7) * 0.075;
      ctx.fillStyle = `rgba(101, 101, 96, ${alpha})`;
      ctx.beginPath();
      ctx.arc(px, py, 0.9 + noise(seed + i * 11) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    if (stage === 'dense' || stage === 'fibers' || stage === 'web') {
      ctx.fillStyle = 'rgba(109, 105, 98, 0.035)';
      ctx.beginPath();
      ctx.arc(x + 1, y + 1, 48, 0, Math.PI * 2);
      ctx.fill();
    }

    if (stage === 'fibers' || stage === 'web') {
      for (let i = 0; i < 12; i += 1) {
        const sx = x - 30 + noise(seed + i) * 60;
        const sy = y - 24 + noise(seed + i * 3) * 48;
        this.drawHandLine(ctx, sx, sy, sx + 10 - noise(seed + i * 5) * 20, sy + 4, 'rgba(102, 102, 96, 0.16)', 0.5, seed + i);
      }
    }

    if (stage === 'web') {
      const left = x + 26;
      const top = y - 30;
      for (let i = 0; i < 4; i += 1) {
        this.drawHandLine(ctx, left, top, left + 28, top + i * 14, 'rgba(98, 98, 94, 0.18)', 0.55, seed + i * 8);
      }
      for (let i = 0; i < 3; i += 1) {
        this.drawHandLine(ctx, left + i * 10, top, left + 28, top + 42, 'rgba(98, 98, 94, 0.13)', 0.45, seed + i * 9);
      }
    }
  },

  drawMark(ctx, item, y, index) {
    this.drawResolvedStickyNote(ctx, item, y, index);
  },

  resolvedNoteCenter(item, y, index) {
    const seed = toTime(item.createdAt) / 100000;
    let side = this.itemSide(index);
    let baseX = this.ropeX;
    let drift = 38;
    if (this.isCoupleMode()) {
      const strandSide = this.strandSide(item && item.strand);
      side = strandSide || side;
      baseX = strandSide ? this.coupleRopePoint(y, strandSide, 0) : this.ropeX;
      drift = strandSide ? 32 : 24;
    }
    return {
      x: baseX + side * (drift + noise(seed + 8) * 5),
      y: y + (noise(seed + 12) - 0.5) * 4,
      side,
      seed,
    };
  },

  resolvedNoteDate(item) {
    return shortDate(item.resolvedAt || item.createdAt);
  },

  drawResolvedStickyNote(ctx, item, y, index) {
    const note = this.resolvedNoteCenter(item, y, index);
    if (this.isCoupleMode()) {
      const strandSide = this.strandSide(item && item.strand);
      if (strandSide) {
        this.drawStickyTape(ctx, this.coupleRopePoint(y, strandSide, 0), y, note.x, note.y, strandSide, note.seed + 101);
      } else {
        this.drawStickyTape(ctx, this.coupleRopePoint(y, -1, 0), y, note.x, note.y, -1, note.seed + 101);
        this.drawStickyTape(ctx, this.coupleRopePoint(y, 1, 0), y, note.x, note.y, 1, note.seed + 103);
      }
    } else {
      this.drawStickyTape(ctx, this.ropeX, y, note.x, note.y, note.side, note.seed);
    }
    ctx.save();
    ctx.translate(note.x, note.y);
    ctx.rotate(note.side * (0.045 + noise(note.seed + 4) * 0.035));
    this.drawStickyNotePaper(ctx, 58, 38, note.seed);
    this.drawHandwrittenResolvedDate(ctx, item, note.seed);
    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = 'rgba(91, 64, 39, 0.52)';
    ctx.fillText('解开', 0, 12);
    ctx.restore();
  },

  drawHandwrittenResolvedDate(ctx, item, seed) {
    const dateText = this.resolvedNoteDate(item);
    ctx.save();
    ctx.rotate((noise(seed + 26) - 0.5) * 0.045);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 14px cursive';
    ctx.fillStyle = 'rgba(52, 34, 23, 0.82)';
    ctx.fillText(dateText, -0.35, -4.15);
    ctx.fillStyle = 'rgba(96, 58, 32, 0.5)';
    ctx.fillText(dateText, 0.55, -3.45);
    this.drawHandLine(ctx, -19, 4.2, 19, 3.1 + (noise(seed + 33) - 0.5) * 1.2, 'rgba(95, 58, 34, 0.42)', 0.72, seed + 41);
    ctx.restore();
  },

  drawStickyNotePaper(ctx, widthTag, heightTag, seed) {
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
    corners.forEach((corner, cornerIndex) => {
      const px = corner[0] + (noise(seed + cornerIndex * 17) - 0.5) * 1.6;
      const py = corner[1] + (noise(seed + cornerIndex * 19) - 0.5) * 1.4;
      if (cornerIndex === 0) ctx.moveTo(px, py);
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
  },

  drawStickyTape(ctx, anchorX, anchorY, noteX, noteY, side, seed) {
    this.drawHandLine(ctx, anchorX + side * 2, anchorY - 4, noteX - side * 22, noteY - 16, 'rgba(92, 67, 40, 0.18)', 0.75, seed + 21);
    ctx.save();
    ctx.translate(noteX - side * 2, noteY - 19);
    ctx.rotate(side * (0.08 + noise(seed + 5) * 0.025));
    ctx.fillStyle = 'rgba(241, 220, 176, 0.7)';
    ctx.strokeStyle = 'rgba(127, 96, 57, 0.22)';
    ctx.lineWidth = 0.8;
    ctx.fillRect(-22, -5, 44, 10);
    ctx.strokeRect(-22, -5, 44, 10);
    this.drawHandLine(ctx, -18, -1, 17, 0, 'rgba(126, 94, 55, 0.12)', 0.45, seed + 31);
    this.drawHandLine(ctx, -16, 3, 14, 2, 'rgba(255, 245, 214, 0.26)', 0.45, seed + 37);
    ctx.restore();
  },

  drawOrnament(ctx, item, index, y, visual) {
    const side = this.itemSide(index);
    const anchorX = this.ornamentAnchorX(index, y);
    const x = this.ornamentCenterX(index, y);
    const seed = toTime(item.createdAt) / 100000;
    visual = visual || this.badgeBaseVariant(item, index);
    const palettes = {
      paper: { fill: '#c2a879', edge: '#7c603a', highlight: 'rgba(246, 226, 181, 0.44)', cord: 'rgba(119, 86, 51, 0.48)', cordHighlight: 'rgba(245, 219, 174, 0.42)' },
      brass: { fill: '#b98d45', edge: '#70502a', highlight: 'rgba(245, 213, 139, 0.42)', cord: 'rgba(136, 96, 37, 0.5)', cordHighlight: 'rgba(249, 220, 136, 0.4)' },
      copper: { fill: '#a96742', edge: '#633922', highlight: 'rgba(235, 169, 110, 0.38)', cord: 'rgba(126, 68, 42, 0.5)', cordHighlight: 'rgba(240, 169, 111, 0.38)' },
      wax: { fill: '#9d4f46', edge: '#63302c', highlight: 'rgba(245, 173, 153, 0.34)', cord: 'rgba(111, 45, 44, 0.5)', cordHighlight: 'rgba(246, 176, 156, 0.34)' },
      sage: { fill: '#9a9b76', edge: '#5c5d42', highlight: 'rgba(223, 222, 163, 0.34)', cord: 'rgba(83, 91, 63, 0.5)', cordHighlight: 'rgba(224, 223, 166, 0.34)' },
      ink: { fill: '#6b6258', edge: '#38322d', highlight: 'rgba(197, 184, 166, 0.3)', cord: 'rgba(57, 51, 46, 0.52)', cordHighlight: 'rgba(203, 191, 174, 0.32)' },
      indigo: { fill: '#68728f', edge: '#343d5e', highlight: 'rgba(191, 201, 231, 0.3)', cord: 'rgba(54, 63, 97, 0.5)', cordHighlight: 'rgba(191, 203, 232, 0.32)' },
      rose: { fill: '#b87972', edge: '#74413f', highlight: 'rgba(245, 194, 182, 0.32)', cord: 'rgba(129, 67, 64, 0.48)', cordHighlight: 'rgba(247, 197, 185, 0.32)' },
      verdigris: { fill: '#6f9a8c', edge: '#3b645c', highlight: 'rgba(187, 232, 211, 0.28)', cord: 'rgba(54, 101, 91, 0.5)', cordHighlight: 'rgba(188, 232, 212, 0.3)' },
      plum: { fill: '#80627a', edge: '#4d344b', highlight: 'rgba(220, 189, 211, 0.3)', cord: 'rgba(79, 51, 77, 0.5)', cordHighlight: 'rgba(220, 190, 211, 0.3)' },
      ochre: { fill: '#c19a4c', edge: '#755622', highlight: 'rgba(246, 221, 145, 0.36)', cord: 'rgba(135, 94, 34, 0.5)', cordHighlight: 'rgba(247, 222, 146, 0.36)' },
      lapis: { fill: '#596f93', edge: '#30466b', highlight: 'rgba(182, 203, 233, 0.3)', cord: 'rgba(49, 69, 103, 0.5)', cordHighlight: 'rgba(184, 205, 234, 0.3)' },
      clay: { fill: '#b06f55', edge: '#6d3f31', highlight: 'rgba(235, 179, 145, 0.32)', cord: 'rgba(117, 60, 45, 0.5)', cordHighlight: 'rgba(237, 181, 147, 0.32)' },
      moss: { fill: '#7f8759', edge: '#4c552f', highlight: 'rgba(206, 218, 151, 0.31)', cord: 'rgba(72, 86, 43, 0.5)', cordHighlight: 'rgba(208, 219, 153, 0.31)' },
      wine: { fill: '#8e4f59', edge: '#5a2932', highlight: 'rgba(232, 161, 172, 0.31)', cord: 'rgba(96, 40, 50, 0.5)', cordHighlight: 'rgba(233, 163, 174, 0.31)' },
      smoke: { fill: '#8b8172', edge: '#554c41', highlight: 'rgba(216, 203, 184, 0.31)', cord: 'rgba(86, 76, 65, 0.5)', cordHighlight: 'rgba(217, 204, 185, 0.31)' },
    };
    const colors = palettes[visual.tone || item.tone || 'paper'] || palettes.paper;
    const isRepair = item.family === 'repair';

    this.drawHandLine(ctx, anchorX, y - 5, x, y - 22, colors.cord, 1.1, seed + 2);
    this.drawHandLine(ctx, anchorX - side * 2, y - 3, x + side * 9, y - 20, colors.cordHighlight, 0.58, seed + 8);
    ctx.save();
    ctx.fillStyle = colors.fill;
    ctx.strokeStyle = colors.edge;
    ctx.lineWidth = isRepair ? 2.2 : 1.9;

    if (isRepair) {
      ctx.beginPath();
      for (let i = 0; i <= 24; i += 1) {
        const angle = (Math.PI * 2 * i) / 24;
        const ripple = 1 + Math.sin(angle * 5 + seed) * 0.04 + (noise(seed + i * 9) - 0.5) * 0.08;
        const px = x + Math.cos(angle) * 25 * ripple;
        const py = y + Math.sin(angle) * 25 * ripple;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.globalAlpha = 0.93;
      ctx.fill();
      ctx.globalAlpha = 0.78;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = colors.highlight;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x - 1, y - 4, 15, 12, -0.18, 0, Math.PI * 2);
      ctx.stroke();
      this.drawHandLine(ctx, x - 15, y + 12, x + 16, y - 11, colors.edge, 0.85, seed + 41);
      this.drawHandLine(ctx, x - 13, y - 11, x + 15, y + 10, colors.highlight, 0.65, seed + 47);
    } else {
      const width = 50;
      const height = 38;
      const points = [
        [x - width / 2 + 7, y - height / 2],
        [x + width / 2 - 4, y - height / 2 + 2],
        [x + width / 2, y - 5],
        [x + width / 2 - 5, y + height / 2],
        [x - width / 2 + 4, y + height / 2 - 1],
        [x - width / 2, y + 3],
      ];
      ctx.beginPath();
      points.forEach((point, pointIndex) => {
        const px = point[0] + (noise(seed + pointIndex * 11) - 0.5) * 2;
        const py = point[1] + (noise(seed + pointIndex * 17) - 0.5) * 1.8;
        if (pointIndex === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      ctx.globalAlpha = 0.93;
      ctx.fill();
      ctx.globalAlpha = 0.78;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(69, 45, 25, 0.18)';
      ctx.beginPath();
      ctx.ellipse(x - width * 0.32, y - height * 0.2, 3.8, 3.1, -0.18, 0, Math.PI * 2);
      ctx.fill();
      this.drawHandLine(ctx, x - width * 0.28, y + 11, x + width * 0.28, y + 8, colors.highlight, 0.62, seed + 33);
    }

    this.drawOrnamentMotif(ctx, item, x, y, colors, seed, isRepair, visual.motif);
    ctx.restore();
  },

  drawOrnamentMotif(ctx, item, x, y, colors, seed, isRepair, motifName) {
    const motif = motifName || BADGE_MOTIFS[hashText(`${item.id}:${item.title}:${item.family}`) % BADGE_MOTIFS.length];
    const motifIndex = Math.max(0, BADGE_MOTIFS.indexOf(motif));

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = colors.edge;
    ctx.fillStyle = colors.highlight;
    ctx.globalAlpha = isRepair ? 0.76 : 0.68;

    if (isRepair && motifIndex % 3 === 0) {
      ctx.beginPath();
      ctx.moveTo(x, y + 12);
      ctx.bezierCurveTo(x - 22, y - 3, x - 11, y - 23, x, y - 9);
      ctx.bezierCurveTo(x + 11, y - 23, x + 22, y - 3, x, y + 12);
      ctx.fill();
      ctx.stroke();
      this.drawHandLine(ctx, x - 14, y + 10, x + 14, y - 10, colors.edge, 0.82, seed + 82);
    } else if (isRepair && motifIndex % 3 === 1) {
      for (let i = -2; i <= 2; i += 1) {
        this.drawHandLine(ctx, x - 17, y + i * 5, x + 17, y + i * 5 + (noise(seed + i * 7) - 0.5) * 2, colors.highlight, 0.82, seed + i + 86);
        this.drawHandLine(ctx, x + i * 7, y - 14, x + i * 7 + 3, y - 5, colors.edge, 0.72, seed + i + 92);
      }
      ctx.beginPath();
      ctx.ellipse(x, y, 13, 9, -0.16, 0, Math.PI * 2);
      ctx.stroke();
    } else if (isRepair) {
      for (let i = 0; i < 5; i += 1) {
        const angle = (Math.PI * 2 * i) / 5 + noise(seed + i) * 0.12;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(0, -13, 5.8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(x, y, 5.4, 0, Math.PI * 2);
      ctx.fillStyle = colors.edge;
      ctx.fill();
    } else if (motifIndex === 0) {
      ctx.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const radius = i % 2 === 0 ? 17 : 7;
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 10;
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (motifIndex === 1) {
      this.drawHandLine(ctx, x - 20, y + 8, x + 20, y - 8, colors.edge, 0.95, seed + 101);
      [-10, 0, 10].forEach((offset, index) => {
        ctx.beginPath();
        ctx.ellipse(x + offset - 2, y - offset * 0.28, 6, 11, -0.72, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        this.drawHandLine(ctx, x + offset - 6, y - offset * 0.28, x + offset + 3, y - offset * 0.28 - 7, colors.highlight, 0.55, seed + index + 109);
      });
    } else if (motifIndex === 2) {
      ctx.beginPath();
      ctx.arc(x, y, 17, 0.35 * Math.PI, 1.68 * Math.PI);
      ctx.arc(x + 7, y - 1, 13, 1.66 * Math.PI, 0.38 * Math.PI, true);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      this.drawHandLine(ctx, x - 10, y + 13, x + 14, y - 14, colors.highlight, 0.72, seed + 119);
    } else {
      for (let i = 0; i < 8; i += 1) {
        const angle = (Math.PI * 2 * i) / 8;
        this.drawHandLine(ctx, x, y, x + Math.cos(angle) * 19, y + Math.sin(angle) * 13, colors.edge, 0.75, seed + i + 127);
      }
      ctx.beginPath();
      ctx.ellipse(x, y, 9, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(64, 42, 25, 0.14)';
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.ellipse(
        x - 13 + noise(seed + i + 163) * 26,
        y - 12 + noise(seed + i + 173) * 24,
        1.2 + noise(seed + i + 181) * 1.8,
        0.8 + noise(seed + i + 191) * 1.5,
        noise(seed + i + 199) * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  },

  drawScrollCue(ctx, width, height) {
    if (this.maxScrollY <= 8) return;
    const progress = this.scrollY / this.maxScrollY;
    const trackHeight = 56;
    const y = 130 + (height - 240 - trackHeight) * progress;
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = 'rgba(75, 63, 51, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width - 17, 130);
    ctx.lineTo(width - 17, height - 110);
    ctx.stroke();
    ctx.fillStyle = 'rgba(75, 63, 51, 0.42)';
    ctx.fillRect(width - 19, y, 4, trackHeight);
    ctx.restore();
  },
});
