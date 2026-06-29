const { createLocalId, normalizeEvent, sortByTime, toIso } = require('../utils/timeline');

const STORAGE_KEY = 'rope-talk-state-v1';
const CURRENT_ROPE_KEY = 'rope-talk-current-rope';
const LOCAL_OPENID_KEY = 'rope-talk-local-openid';

function hasWx() {
  return typeof wx !== 'undefined';
}

function callWx(method, options) {
  return new Promise((resolve, reject) => {
    wx[method]({
      ...(options || {}),
      success: resolve,
      fail: reject,
    });
  });
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

function getLocalState() {
  const state = getStorage(STORAGE_KEY, null);
  if (state && state.ropes) return state;
  return { ropes: {}, events: {} };
}

function saveLocalState(state) {
  setStorage(STORAGE_KEY, state);
}

function ensureLocalRope(ropeId, openid) {
  const state = getLocalState();
  if (!state.ropes[ropeId]) {
    state.ropes[ropeId] = {
      ropeId,
      members: openid ? [openid] : [],
      relationshipStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  } else if (openid && !state.ropes[ropeId].members.includes(openid)) {
    state.ropes[ropeId].members.push(openid);
  }
  if (!state.events[ropeId]) state.events[ropeId] = [];
  saveLocalState(state);
  return state.ropes[ropeId];
}

function upsertLocalEvent(ropeId, event) {
  const state = getLocalState();
  if (!state.ropes[ropeId]) {
    state.ropes[ropeId] = {
      ropeId,
      members: event.createdBy ? [event.createdBy] : [],
      relationshipStartedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  } else if (event.createdBy && !state.ropes[ropeId].members.includes(event.createdBy)) {
    state.ropes[ropeId].members.push(event.createdBy);
  }
  const events = state.events[ropeId] || [];
  const normalized = normalizeEvent(event);
  const index = events.findIndex((item) => (item._id || item.id) === normalized._id);
  if (index >= 0) {
    events[index] = { ...events[index], ...normalized };
  } else {
    events.push(normalized);
  }
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

async function ensureCloudRope(ropeId, openid) {
  if (!hasWx() || !wx.cloud) return null;
  const db = wx.cloud.database();
  const _ = db.command;
  const now = db.serverDate();
  const ref = db.collection('ropes').doc(ropeId);

  try {
    const result = await ref.get();
    await ref.update({
      data: {
        members: _.addToSet(openid),
        updatedAt: now,
      },
    });
    return result.data;
  } catch (error) {
    await ref.set({
      data: {
        ropeId,
        members: [openid],
        relationshipStartedAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
    return {
      ropeId,
      members: [openid],
      relationshipStartedAt: new Date().toISOString(),
    };
  }
}

async function initSession(routeRopeId) {
  const cloudReady = await initCloud();
  const openid = await getOpenId(cloudReady);
  const savedRopeId = getStorage(CURRENT_ROPE_KEY, '');
  const ropeId = routeRopeId || savedRopeId || createLocalId('rope');
  setStorage(CURRENT_ROPE_KEY, ropeId);

  const localRope = ensureLocalRope(ropeId, openid);
  let rope = localRope;
  if (cloudReady) {
    try {
      rope = await ensureCloudRope(ropeId, openid);
    } catch (error) {
      console.warn('cloud rope unavailable, using local rope', error);
    }
  }

  return {
    cloudReady,
    openid,
    ropeId,
    rope: {
      ...localRope,
      ...rope,
      relationshipStartedAt: toIso((rope && rope.relationshipStartedAt) || localRope.relationshipStartedAt),
    },
  };
}

async function loadState(session) {
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

module.exports = {
  confirmResolve,
  createKnot,
  initSession,
  loadState,
  requestResolve,
};
