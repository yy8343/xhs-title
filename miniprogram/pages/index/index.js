const gen = require('../../utils/generator.js');
Page({
  data: { topic: '', whoList: ['不限'].concat(gen.WHO), whoIdx: 0, list: [] },
  onTopic(e) { this.setData({ topic: e.detail.value }); },
  onWho(e) { this.setData({ whoIdx: Number(e.detail.value) }); },
  gen() {
    const who = this.data.whoIdx > 0 ? this.data.whoList[this.data.whoIdx] : '';
    this.setData({ list: gen.generate(this.data.topic, who, 10) });
  },
  copy(e) {
    const { text, kind } = e.currentTarget.dataset;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: kind + '已复制', icon: 'success' }),
      fail: () => wx.showToast({ title: '复制失败，请长按文字手动复制', icon: 'none' })
    });
  },
  onShareAppMessage() { return { title: '小红书标题 + 正文生成', path: '/pages/index/index' }; }
});
