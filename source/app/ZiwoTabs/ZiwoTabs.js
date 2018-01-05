var ZiwoTabs = function (es) {
  this._es = es;
  this.tabs = {};
  es.subscribeCategory('ZiwoTab', this, { state: this, prefix: 'On' });
};

ZiwoTabs.prototype.OnLoggedTabAppend = function (state, event) {
  state.tabs[event.identityId] = new ZiwoTab(state._es, event.identityId);
  return state;
};

ZiwoTabs.prototype.OnTabClosed = function (state, event) {
  delete state.tabs[event.identityId];
  return state;
};
