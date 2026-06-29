const assert = require('assert');

const {
  computeMilestones,
  getDustStage,
  layoutTimelineItems,
  sortForDisplay,
} = require('../miniprogram/utils/timeline');

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-06-23T00:00:00.000Z');

function daysAgo(days) {
  return new Date(NOW - days * DAY).toISOString();
}

function knot(id, days, status = 'open') {
  return {
    _id: id,
    type: 'knot',
    status,
    content: `knot ${id}`,
    createdAt: daysAgo(days),
    resolvedAt: status === 'resolved' ? daysAgo(Math.max(days - 1, 0)) : null,
  };
}

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test('getDustStage returns none for new or resolved knots', () => {
  assert.strictEqual(getDustStage(knot('new', 2), NOW), 'none');
  assert.strictEqual(getDustStage(knot('resolved', 30, 'resolved'), NOW), 'none');
});

test('getDustStage escalates at 3, 7, 14, and 30 days', () => {
  assert.strictEqual(getDustStage(knot('specks', 3), NOW), 'specks');
  assert.strictEqual(getDustStage(knot('dense', 7), NOW), 'dense');
  assert.strictEqual(getDustStage(knot('fibers', 14), NOW), 'fibers');
  assert.strictEqual(getDustStage(knot('web', 30), NOW), 'web');
});

test('computeMilestones creates automatic relationship badges', () => {
  const resolved = Array.from({ length: 10 }, (_, index) =>
    knot(`r${index}`, 80 - index, 'resolved')
  );
  const milestones = computeMilestones({
    events: resolved,
    relationshipStartedAt: daysAgo(101),
    now: NOW,
  });

  assert.deepStrictEqual(
    milestones.map((item) => item.title),
    [
      '初页旧签',
      '两日并肩章',
      '三日墨夹',
      '五日旧票',
      '七日旧章',
      '双周线夹',
      '满月铜章',
      '百日旧徽',
      '第一枚绳结',
      '第一枚和章',
      '十结铜扣',
      '一日平安签',
      '平安旧夹',
    ]
  );
  assert.ok(milestones.every((item) => item.type === 'ornament'));
  assert.ok(milestones.some((item) => item.family === 'checkin'));
  assert.ok(milestones.some((item) => item.family === 'repair'));
});

test('computeMilestones omits peace badge when an open knot exists', () => {
  const milestones = computeMilestones({
    events: [knot('open', 12), knot('resolved', 60, 'resolved')],
    relationshipStartedAt: daysAgo(120),
    now: NOW,
  });

  assert.ok(!milestones.some((item) => item.id === 'ornament-peace-1'));
  assert.ok(!milestones.some((item) => item.id === 'ornament-peace-30'));
});

test('layoutTimelineItems preserves time order and minimum spacing', () => {
  const events = [
    { ...knot('a', 9), anchorY: 160 },
    { ...knot('b', 4), anchorY: 170 },
    { ...knot('c', 1) },
  ];
  const items = layoutTimelineItems({
    events,
    ornaments: [{ id: 'peace-30', type: 'ornament', title: '和平30天', createdAt: daysAgo(0) }],
    topPadding: 120,
    minGap: 132,
  });

  assert.deepStrictEqual(
    items.map((item) => item.id),
    ['a', 'b', 'c', 'peace-30']
  );

  for (let index = 1; index < items.length; index += 1) {
    assert.ok(items[index].y - items[index - 1].y >= 132);
  }
});

test('sortForDisplay places unresolved knots before resolved marks', () => {
  const items = sortForDisplay([
    knot('resolved-old', 80, 'resolved'),
    knot('open-new', 2),
    { id: 'ornament', type: 'ornament', title: '相伴100天', createdAt: daysAgo(30) },
    knot('open-old', 16),
    knot('resolved-new', 4, 'resolved'),
  ]);

  assert.deepStrictEqual(
    items.map((item) => item.id || item._id),
    ['open-old', 'open-new', 'ornament', 'resolved-old', 'resolved-new']
  );
});

test('layoutTimelineItems adds separation before non-open history', () => {
  const items = layoutTimelineItems({
    events: [knot('open', 2), knot('resolved', 20, 'resolved')],
    ornaments: [{ id: 'ornament', type: 'ornament', title: '相伴100天', createdAt: daysAgo(10) }],
    topPadding: 100,
    minGap: 100,
    groupGap: 140,
  });

  assert.deepStrictEqual(
    items.map((item) => item.id),
    ['open', 'ornament', 'resolved']
  );
  assert.strictEqual(items[1].y - items[0].y, 240);
});
