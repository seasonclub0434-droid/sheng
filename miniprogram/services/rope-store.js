const { createLocalId, normalizeEvent, sortByTime, toIso } = require('../utils/timeline');

const STORAGE_KEY = 'rope-talk-state-v2';
const LEGACY_STORAGE_KEY = 'rope-talk-state-v1';
const CURRENT_ROPE_KEY = 'rope-talk-current-rope';
const LOCAL_OPENID_KEY = 'rope-talk-local-openid';

function hasWx() {
  return typeof wx !== 'undefined';
}

function getStorage(key, fallback) {
  if (!hasWx()) return fallback;
  try {
    const value = wx.getStorageSync(key);
    return value || fallback;
  } catch (error) {
    return fallback;
  }
}

function setStorage(key, value) {
  if (!hasWx()) return;
  try {
    wx.setStorageSync(key, value);
  } catch (error) {
    console.warn('set storage failed', error);
  }
}

function removeStorage(key) {
  if (!hasWx()) return;
  try {
    wx.removeStorageSync(key);
  } catch (error) {
    console.warn('remove storage failed', error);
  }
}

function normalizeLocalState(raw) {
  const state = raw && typeof raw === 'object' ? raw : {};
  const ropes = state.ropes && typeof state.ropes === 'object' ? state.ropes : {};
  const events = state.events && typeof state.events === 'object' ? state.events : {};

  Object.keys(ropes).forEach((ropeId) => {
    const rope = ropes[ropeId] || {};
    ropes[ropeId] = {
      ropeId: rope.ropeId || rope.id || ropeId,
      id: rope.id || rope.ropeId || ropeId,
      name: rope.name || rope.title || '未命名绳',
      mode: rope.mode || 'single',
      members: Array.isArray(rope.members) ? rope.members : [],
      relationshipStartedAt: toIso(rope.relationshipStartedAt || rope.createdAt || Date.now()),
      createdAt: toIso(rope.createdAt || rope.relationshipStartedAt || Date.now()),
      updatedAt: toIso(rope.updatedAt || rope.createdAt || Date.now()),
    };
    if (!Array.isArray(events[ropeId])) events[ropeId] = [];
  });

  return { ropes, events };
}

function getLocalState() {
  const state = getStorage(STORAGE_KEY, null);
  if (state && state.ropes) return normalizeLocalState(state);

  const legacy = getStorage(LEGACY_STORAGE_KEY, null);
  if (legacy && legacy.ropes) {
    const normalized = normalizeLocalState(legacy);
    saveLocalState(normalized);
    return normalized;
  }

  return { ropes: {}, events: {} };
}

function saveLocalState(state) {
  setStorage(STORAGE_KEY, normalizeLocalState(state));
}

function toHomeRope(rope, events) {
  const ropeEvents = Array.isArray(events) ? events : [];
  const openCount = ropeEvents.filter((event) => event.type === 'knot' && event.status !== 'resolved').length;
  const resolvedCount = ropeEvents.filter((event) => event.type === 'knot' && event.status === 'resolved').length;
  return {
    id: rope.ropeId,
    ropeId: rope.ropeId,
    name: rope.name || '未命名绳',
    mode: rope.mode || 'single',
    createdAt: rope.createdAt,
    openCount,
    resolvedCount,
  };
}

function upsertLocalRope(rope, openid) {
  const state = getLocalState();
  const ropeId = rope.ropeId || rope.id || createLocalId('rope');
  const current = state.ropes[ropeId] || {};
  const members = Array.isArray(current.members) ? current.members.slice() : [];
  if (openid && !members.includes(openid)) members.push(openid);

  state.ropes[ropeId] = {
    ...current,
    ropeId,
    id: ropeId,
    name: rope.name || current.name || '未命名绳',
    mode: rope.mode || current.mode || 'single',
    members,
    relationshipStartedAt: toIso(rope.relationshipStartedAt || current.relationshipStartedAt || Date.now()),
    createdAt: toIso(rope.createdAt || current.createdAt || Date.now()),
    updatedAt: toIso(rope.updatedAt || Date.now()),
  };
  if (!Array.isArray(state.events[ropeId])) state.events[ropeId] = [];
  saveLocalState(state);
  return state.ropes[ropeId];
}

function ensureLocalRope(ropeId, openid, defaults) {
  const state = getLocalState();
  const existing = state.ropes[ropeId];
  if (existing) return upsertLocalRope(existing, openid);

  return upsertLocalRope({
    ropeId,
    name: defaults && defaults.name ? defaults.name : '未命名绳',
    mode: defaults && defaults.mode ? defaults.mode : 'single',
    relationshipStartedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  }, openid);
}

function upsertLocalEvent(ropeId, event) {
  const state = getLocalState();
  if (!state.ropes[ropeId]) {
    state.ropes[ropeId] = {
      ropeId,
      id: ropeId,
      name: '未命名绳',
      mode: 'single',
      members: event.createdBy ? [event.createdBy] : [],
      relationshipStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  } else if (event.createdBy && !state.ropes[ropeId].members.includes(event.createdBy)) {
    state.ropes[ropeId].members.push(event.createdBy);
  }

  const events = state.events[ropeId] || [];
  const normalized = normalizeEvent(event);
  const index = events.findIndex((item) => (item._id || item.id) === normalized._id);
  if (index >= 0) events[index] = { ...events[index], ...normalized };
  else events.push(normalized);
  state.events[ropeId] = sortByTime(events);
  saveLocalState(state);
  return normalized;
}

function updateLocalEvent(ropeId, eventId, updater) {
  const state = getLocalState();
  const events = state.events[ropeId] || [];
  const index = events.findIndex((item) => (item._id || item.id) === eventId);
  if (index < 0) return null;
  const updated = normalizeEvent(updater(events[index]));
  events[index] = updated;
  state.events[ropeId] = sortByTime(events);
  saveLocalState(state);
  return updated;
}

async function initCloud() {
  const app = hasWx() && typeof getApp === 'function' ? getApp() : null;
  if (app && app.globalData && app.globalData.cloudReady) return true;
  if (!hasWx() || !wx.cloud) return false;

  try {
    wx.cloud.init({ traceUser: true });
    if (app && app.globalData) app.globalData.cloudReady = true;
    return true;
  } catch (error) {
    return false;
  }
}

async function getOpenId(cloudReady) {
  const localOpenid = getStorage(LOCAL_OPENID_KEY, '');
  if (cloudReady && hasWx() && wx.cloud) {
    try {
      const result = await wx.cloud.callFunction({ name: 'login' });
      const openid = result && result.result && result.result.openid;
      if (openid) {
        setStorage(LOCAL_OPENID_KEY, openid);
        return openid;
      }
    } catch (error) {
      console.warn('login cloud function unavailable, using local id', error);
    }
  }

  if (localOpenid) return localOpenid;
  const generated = createLocalId('local-user');
  setStorage(LOCAL_OPENID_KEY, generated);
  return generated;
}

async function ensureCloudRope(rope, openid) {
  if (!hasWx() || !wx.cloud) return null;
  const db = wx.cloud.database();
  const _ = db.command;
  const now = db.serverDate();
  const ref = db.collection('ropes').doc(rope.ropeId);

  try {
    const result = await ref.get();
    await ref.update({
      data: {
        name: rope.name,
        mode: rope.mode,
        members: _.addToSet(openid),
        updatedAt: now,
      },
    });
    return result.data;
  } catch (error) {
    await ref.set({
      data: {
        ropeId: rope.ropeId,
        name: rope.name,
        mode: rope.mode,
        members: [openid],
        relationshipStartedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
    return rope;
  }
}

async function loadHomeState() {
  const cloudReady = await initCloud();
  const openid = await getOpenId(cloudReady);
  const state = getLocalState();
  const ropes = Object.keys(state.ropes)
    .map((ropeId) => toHomeRope(state.ropes[ropeId], state.events[ropeId]))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
  const savedRopeId = getStorage(CURRENT_ROPE_KEY, '');
  const activeRopeId = ropes.some((rope) => rope.ropeId === savedRopeId)
    ? savedRopeId
    : ropes[0]
      ? ropes[0].ropeId
      : '';

  if (activeRopeId) setStorage(CURRENT_ROPE_KEY, activeRopeId);
  return { cloudReady, openid, ropes, activeRopeId };
}

async function createRope(session, payload) {
  const cloudReady = session && session.cloudReady != null ? session.cloudReady : await initCloud();
  const openid = session && session.openid ? session.openid : await getOpenId(cloudReady);
  const now = new Date().toISOString();
  const rope = {
    ropeId: createLocalId('rope'),
    name: payload.name,
    mode: payload.mode || 'single',
    members: openid ? [openid] : [],
    relationshipStartedAt: now,
    createdAt: now,
    updatedAt: now,
  };

  upsertLocalRope(rope, openid);
  setStorage(CURRENT_ROPE_KEY, rope.ropeId);

  if (cloudReady) {
    try {
      await ensureCloudRope(rope, openid);
    } catch (error) {
      console.warn('create cloud rope failed, using local rope', error);
    }
  }

  return toHomeRope(rope, []);
}

async function initSession(routeRopeId) {
  const home = await loadHomeState();
  const ropeId = routeRopeId || home.activeRopeId;
  if (!ropeId) {
    return {
      cloudReady: home.cloudReady,
      openid: home.openid,
      ropeId: '',
      rope: null,
    };
  }

  setStorage(CURRENT_ROPE_KEY, ropeId);
  const localRope = ensureLocalRope(ropeId, home.openid);
  let rope = localRope;
  if (home.cloudReady) {
    try {
      rope = await ensureCloudRope(localRope, home.openid);
    } catch (error) {
      console.warn('cloud rope unavailable, using local rope', error);
    }
  }

  return {
    cloudReady: home.cloudReady,
    openid: home.openid,
    ropeId,
    rope: {
      ...localRope,
      ...rope,
      relationshipStartedAt: toIso((rope && rope.relationshipStartedAt) || localRope.relationshipStartedAt),
    },
  };
}

async function setCurrentRope(ropeId) {
  setStorage(CURRENT_ROPE_KEY, ropeId);
  return initSession(ropeId);
}

async function loadState(session) {
  if (!session || !session.ropeId) {
    return { rope: null, events: [] };
  }

  const localState = getLocalState();
  const localRope = ensureLocalRope(session.ropeId, session.openid);
  let rope = localRope;
  let events = localState.events[session.ropeId] || [];

  if (session.cloudReady && hasWx() && wx.cloud) {
    try {
      const db = wx.cloud.database();
      const ropeResult = await db.collection('ropes').doc(session.ropeId).get();
      const eventsResult = await db
        .collection('rope_events')
        .where({ ropeId: session.ropeId })
        .orderBy('createdAt', 'asc')
        .limit(100)
        .get();

      rope = ropeResult.data || rope;
      events = (eventsResult.data || []).map((event) => upsertLocalEvent(session.ropeId, event));
    } catch (error) {
      console.warn('load cloud state failed, using local cache', error);
    }
  }

  return {
    rope: {
      ...rope,
      relationshipStartedAt: toIso(rope.relationshipStartedAt),
    },
    events: sortByTime(events.map(normalizeEvent)),
  };
}

async function createKnot(session, payload) {
  const now = new Date().toISOString();
  const event = {
    _id: createLocalId('knot'),
    ropeId: session.ropeId,
    type: 'knot',
    status: 'open',
    content: payload.content,
    anchorY: payload.anchorY,
    createdBy: session.openid,
    createdAt: now,
    updatedAt: now,
    resolveRequest: null,
  };

  if (session.cloudReady && hasWx() && wx.cloud) {
    try {
      const db = wx.cloud.database();
      const cloudEvent = {
        ...event,
        createdAt: db.serverDate(),
        updatedAt: db.serverDate(),
      };
      delete cloudEvent._id;
      const result = await db.collection('rope_events').add({ data: cloudEvent });
      event._id = result._id;
    } catch (error) {
      console.warn('create cloud knot failed, storing locally', error);
    }
  }

  return upsertLocalEvent(session.ropeId, event);
}

async function requestResolve(session, event, line) {
  const now = new Date().toISOString();
  const resolveRequest = {
    requestedBy: session.openid,
    requestedAt: now,
    requesterLine: line || '',
  };

  if (session.cloudReady && hasWx() && wx.cloud && event._id) {
    try {
      const db = wx.cloud.database();
      await db.collection('rope_events').doc(event._id).update({
        data: {
          resolveRequest: {
            ...resolveRequest,
            requestedAt: db.serverDate(),
          },
          updatedAt: db.serverDate(),
        },
      });
    } catch (error) {
      console.warn('request resolve cloud update failed', error);
    }
  }

  return updateLocalEvent(session.ropeId, event._id || event.id, (item) => ({
    ...item,
    resolveRequest,
    updatedAt: now,
  }));
}

async function confirmResolve(session, event, line) {
  const now = new Date().toISOString();
  const resolveRequest = {
    ...(event.resolveRequest || {}),
    acceptedBy: session.openid,
    acceptedAt: now,
    accepterLine: line || '',
  };

  if (session.cloudReady && hasWx() && wx.cloud && event._id) {
    try {
      const db = wx.cloud.database();
      await db.collection('rope_events').doc(event._id).update({
        data: {
          status: 'resolved',
          resolvedAt: db.serverDate(),
          resolveRequest: {
            ...resolveRequest,
            acceptedAt: db.serverDate(),
          },
          updatedAt: db.serverDate(),
        },
      });
    } catch (error) {
      console.warn('confirm resolve cloud update failed', error);
    }
  }

  return updateLocalEvent(session.ropeId, event._id || event.id, (item) => ({
    ...item,
    status: 'resolved',
    resolvedAt: now,
    resolveRequest,
    updatedAt: now,
  }));
}

async function resetAll() {
  removeStorage(STORAGE_KEY);
  removeStorage(LEGACY_STORAGE_KEY);
  removeStorage(CURRENT_ROPE_KEY);
}

module.exports = {
  confirmResolve,
  createKnot,
  createRope,
  initSession,
  loadHomeState,
  loadState,
  requestResolve,
  resetAll,
  setCurrentRope,
};
