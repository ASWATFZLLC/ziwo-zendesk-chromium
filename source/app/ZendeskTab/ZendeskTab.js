var ZendeskTab = function ZendeskTab(es, id) {
  this.id        = id | 0;
  this._es       = es;
  this._waitFor  = new CallbackHandler(60000);
  this.isPrimary = false;
  es.link('ZendeskTab', this.id, this, { prefix: 'On' });
  es.subscribeCategory('ZiwoTab', this, { prefix: 'OnZiwo', state: this });
};

ZendeskTab.prototype.trigger = function (method, params, callback) {
  var callbackId = this._waitFor.addListener(callback);
  var payload = { method: method, params: params, callbackId: callbackId };
  return chrome.tabs.sendMessage(this.id, payload);
};

ZendeskTab.prototype.OnZiwoPbxWsCallIncame = function (state, event) {
  if (!this.isPrimary) return state;
  var number = new PhoneNumber(event.data.caller).number;
  state.trigger('searchUserByPhoneNumber', [number], function (err, search) {
    if (err) return console.error(err);
    if (search.count == 0) {
      var user = { name: 'Ziwo autocreated end-user', phone: event.data.caller, role: 'end-user' };
      state.trigger('createUser', [user], function (err, result) {
        if (err) return console.error(err);
        state.trigger('displayUser', [result.user.id]);
      });
    } else {
      state.trigger('displayUser', [search.results[0].id]);
    }
  });
  return state;
};

ZendeskTab.prototype.OnTabClosed = function (state, event) {
  state._es.deleteHard(event.streamId);
  return state;
};

ZendeskTab.prototype.OnResponse = function (state, event) {
  state._waitFor.satisfy(event.data.id, event.data.data);
  return state;
};

/*****************************************/

function PhoneNumber(number) {
  number = (number + '').replace(/[^\d]/g, '');
  var getIndicatif = /^(1(?:2(?:4[26]|6[48]|84)|34[05]|4(?:41|73)|6(?:49|64|7[01]|84)|7(?:21|58|67|8[47])|8(?:[024]9|6[89]|76)|939)?|2(?:[07]|1[1-368]|[2-46]\d|5[0-8]|9[017-9])|3(?:[0-469]|[57]\d|8[0-35-79])|4(?:[013-9]|2[013])|5(?:[09]\d|[1-8])|6(?:[0-6]|7[02-9]|8[0-35-9]|9[0-2])|7|8(?:00|[1246]|5[02356]|8[016])|9(?:[0-58]|6[0-8]|7[0-7]|9[2-68]))/;
  var indicatif = getIndicatif.exec(number);
  this.indicatif = indicatif ? indicatif[1] : '';
  this.number = number.substr(indicatif.length);
}
PhoneNumber.prototype.toString = function () {
  return this.indicatif + this.number;
};
