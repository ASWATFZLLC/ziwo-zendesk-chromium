var ZendeskTabs = function (es) {
  this._es = es;
  this.tabs = {};
  es.subscribeCategory('ZendeskTab', this, { state: this, prefix: 'On' });
};

ZendeskTabs.prototype.OnLoggedTabAppend = function (state, event) {
  state.tabs[event.identityId] = new ZendeskTab(state._es, event.identityId);
  return state;
};

ZendeskTabs.prototype.OnTabClosed = function (state, event) {
  delete state.tabs[event.identityId];
  return state;
};
