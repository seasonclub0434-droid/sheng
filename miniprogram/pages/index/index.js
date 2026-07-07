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
    safeTop: 0,
    loading: true,
    saving: false,
    viewMode: 'login',
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
    statusText: '一根共同记下来的绳子',
    events: [],
    showNote: false,
    noteText: '',
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
  touchStart: null,
  moved: false,
  pendingAnchorY: 180,
  shouldScrollToLatest: true,

  onLoad(options) {
    const info = wx.getSystemInfoSync();
    const safeTop = info.safeArea ? Math.max(info.safeArea.top - 6, 0) : 0;
    this.setData({
      canvasWidth: info.windowWidth,
      canvasHeight: info.windowHeight,
      safeTop,
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
      path: `/pages/index/index?ropeId=${ropeId}`,
    };
  },

  noop() {},

  setDataAsync(data) {
    return new Promise((resolve) => this.setData(data, resolve));
  },

  buildHomeRows(ropes) {
    const rows = Math.max(4, Math.ceil((ropes || []).length / 2));
    return Array.from({ length: rows }, (_, rowIndex) => {
      const slots = [0, 1].map((slotIndex) => {
        const rope = (ropes || [])[rowIndex * 2 + slotIndex];
        if (!rope) return { slotKey: `empty-${rowIndex}-${slotIndex}` };
        return {
          slotKey: rope.ropeId,
          ropeId: rope.ropeId,
          name: rope.name,
          mode: rope.mode,
          openCount: rope.openCount || 0,
          resolvedCount: rope.resolvedCount || 0,
          noteTone: (rowIndex * 2 + slotIndex) % 4,
        };
      });
      return { rowIndex, slots };
    });
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
      title: item.type === 'ornament'
        ? `印章 · ${item.title}`
        : item.status === 'resolved'
          ? `解开 · ${item.content || '一个结'}`
          : `记下 · ${item.content || '一个结'}`,
      y: item.y || item.anchorY || 0,
    }));
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
        title: event.status === 'resolved' ? '已解开的结' : '记下的结',
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

  async goHome() {
    this.session = null;
    this.canvas = null;
    this.ctx = null;
    this.scrollY = 0;
    this.setData({
      viewMode: 'home',
      showNote: false,
      showDetail: false,
      showNotebook: false,
      exchangeOpen: false,
      timelineOpen: false,
      settingsOpen: false,
      globalSearchOpen: false,
      addRopeMode: '',
      addRopeName: '',
      canCreateRope: false,
    });
    await this.reloadHome('home');
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
    if (!this.data.canCreateRope) return;
    this.setData({ saving: true });
    try {
      await store.createRope(this.homeSession || {}, {
        name: this.data.addRopeName.trim(),
        mode: this.data.addRopeMode,
      });
      this.setData({ saving: false });
      await this.reloadHome('home');
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
    this.setData({ timelineOpen: !this.data.timelineOpen });
  },

  closeTimelineDock() {
    this.setData({ timelineOpen: false });
  },

  selectTimelineItem(event) {
    const eventId = event.currentTarget.dataset.eventId;
    const selectedTimelineId = this.data.selectedTimelineId === eventId ? '' : eventId;
    this.setData({ selectedTimelineId });
  },

  toggleExchangeDock() {
    this.setData({ exchangeOpen: !this.data.exchangeOpen });
  },

  openWriteKnot() {
    if (!this.session || !this.session.ropeId) return;
    this.pendingAnchorY = this.scrollY + Math.round(this.data.canvasHeight * 0.76);
    this.setData({ showNote: true, noteText: '', exchangeOpen: false });
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
    this.setData({ showNotebook: false, notebookSearchText: '', notebookItems: [] });
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
      if (options.ropeId) {
        await this.enterRope(options.ropeId);
        return;
      }
      await this.reloadHome();
    } catch (error) {
      console.error(error);
      wx.showToast({ title: '手帐暂时打不开', icon: 'none' });
      this.setData({ loading: false });
    }
  },

  async reloadHome(nextViewMode) {
    const home = await store.loadHomeState();
    const rows = this.buildHomeRows(home.ropes);
    this.homeSession = home;
    this.setData({
      loading: false,
      viewMode: nextViewMode || this.data.viewMode || 'login',
      homeRopes: home.ropes,
      homeRows: rows,
      globalSearchResults: this.buildGlobalSearchResults(this.data.globalSearchText, home.ropes),
    });
  },

  async reload() {
    if (!this.session) return;
    const state = await store.loadState(this.session);
    const relationshipStartedAt = state.rope.relationshipStartedAt;
    this.session.rope = state.rope;
    this.setData({
      loading: false,
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

    if (!events.length) return '一根共同记下来的绳子';
    if (openCount) return `${openCount}个结还在，${resolvedCount}个已经解开`;
    if (days >= 30) return `安静相伴${days}天`;
    return `${resolvedCount}个结已经变成印记`;
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
    this.render();
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

  findHitItem(x, y) {
    for (let index = this.layoutItems.length - 1; index >= 0; index -= 1) {
      const item = this.layoutItems[index];
      const screenY = item.y - this.scrollY;
      if (screenY < -80 || screenY > this.data.canvasHeight + 80) continue;
      const side = this.itemSide(index);
      const ornamentX = this.ropeX + side * 68;
      const note = item.status === 'resolved' ? this.resolvedNoteCenter(item, screenY, index) : null;
      const hitX = item.type === 'ornament' ? ornamentX : note ? note.x : this.ropeX;
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

  closeNote() {
    this.setData({ showNote: false, noteText: '' });
  },

  onNoteInput(event) {
    this.setData({ noteText: event.detail.value });
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
      });
      const events = this.replaceEvent(event);
      this.setData({
        events,
        saving: false,
        showNote: false,
        noteText: '',
        statusText: this.buildStatusText(events, this.session.rope.relationshipStartedAt),
        statsItems: this.buildStatsItems(events, this.session.rope.relationshipStartedAt),
        recordTimelineItems: this.buildRecordTimelineItems(events, this.session.rope.relationshipStartedAt),
        notebookItems: this.buildNotebookItems(events, this.data.notebookSearchText),
      });
      this.shouldScrollToLatest = true;
      this.render();
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
    });
  },

  buildSelectedState(event) {
    const request = event.resolveRequest || null;
    const isResolved = event.status === 'resolved';
    const isRequester = Boolean(request && request.requestedBy === this.session.openid);
    const canRequest = !isResolved;
    const canAccept = false;
    const dustStage = getDustStage(event, Date.now());
    const dustText = {
      none: '',
      specks: '有一点灰',
      dense: '灰尘变密了',
      fibers: '长出细细绒毛',
      web: '结旁挂起蛛网',
    }[dustStage];

    return {
      title: isResolved ? '一个淡淡的印记' : '一个还没解开的结',
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
      });
      this.render();
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
    });

    this.drawScrollCue(ctx, width, height);
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

  drawRope(ctx, width, height) {
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
    this.strokeBuiltPath(ctx, buildPath, ROPE_SHADOW, width + 4.6, 0.42, 2.6, 2.4);
    this.strokeBuiltPath(ctx, buildPath, ROPE_EDGE, width + 2.1, 0.92);
    this.strokeBuiltPath(ctx, buildPath, ROPE_COLOR, width, 1);
    this.strokeBuiltPath(ctx, buildPath, ROPE_LIGHT, Math.max(1.15, width * 0.19), 0.58, -1.7, -1.3);
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
    const side = this.itemSide(index);
    return {
      x: this.ropeX + side * (38 + noise(seed + 8) * 5),
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
    this.drawStickyTape(ctx, this.ropeX, y, note.x, note.y, note.side, note.seed);
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
    const x = this.ropeX + side * 68;
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

    this.drawHandLine(ctx, this.ropeX, y - 5, x, y - 22, colors.cord, 1.1, seed + 2);
    this.drawHandLine(ctx, this.ropeX - side * 2, y - 3, x + side * 9, y - 20, colors.cordHighlight, 0.58, seed + 8);
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
