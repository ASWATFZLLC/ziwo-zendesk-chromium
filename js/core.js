var YCE = new function () {

  var Util = new function () {

    this.createLocalStorageDB = function (prefix) {
      return new function () {

        this.set = function (key, value, callback) {
          if (callback == null) callback = function () {};
          var oldData = localStorage.getItem(key);
          if (oldData != null) {
            var oldValue = JSON.parse(oldData).value;
            if (Yolo.Digest(oldValue) == Yolo.Digest(value))
              return callback(null, false);
          }
          var data = JSON.stringify({ value: value });
          localStorage.setItem([prefix, key].join('.'), data);
          return callback(null, true);
        };

        this.get = function (key) {
          if (callback == null) callback = function () {};
          var data = localStorage.getItem([prefix, key].join('.'));
          if (data == null) return callback(null, null);
          var value = JSON.parse(data).value;
          return callback(null, value);
        };

      };
    };

  };

  var Ziwo = this.Ziwo = new function () {

    this.events = new EventEmitter();
    this.SDK = require('libs/sdk/ziwo.js');
    this.SDK.setDB(Util.createLocalStorageDB('ziwo'));
    this.SDK.setEventEmitter(this.events);

    this.isThisUrlContext = function (url) {
      return /\.aswat\.co$/.test(new URL(url).hostname);
    };

    this.receiveMessage = function (message) {
      switch (message.type) {
      case 'event': return Ziwo.events.emit(message.key, message.value);
      default: console.log('Discard', message);
      }
    };

  };

  var Helpdesk = this.Helpdesk = new function () {

    this.Node = new Yolo.Node('Helpdesk');

  };

  var Zendesk = this.Zendesk = new function () {

    this.SDK = require('libs/sdk/zendesk.js');

  };

  debugger;
  /*
  this.Root = new Yolo.Node('YCE');
  this.Root.attach(Ziwo.SDK.Node, 'Ziwo');
  this.Root.attach(Helpdesk.Node, 'Helpdesk');
  this.Root.attach(Zendesk.SDK.Node, 'Zendesk');
  */
};

YCE.Ziwo.events.on('auth-token', function (token) {
  YCE.Ziwo.SDK.Node.send('Auth:set-token', token);
});

YCE.Ziwo.events.on('auth-disconnected', function () {
  alert('You have been disconnect from Ziwo');
});

YCE.Ziwo.events.on('api-origin', function (token) {
  YCE.Ziwo.SDK.Node.send(':set-api-origin', token);
});

YCE.Ziwo.events.on('live-call', function (message) {
  console.log('LIVE CALL', message);
});


chrome.runtime.onMessage.addListener(function (message, sender, callback) {
  if (sender.id != chrome.runtime.id) return ;
  for (var ctx in YCE) {
    if (typeof YCE[ctx].isThisUrlContext != 'function') continue ;
    if (typeof YCE[ctx].receiveMessage != 'function') continue ;
    YCE[ctx].receiveMessage(JSON.parse(message));
    break ;
  }
});

chrome.tabs.getAllInWindow(null, function (tabs) {
  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    if (YCE.Ziwo.isThisUrlContext(tab.url)) {
      chrome.tabs.executeScript(tab.id, { file: 'js/inject-ziwo.js' });
    }
  }
});

