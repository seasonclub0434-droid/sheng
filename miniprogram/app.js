App({
  globalData: {
    cloudReady: false,
  },

  onLaunch() {
    if (!wx.cloud) return;

    try {
      wx.cloud.init({
        traceUser: true,
      });
      this.globalData.cloudReady = true;
    } catch (error) {
      this.globalData.cloudReady = false;
      console.warn('cloud init failed, local storage fallback enabled', error);
    }
  },
});
