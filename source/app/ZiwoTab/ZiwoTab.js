var ZiwoTab = function ZiwoTab(es, id) {
  this.id = id | 0;
  this._es = es;
  this.auth = null;
  es.link('ZiwoTab', this.id, this, { prefix: 'On' });
};

ZiwoTab.prototype.OnLoggedTabAppend = function (state, event) {
  state.auth = event.data.auth;
  return state;
};

ZiwoTab.prototype.OnAgentCredentialsFetched = function (state, event) {
  state.agent = event.data;
  return state;
};

ZiwoTab.prototype.OnTabClosed = function (state, event) {
  state._es.deleteHard(event.streamId);
  return state;
};
