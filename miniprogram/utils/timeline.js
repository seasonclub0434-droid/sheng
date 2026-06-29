const DAY_MS = 24 * 60 * 60 * 1000;

function toTime(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function toIso(value) {
  const time = toTime(value);
  return time ? new Date(time).toISOString() : new Date().toISOString();
}

function daysBetween(start, end) {
  const startTime = toTime(start);
  const endTime = toTime(end || Date.now());
  if (!startTime || !endTime || endTime < startTime) return 0;
  return Math.floor((endTime - startTime) / DAY_MS);
}

function getDustStage(event, now) {
  if (!event || event.type !== 'knot' || event.status === 'resolved') return 'none';

  const ageDays = daysBetween(event.createdAt, now);
  if (ageDays >= 30) return 'web';
  if (ageDays >= 14) return 'fibers';
  if (ageDays >= 7) return 'dense';
  if (ageDays >= 3) return 'specks';
  return 'none';
}

const MILESTONE_NODES = [
  { id: 'days-1', kind: 'days', family: 'checkin', threshold: 1, title: '初页旧签', mark: '1', subtitleOptions: ['第一页被轻轻翻开', '第一天的纸页还带着暖意', '把开始这件事夹进绳里'], tone: 'paper' },
  { id: 'days-2', kind: 'days', family: 'checkin', threshold: 2, title: '两日并肩章', mark: '2', subtitleOptions: ['第二天也并肩留在这里', '两页纸靠得很近', '第一段并肩的小折痕'], tone: 'brass' },
  { id: 'days-3', kind: 'days', family: 'checkin', threshold: 3, title: '三日墨夹', mark: '3', subtitleOptions: ['三天的墨迹慢慢干了', '第三页开始有了手帐味', '小小三日，被旧夹收好'], tone: 'paper' },
  { id: 'days-5', kind: 'days', family: 'checkin', threshold: 5, title: '五日旧票', mark: '5', subtitleOptions: ['第五天像一张旧票根', '五个早晚被压成纸纹', '小段旅程有了第一张票'], tone: 'copper' },
  { id: 'days-7', kind: 'days', family: 'checkin', threshold: 7, title: '七日旧章', mark: '7', subtitleOptions: ['一起走过第一周', '第一圈旧线轻轻收好', '七天的风被夹进纸页'], tone: 'brass' },
  { id: 'days-14', kind: 'days', family: 'checkin', threshold: 14, title: '双周线夹', mark: '14', subtitleOptions: ['两周被细线轻轻夹住', '十四天的纸边有了旧色', '把第二周也收进手帐'], tone: 'sage' },
  { id: 'days-30', kind: 'days', family: 'checkin', threshold: 30, title: '满月铜章', mark: '30', subtitleOptions: ['一个月的小旧页', '满月时把心事压成铜色', '三十天的日光落在绳上'], tone: 'copper' },
  { id: 'days-100', kind: 'days', family: 'checkin', threshold: 100, title: '百日旧徽', mark: '100', subtitleOptions: ['百日绳记', '一百天的褶皱都算数', '把一百个早晚夹成旧徽'], tone: 'wax' },
  { id: 'first-knot', kind: 'knot', family: 'checkin', threshold: 1, title: '第一枚绳结', mark: '记', subtitleOptions: ['第一次把心事系在绳上', '第一枚绳结有了自己的页脚', '从这里开始，绳子也会听你们说话'], tone: 'paper' },
  { id: 'resolved-1', kind: 'resolved', family: 'repair', threshold: 1, title: '第一枚和章', mark: '和', subtitleOptions: ['第一次把结解开', '把那句柔软的话留在这里', '第一个结变成了浅浅印记'], tone: 'wax' },
  { id: 'resolved-10', kind: 'resolved', family: 'repair', threshold: 10, title: '十结铜扣', mark: '10', subtitleOptions: ['第十次和好', '十个结都没有把绳子拧断', '铜扣收住了十次认真靠近'], tone: 'ink' },
  { id: 'peace-1', kind: 'peace', family: 'checkin', threshold: 1, title: '一日平安签', mark: '安', subtitleOptions: ['第一天平稳地过去了', '没有新结的一页很轻', '把今天的安静夹起来'], tone: 'sage' },
  { id: 'peace-30', kind: 'peace', family: 'checkin', threshold: 30, title: '平安旧夹', mark: '安', subtitleOptions: ['安静相守三十天', '三十天没有新结，纸页很轻', '把平稳的日子夹成旧票根'], tone: 'sage' },
];

function pickMilestoneSubtitle(node, createdAt) {
  const options = node.subtitleOptions || [];
  if (!options.length) return '绳子自动记下的一枚旧徽章。';
  const seed = `${node.id}:${node.kind}:${node.threshold}:${createdAt}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return options[hash % options.length];
}

function createMilestone(node, createdAt) {
  return {
    id: `ornament-${node.id}`,
    type: 'ornament',
    family: node.family || (node.kind === 'resolved' ? 'repair' : 'checkin'),
    title: node.title,
    mark: node.mark,
    subtitle: pickMilestoneSubtitle(node, createdAt),
    createdAt,
    tone: node.tone,
  };
}

function normalizeEvent(event) {
  const id = event.id || event._id || `event-${toTime(event.createdAt)}`;
  return {
    ...event,
    id,
    _id: event._id || id,
    status: event.status || 'open',
    createdAt: toIso(event.createdAt),
  };
}

function sortByTime(items) {
  return items.slice().sort((a, b) => {
    const diff = toTime(a.createdAt) - toTime(b.createdAt);
    if (diff !== 0) return diff;
    return String(a.id || a._id || '').localeCompare(String(b.id || b._id || ''));
  });
}

function sortForDisplay(items) {
  return sortByTime(items);
}

function computeMilestones(options) {
  const events = (options && options.events ? options.events : []).map(normalizeEvent);
  const now = options && options.now ? options.now : Date.now();
  const relationshipStartedAt =
    options && options.relationshipStartedAt
      ? options.relationshipStartedAt
      : events.length
        ? sortByTime(events)[0].createdAt
        : now;

  const resolvedKnots = sortByTime(events.filter((event) => event.type === 'knot' && event.status === 'resolved'));
  const knotEvents = sortByTime(events.filter((event) => event.type === 'knot'));
  const openKnots = knotEvents.filter((event) => event.status !== 'resolved');
  const relationshipDays = daysBetween(relationshipStartedAt, now);

  return MILESTONE_NODES.flatMap((node) => {
    if (node.kind === 'days') {
      if (relationshipDays < node.threshold) return [];
      const createdAt = new Date(toTime(relationshipStartedAt) + node.threshold * DAY_MS).toISOString();
      return [createMilestone(node, createdAt)];
    }

    if (node.kind === 'knot') {
      if (knotEvents.length < node.threshold) return [];
      const source = knotEvents[node.threshold - 1];
      return [createMilestone(node, source.createdAt)];
    }

    if (node.kind === 'resolved') {
      if (resolvedKnots.length < node.threshold) return [];
      const source = resolvedKnots[node.threshold - 1];
      const createdAt = source.resolvedAt ? toIso(source.resolvedAt) : source.createdAt;
      return [createMilestone(node, createdAt)];
    }

    if (node.kind === 'peace') {
      const peaceStart = knotEvents.length ? knotEvents[knotEvents.length - 1].createdAt : relationshipStartedAt;
      if (openKnots.length || daysBetween(peaceStart, now) < node.threshold) return [];
      const createdAt = new Date(toTime(peaceStart) + node.threshold * DAY_MS).toISOString();
      return [createMilestone(node, createdAt)];
    }

    return [];
  });
}

function layoutTimelineItems(options) {
  const events = (options && options.events ? options.events : []).map(normalizeEvent);
  const ornaments = options && options.ornaments ? options.ornaments : [];
  const topPadding = options && options.topPadding != null ? options.topPadding : 132;
  const minGap = options && options.minGap != null ? options.minGap : 148;
  const baseItems = sortForDisplay(events.concat(ornaments)).map((item) => ({
    ...item,
    id: item.id || item._id,
    event: item.type === 'ornament' ? null : item,
  }));

  let cursor = topPadding;
  return baseItems.map((item) => {
    const preferred = Number(item.anchorY || item.y || cursor);
    const y = Math.max(preferred, cursor);
    cursor = y + minGap;
    return {
      ...item,
      y,
    };
  });
}

function createLocalId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

module.exports = {
  DAY_MS,
  computeMilestones,
  createLocalId,
  daysBetween,
  getDustStage,
  layoutTimelineItems,
  normalizeEvent,
  sortForDisplay,
  sortByTime,
  toIso,
  toTime,
};
