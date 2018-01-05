var ZendeskTabs = function (es) {
  es.subscribeCategory('ZendeskTab', this, { state: this, prefix: 'On' });
};

ZendeskTabs.prototype.OnLoggedTabAppend = function (state, event) {
  console.log(state, event);
};

