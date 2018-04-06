var ZiwoAdapter = function ZiwoTab(window) {
  this.window       = window;
  this.rpcClient    = null;
  this.credentials  = null;
  this.api_hostname = window.location.hostname.replace('.aswat.co', '-api.aswat.co');
  this.api_origin   = '//' + this.api_hostname;
  this.lastCallerId = null;
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

ZiwoAdapter.prototype.PbxHandleCommand = function (method, data) {
  switch (method) {
  case 'verto.invite':
    var callerId = data.caller_id_number;
    if (callerId == null || callerId.length <= 4) break ;
    this.PbxCommandVertoInvite(callerId);
    break ;
  case 'verto.bye':
    var callId = data.callID || data.dialogParams.callID;
    var caller = this.lastCallerId;
    if (data.cause == 'ORIGINATOR_CANCEL') break ;
    if (caller == null || caller.length <= 4) break ;
    this.PbxCommandVertoBye(callId);
    break ;
  default:
    this.publish('PbxWsUnhandledEvent', { method: method, data: data });
    break ;
  }
};

ZiwoAdapter.prototype.PbxCommandVertoInvite = debounce(function (callerId) {
  this.lastCallerId = callerId;
  this.publish('PbxWsCallIncame', { caller: callerId });
}, 1000);

ZiwoAdapter.prototype.PbxCommandVertoBye = debounce(function (callId) {
  var origin = this.api_hostname;
  var caller = this.lastCallerId;
  this.publish('PbxWsCallEnded', { origin: origin, caller: caller, callId: callId });
}, 1000);

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

/* Utilisation de la main web socket pour eviter les lose_race, ce qui empechait d'avoir les cdr ... */
ZiwoAdapter.prototype.OnLoggedTabAppend = function (event) {
  var mime = { type: 'application/javascript' }
  var blob = new Blob
  ( [ '(' + function proxifyVertoIngoingMessageHook() {
        if (typeof $ == 'undefined' || typeof $.verto == 'undefined' || $.verto.saved.length < 1)
          return setTimeout(proxifyVertoIngoingMessageHook, 1000);
        var last = $.verto.saved.length - 1;
        var fn = $.verto.saved[last].rpcClient.options.onmessage;
        if (fn.bridged) return setTimeout(proxifyVertoIngoingMessageHook, 1000);
        $.verto.saved[last].rpcClient.options.onmessage = function (event) {
          try {
            var domEv = new CustomEvent('message', { detail: JSON.stringify(event) });
            document.getElementById('ChromeExtensionZiwoBridge').dispatchEvent(domEv);
          } catch (e) {}
          return fn.apply(this, arguments);
        };
        $.verto.saved[last].rpcClient.options.onmessage.bridged = true;
        return setTimeout(proxifyVertoIngoingMessageHook, 1000);
      } + ')();'
    , '(' + function proxifyVertoOutgoingMessageHook() {
        if (typeof $ == 'undefined' || typeof $.verto == 'undefined' || $.verto.saved.length < 1)
          return setTimeout(proxifyVertoOutgoingMessageHook, 1000);
        var last = $.verto.saved.length - 1;
        var fn = $.verto.saved[last].rpcClient.call;
        if (fn.bridged) return setTimeout(proxifyVertoOutgoingMessageHook, 1000);
        $.verto.saved[last].rpcClient.call = function (method, payload) {
          try {
            var event = { method: method, payload: payload };
            var domEv = new CustomEvent('message', { detail: JSON.stringify(event) });
            document.getElementById('ChromeExtensionZiwoBridge').dispatchEvent(domEv);
          } catch (e) {}
          return fn.apply(this, arguments);
        }
        $.verto.saved[last].rpcClient.call.bridged = true;
        return setTimeout(proxifyVertoOutgoingMessageHook, 1000);
      } + ')();'
    ]
  , mime);
  var _this = this;
  var url = this.window.URL.createObjectURL(blob);
  var script = document.createElement('script');
  script.id = 'ChromeExtensionZiwoBridge';
  script.addEventListener('message', function (domEvent) {
    domEvent.stopPropagation();
    var event = JSON.parse(domEvent.detail);
    if (event.method && event.payload) {
      console.log('SEND', event.method, event.payload);
      _this.PbxHandleCommand(event.method, event.payload);
    } else if (event.eventData) {
      console.log('RECEIVE', event.eventData.method, event.eventData.params);
      _this.PbxHandleCommand(event.eventData.method, event.eventData.params);
    } else {
      console.log('OTHER', event);
    }
  }, true);
  setTimeout(function () {
    window.document.body.appendChild(script);
    script.src = url;
  }, 10000);
  this.window.addEventListener('beforeunload', function () {
    _this.publish('TabLeaved');
  });
};

ZiwoAdapter.prototype.OnPbxWsCallEnded = function (event) {
  var _this = this;
  var now = Date.now();
  setTimeout(function () {
    _this.request('get', '/agents/channels/calls?fetchStart=0&fetchStop=6', function (err, history) {
      if (err) return console.error(err);
      for (var i = 0; i < history.content.length; i++) {
        if (history.content[i].recordingFile == null) continue ;
        if (history.content[i].hangupCause != 'NORMAL_CLEARING') break ;
        if (event.data.caller != history.content[i].callerIDNumber) break ;
        var endTime = new Date(history.content[0].endDateTime).getTime();
        if (Math.abs(now - endTime) > 8000) break ;
        var payload = event.data;
        payload.fileId = history.content[i].recordingFile;
        _this.publish('PhoneCallRecorded', payload);
        return ;
      }
    });
  }, 1000);
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

/*******************************************/

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}
