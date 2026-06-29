const {
  computeMilestones,
  daysBetween,
  getDustStage,
  layoutTimelineItems,
  toTime,
} = require('../../utils/timeline');
const store = require('../../services/rope-store');

const ROPE_COLOR = '#ddc8a6';
const ROPE_SHADOW = 'rgba(86, 63, 37, 0.22)';
const ROPE_LIGHT = 'rgba(248, 235, 205, 0.58)';
const ROPE_EDGE = '#b89a72';
const INK = '#342d27';
const PAPER = '#f5eedf';

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
    statusText: '一根共同记下来的绳子',
    events: [],
    showNote: false,
    noteText: '',
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

  async bootstrap(options) {
    try {
      this.session = await store.initSession(options.ropeId);
      await this.reload();
    } catch (error) {
      console.error(error);
      wx.showToast({ title: '手帐暂时打不开', icon: 'none' });
      this.setData({ loading: false });
    }
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
    });
    this.shouldScrollToLatest = true;
    this.render();
  },

  initCanvas() {
    wx.createSelectorQuery()
      .in(this)
      .select('#ropeCanvas')
      .fields({ node: true, size: true })
      .exec((result) => {
        const canvasInfo = result && result[0];
        if (!canvasInfo || !canvasInfo.node) return;

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
    if (!event.touches || !event.touches.length) return;
    this.touchStart = pointFromTouch(event.touches[0]);
    this.moved = false;
  },

  onCanvasTouchMove(event) {
    if (!this.touchStart || !event.touches || !event.touches.length) return;
    const point = pointFromTouch(event.touches[0]);
    const deltaY = point.y - this.touchStart.y;
    if (Math.abs(deltaY) > 3) this.moved = true;
    this.touchStart = point;
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY - deltaY));
    this.render();
  },

  onCanvasTouchEnd(event) {
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

    if (Math.abs(point.x - this.ropeX) <= 54) {
      this.pendingAnchorY = Math.max(120, this.scrollY + point.y);
      this.setData({ showNote: true, noteText: '' });
    }
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
    const canRequest = !isResolved && !request;
    const canAccept = !isResolved && request && request.requestedBy !== this.session.openid;
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
      meta: [formatDate(event.createdAt), dustText].filter(Boolean).join(' · '),
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
    this.setData({ resolveMode: 'request', resolveText: '' });
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
      const updated =
        this.data.resolveMode === 'request'
          ? await store.requestResolve(this.session, selected, text)
          : await store.confirmResolve(this.session, selected, text);

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

    items.forEach((item, index) => {
      const screenY = item.y - this.scrollY;
      if (screenY < -110 || screenY > height + 110) return;
      if (item.type === 'ornament') {
        this.drawOrnament(ctx, item, index, screenY);
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

    for (let i = 0; i < 130; i += 1) {
      const x = noise(i + 3) * width;
      const y = noise(i + 19) * height;
      const alpha = 0.04 + noise(i + 29) * 0.05;
      ctx.fillStyle = `rgba(78, 63, 45, ${alpha})`;
      ctx.fillRect(x, y, 0.7 + noise(i + 31) * 1.2, 0.7 + noise(i + 41) * 1.2);
    }
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
    ctx.fillStyle = 'rgba(69, 46, 28, 0.78)';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.resolvedNoteDate(item), 0, -3);
    ctx.font = 'bold 8px sans-serif';
    ctx.fillStyle = 'rgba(91, 64, 39, 0.52)';
    ctx.fillText('解开', 0, 12);
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

  drawOrnament(ctx, item, index, y) {
    const side = this.itemSide(index);
    const x = this.ropeX + side * 68;
    const seed = toTime(item.createdAt) / 100000;
    const palettes = {
      paper: ['#c2a879', '#7c603a', 'rgba(246, 226, 181, 0.44)'],
      brass: ['#b98d45', '#70502a', 'rgba(245, 213, 139, 0.42)'],
      copper: ['#a96742', '#633922', 'rgba(235, 169, 110, 0.38)'],
      wax: ['#9d4f46', '#63302c', 'rgba(245, 173, 153, 0.34)'],
      sage: ['#9a9b76', '#5c5d42', 'rgba(223, 222, 163, 0.34)'],
      ink: ['#6b6258', '#38322d', 'rgba(197, 184, 166, 0.3)'],
    };
    const colors = palettes[item.tone || 'paper'] || palettes.paper;
    const isRepair = item.family === 'repair';

    this.drawHandLine(ctx, this.ropeX, y - 5, x, y - 22, 'rgba(82, 68, 51, 0.45)', 1.1, seed + 2);
    ctx.save();
    ctx.fillStyle = colors[0];
    ctx.strokeStyle = colors[1];
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
      ctx.strokeStyle = colors[2];
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x - 1, y - 4, 15, 12, -0.18, 0, Math.PI * 2);
      ctx.stroke();
      this.drawHandLine(ctx, x - 15, y + 12, x + 16, y - 11, colors[1], 0.85, seed + 41);
      this.drawHandLine(ctx, x - 13, y - 11, x + 15, y + 10, colors[2], 0.65, seed + 47);
    } else {
      const width = item.mark && item.mark.length > 2 ? 58 : 50;
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
      this.drawHandLine(ctx, x - width * 0.28, y + 11, x + width * 0.28, y + 8, colors[2], 0.62, seed + 33);
    }

    ctx.fillStyle = colors[1];
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.mark || item.title.slice(0, 2), x, y - 5, 44);
    ctx.font = '9px sans-serif';
    ctx.fillText(isRepair ? '解结' : '打卡', x, y + 12, 40);
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
