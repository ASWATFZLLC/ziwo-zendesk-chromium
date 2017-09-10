const catchError = function (error) { if (error) console.error(error); };

const Hive = Yolo.create(chrome.runtime.getURL('/'));

Hive.build('Ziwo', catchError);
Hive.build('Ziwo.Auth', catchError);
Hive.build('Ziwo.Agent', catchError);
Hive.build('Ziwo.Channel', catchError);
Hive.build('Helpdesk', catchError);
Hive.build('Zendesk', catchError);

const ziwoEE = Hive.getChild('Ziwo').get('emitter');

ziwoEE.on('live-calls', Yolo.Util.debounce(function (calls) {
  for (var i = 0; i < calls.length; i++) {
    var call = calls[i];
    var caller = /^0+$/.test(call.callerID) ? call.callerPosition : call.callerID;
    var callId = call.callID;
    Hive.send('Helpdesk:display-end-user', { identity: caller });
  }
}, 200));

ziwoEE.on('live-agents', function (message) {
  //console.log('live-agent', message);
});

chrome.runtime.onMessage.addListener(function (message, sender, callback) {
  if (sender.id != chrome.runtime.id) return ;
  const hostname = new URL(sender.url).hostname;
  const domain = hostname.split('.').slice(-2).join('.');
  const data = JSON.parse(message);
  Hive.getChildren().map(function (Node) {
    const nodeDomain = Node.get('domain');
    if (nodeDomain == null || nodeDomain != domain) return ;
    Node.send(data.fqn, data.flow, callback);
  });
});

chrome.windows.getAll({ populate: true }, function (windows) {
  windows.forEach(function (window) {
    window.tabs.forEach(function (tab) {
      const hostname = new URL(tab.url).hostname;
      const domain = hostname.split('.').slice(-2).join('.');
      Hive.getChildren().map(function (Node) {
        const nodeDomain = Node.get('domain');
        if (nodeDomain == null || nodeDomain != domain) return ;
        const bootstrap = Node.get('bootstrap');
        if (bootstrap == null) return ;
        chrome.tabs.executeScript(tab.id, bootstrap);
      });
    });
  });
});
