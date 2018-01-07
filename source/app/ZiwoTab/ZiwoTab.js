var ZiwoTab = function ZiwoTab(es, id) {
  this.id        = id | 0;
  this._es       = es;
  this.auth      = null;
  this.agent     = null;
  this._waitFor  = new CallbackHandler(60000);
  es.link('ZiwoTab', this.id, this, { prefix: 'On' });
};

ZiwoTab.prototype.trigger = function (method, params, callback) {
  var callbackId = this._waitFor.addListener(callback);
  var payload = { method: method, params: params, callbackId: callbackId };
  return chrome.tabs.sendMessage(this.id, payload);
};

ZiwoTab.prototype.OnResponse = function (state, event) {
  state._waitFor.satisfy(event.data.id, event.data.data);
  return state;
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
