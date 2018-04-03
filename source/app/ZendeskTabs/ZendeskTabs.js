var ZendeskTabs = function (es) {
  this._es = es;
  this._subs = [];
  this.tabs = {};
  this.primaryId = null;
  this._subs.push(es.subscribeCategory('ZendeskTab', this, { state: this, prefix: 'On' }));
};

/*****************************************/

ZendeskTabs.prototype.guessNewPrimary = function () {
  for (var nextId in this.tabs) break ;
  if (nextId) this.tabs[nextId].setAsPrimary();
  else this.primaryId = null;
};

/*****************************************/

ZendeskTabs.prototype.OnLoggedTabAppend = function (state, event) {
  state.tabs[event.identityId] = new ZendeskTab(state._es, event.identityId);
  if (state.primaryId == null) {
    state.primaryId = event.identityId;
    state.tabs[event.identityId].setAsPrimary();
  } else if (state.primaryId != event.identityId) {
    state.tabs[event.identityId].unsetAsPrimary();
  }
  return state;
};

ZendeskTabs.prototype.OnRequestPrimary = function (state, event) {
  state.primaryId = event.identityId;
  for (var tab in state.tabs) {
    if (tab == event.identityId) {
      state.tabs[tab].setAsPrimary();
    } else {
      state.tabs[tab].unsetAsPrimary();
    }
  }
  return state;
};

ZendeskTabs.prototype.OnTabClosed = function (state, event) {
  if (state.tabs[event.identityId]) {
    state.tabs[event.identityId].destroy();
    delete state.tabs[event.identityId];
  }
  if (event.identityId == state.primaryId)
    state.guessNewPrimary();
  return state;
};

ZiwoTabs.prototype.OnTabLeaved = function (state, event) {
  if (state.tabs[event.identityId]) {
    state.tabs[event.identityId].destroy();
    delete state.tabs[event.identityId];
  }
  if (event.identityId == state.primaryId)
    state.guessNewPrimary();
  return state;
};
