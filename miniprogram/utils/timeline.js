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

function displayPriority(item) {
  if (item && item.type === 'knot' && item.status !== 'resolved') return 0;
  if (item && item.type === 'knot' && item.status === 'resolved') return 2;
  return 1;
}

function sortForDisplay(items) {
  return items.slice().sort((a, b) => {
    const priorityDiff = displayPriority(a) - displayPriority(b);
    if (priorityDiff !== 0) return priorityDiff;

    const diff = toTime(a.createdAt) - toTime(b.createdAt);
    if (diff !== 0) return diff;
    return String(a.id || a._id || '').localeCompare(String(b.id || b._id || ''));
  });
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

  const resolvedKnots = events.filter((event) => event.type === 'knot' && event.status === 'resolved');
  const openKnots = events.filter((event) => event.type === 'knot' && event.status !== 'resolved');
  const milestones = [];

  if (daysBetween(relationshipStartedAt, now) >= 100) {
    milestones.push({
      id: 'ornament-days-100',
      type: 'ornament',
      title: '相伴100天',
      subtitle: '第100天',
      createdAt: new Date(toTime(relationshipStartedAt) + 100 * DAY_MS).toISOString(),
      tone: 'cream',
    });
  }

  if (resolvedKnots.length >= 10) {
    const tenthResolved = sortByTime(resolvedKnots)[9];
    milestones.push({
      id: 'ornament-resolved-10',
      type: 'ornament',
      title: '解开10个结',
      subtitle: '第10次和好',
      createdAt: tenthResolved.resolvedAt ? toIso(tenthResolved.resolvedAt) : tenthResolved.createdAt,
      tone: 'sage',
    });
  }

  const knots = events.filter((event) => event.type === 'knot');
  const latestKnot = sortByTime(knots).pop();
  const peaceStart = latestKnot ? latestKnot.createdAt : relationshipStartedAt;
  if (!openKnots.length && daysBetween(peaceStart, now) >= 30) {
    milestones.push({
      id: 'ornament-peace-30',
      type: 'ornament',
      title: '和平30天',
      subtitle: '轻轻放过彼此',
      createdAt: new Date(toTime(peaceStart) + 30 * DAY_MS).toISOString(),
      tone: 'blue',
    });
  }

  return milestones;
}

function layoutTimelineItems(options) {
  const events = (options && options.events ? options.events : []).map(normalizeEvent);
  const ornaments = options && options.ornaments ? options.ornaments : [];
  const topPadding = options && options.topPadding != null ? options.topPadding : 132;
  const minGap = options && options.minGap != null ? options.minGap : 148;
  const groupGap = options && options.groupGap != null ? options.groupGap : 176;

  const baseItems = sortForDisplay(events.concat(ornaments)).map((item) => ({
    ...item,
    id: item.id || item._id,
    event: item.type === 'ornament' ? null : item,
  }));

  let cursor = topPadding;
  let previousPriority = null;
  return baseItems.map((item) => {
    const priority = displayPriority(item);
    if (previousPriority !== null && priority !== previousPriority) {
      cursor += groupGap;
    }
    const preferred = Number(item.anchorY || item.y || cursor);
    const y = Math.max(preferred, cursor);
    cursor = y + minGap;
    previousPriority = priority;
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
