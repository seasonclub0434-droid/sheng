const store = require('../../services/rope-store');

Page({
  data: {
    saving: false,
    addRopeMode: '',
    addRopeName: '',
    canCreateRope: false,
  },

  homeSession: null,

  async onLoad() {
    try {
      this.homeSession = await store.loadHomeState();
    } catch (error) {
      console.error(error);
      this.homeSession = {};
    }
  },

  goHome() {
    const pages = typeof getCurrentPages === 'function' ? getCurrentPages() : [];
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.redirectTo({ url: '/pages/index/index' });
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
      await store.createRope(this.homeSession || {}, { name, mode });
      this.setData({ saving: false });
      wx.showToast({ title: '已放进柜子', icon: 'none' });
      this.goHome();
    } catch (error) {
      console.error(error);
      this.setData({ saving: false });
      wx.showToast({ title: '这根绳没放上去', icon: 'none' });
    }
  },
});
