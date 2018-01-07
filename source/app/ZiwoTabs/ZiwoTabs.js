var ZiwoTabs = function (es) {
  this._es = es;
  this.tabs = {};
  es.subscribeCategory('ZiwoTab', this, { state: this, prefix: 'On' });
  es.subscribeCategory('ZendeskTab', this, { state: this, prefix: 'OnZendesk' });
};

ZiwoTabs.prototype.OnLoggedTabAppend = function (state, event) {
  state.tabs[event.identityId] = new ZiwoTab(state._es, event.identityId);
  return state;
};

ZiwoTabs.prototype.OnTabClosed = function (state, event) {
  delete state.tabs[event.identityId];
  return state;
};

ZiwoTabs.prototype.OnZendeskClickToCallClicked = function (state, event) {
  for (var tab in state.tabs) break ;
  state.tabs[tab].trigger('Dial', [event.data.number]);
};
