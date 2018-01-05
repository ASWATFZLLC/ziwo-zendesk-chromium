var ZiwoAdapter = function ZiwoTab(window) {
  this.window = window;
  this.verto = null;
  this.api_hostname = window.location.hostname.replace('.aswat.co', '-api.aswat.co');
  this.api_origin = '//' + this.api_hostname;
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

ZiwoAdapter.prototype.connectVerto = function (credentials) {
  var _this = this;
  //$.verto.init({}, function () {
  var options = {};
  options.login = 'agent-' + credentials.login + '@' + _this.api_hostname;
  options.passwd = CryptoJS.MD5([credentials.login, credentials.password].join('')).toString();
  options.socketUrl = 'wss:' + _this.api_origin + ':8082';
  options.deviceParams = { useMic: false, useSpeak: false };
  options.iceServers = true;
  var callbacks = {};
  callbacks.onWSLogin = function (verto, success) { debugger; console.log('onWSLogin', arguments); }
  callbacks.onWSClose = function (verto, success) { debugger; console.log('onWSClose', arguments); }
  callbacks.onDialogState = function () { debugger; console.log('onWSDialogState', arguments); }
  var handle = new jQuery.verto(options, callbacks);
  var payload = {};
  handle.rpcClient.options.onmessage = function (event) {
    var data = JSON.parse(event.data);
    var method = data.method;
    var payload = data.params;
    _this.vertoHandleCommand(method, payload);
  };
  payload.sessid = handle.rpcClient.options.sessid;
  payload.login = options.login;
  payload.passwd = options.passwd;
  payload.loginParams = {};
  payload.userVariables = {};
  handle.rpcClient.call('login', payload, function () {
    _this.verto = handle;
    _this.publish('VertoConnected');
  }, function () {
    _this.publish('VertoConnectionFailed');
  });
};

ZiwoAdapter.prototype.vertoHandleCommand = function (method, data) {
  switch (method) {
  case 'verto.invite':
    this.publish('CallIncame', { id: data.callID, caller: data.caller_id_number });
    break ;
  case 'verto.bye':
    this.publish('CallEnded', { id: data.callID });
    break ;
  }
};

/**********************************/

ZiwoAdapter.prototype.OnLoggedTabAppend = function (event) {
  this.getAgentCredentials();
};

ZiwoAdapter.prototype.OnAgentCredentialsFetched = function (event) {
  this.connectVerto(event.data);
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

ZiwoAdapter.prototype.receive = function () {
  debugger;
};

var adapter = new ZiwoAdapter(window);

