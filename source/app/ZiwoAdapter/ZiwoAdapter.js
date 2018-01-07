var ZiwoAdapter = function ZiwoTab(window) {
  this.window       = window;
  this.rpcClient    = null;
  this.credentials  = null;
  this.api_hostname = window.location.hostname.replace('.aswat.co', '-api.aswat.co');
  this.api_origin   = '//' + this.api_hostname;
  this.initiate();
  if (this.isLogged())
    this.publish('LoggedTabAppend', { auth: this.getAuthToken() });
};

ZiwoAdapter.prototype.isLogged = function () {
  return !!this.getAuthToken();
};

ZiwoAdapter.prototype.getAuthToken = function () {
  return localStorage['x-auth-token'];
};

ZiwoAdapter.prototype.request = function (method, path, data, callback) {
  if (method.toLowerCase() == 'get') { callback = data; data = null; }
  var payload = { url: this.api_origin + path, method: method };
  payload.headers = {};
  payload.headers['access_token'] = this.getAuthToken();
  if (data != null) payload.data = data;
  payload.success = function (value) {
    return callback(null, value);
  };
  payload.error = function (err) {
    return callback(err);
  };
  return jQuery.ajax(payload);
};

ZiwoAdapter.prototype.getAgentCredentials = function () {
  var _this = this;
  this.request('get', '/profile', function (err, data) {
    if (err) return console.error(err);
    var credentials = {};
    credentials.login = data.content.ccLogin;
    credentials.password = data.content.ccPassword;
    _this.publish('AgentCredentialsFetched', credentials);
  });
}

ZiwoAdapter.prototype.ConnectPbx = function (credentials) {
  var _this = this;
  var options = {};
  options.socketUrl = 'wss:' + _this.api_origin + ':8082';
  options.onmessage = function (event) {
    var data = JSON.parse(event.data);
    var method = data.method;
    var payload = data.params;
    _this.PbxHandleCommand(method, payload);
  };
  options.onopen = function (event) {
    _this.publish('PbxWsConnected', { url: event.currentTarget.url });
  };
  options.onclose = function () {
    _this.publish('PbxWsDisconnected', {});
  };
  var handle = new $.JsonRpcClient(options);
  var payload    = {};
  payload.login  = 'agent-' + credentials.login + '@' + _this.api_hostname;
  payload.passwd = CryptoJS.MD5([credentials.login, credentials.password].join('')).toString();
  payload.loginParams   = {};
  payload.userVariables = {};
  handle.call('login', payload, function (event) {
    _this.rpcClient = handle;
    _this.publish('PbxWsLoggedIn', { sessid: event.sessid });
  }, function () {
    console.log(event);
    _this.publish('PbxWsConnectionFailed');
  });
};

ZiwoAdapter.prototype.PbxHandleCommand = function (method, data) {
  switch (method) {
  case 'verto.invite':
    this.publish('PbxWsCallIncame', { id: data.callID, caller: data.caller_id_number });
    break ;
  case 'verto.bye':
    this.publish('PbxWsCallEnded', { id: data.callID });
    break ;
  default:
    this.publish('PbxWsUnhandledEvent', { method: method, data: data });
    break ;
  }
};

ZiwoAdapter.prototype.Dial = function (number) {
  var dialler = document.querySelector('.dialler-head input');
  dialler.value = number;
  var event = document.createEvent('HTMLEvents');
  event.initEvent('change', false, true);
  dialler.dispatchEvent(event);
  document.querySelector('.dialler-bottom button').click();
};

ZiwoAdapter.prototype.PickUp = function (number) {
  document.querySelector('.dialler-ringing-state-button.answer button').click()
};

ZiwoAdapter.prototype.HangUp = function (number) {
  Array.prototype.slice.call(document.querySelectorAll('.dialler-bottom-button button'))
    .filter(function (n) { return n.textContent == 'call_end'; })[0]
    .click();
};


/**********************************/

ZiwoAdapter.prototype.OnLoggedTabAppend = function (event) {
  this.getAgentCredentials();
};

ZiwoAdapter.prototype.OnAgentCredentialsFetched = function (event) {
  this.credentials = event.data;
  this.ConnectPbx(event.data);
};

ZiwoAdapter.prototype.OnPbxWsLoggedIn = function (event) {
  this.rpcClient.options.sessid = event.data.sessid;
  var _this = this;
  this.rpcClient.heartbeat = setInterval(function () {
    _this.rpcClient.expired = true;
    _this.rpcClient._wsSocket.close();
  }, 3600000);
};

ZiwoAdapter.prototype.OnPbxWsDisconnected = function (event) {
  var _this = this;
  if (this.rpcClient && this.rpcClient.heartbeat) clearInterval(this.rpcClient.heartbeat);
  var delay = _this.rpcClient.expired ? 1 : 5000;
  _this.rpcClient.expired = false;
  setTimeout(function () { _this.ConnectPbx(_this.credentials); }, delay);
};

/**********************************/

ZiwoAdapter.prototype.publish = function (eventType, data, options, callback) {
  var event = { eventType: eventType, data: data, options: options };
  return this.send('publish', event, callback);
};

ZiwoAdapter.prototype.initiate = function (callback) {
  return this.send('initiate', {}, callback);
};

ZiwoAdapter.prototype.send = function (type, event, callback) {
  event.categoryName = this.constructor.name;
  var payload = { type: type, event: event };
  if (type == 'publish' && this['On' + event.eventType])
    this['On' + event.eventType](event);
  return chrome.runtime.sendMessage(payload, function (args) {
    if (callback == null) return ;
    return callback.apply(this, args);
  });
};

var adapter = new ZiwoAdapter(window);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  return adapter[request.method].apply(adapter, request.params.concat(function () {
    if (request.callbackId == null) return ;
    adapter.publish('Response', { id: request.callbackId, data: Array.prototype.slice.call(arguments) });
  }));
});

