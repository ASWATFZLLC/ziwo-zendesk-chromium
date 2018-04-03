var es = new EventStore();

es.onStreamGC('ZiwoTab', function (state, event) {
  if (state[event.eventType] == null) state[event.eventType] = 1;
  else state[event.eventType] += 1;
  if (state[event.eventType] > 100) return true;
  return false;
});

setInterval(function () {
  var subs = es.subscriptions.$all;
  var toTest = [];
  for (var i = 0; i < subs; i++) {
    var name = subs[i].mapping.constructor.name;
    if (name != 'ZiwoTab' && name != 'ZendeskTab') continue ;
    toTest.push(subs[i]);
  }
  return (function loop(list, toRemove) {
    var subscription = list.shift();
    if (subscription == null) {
      return es.unsubscribe(toRemove);
    } else {
      return chrome.tabs.get(subscription.mapping.id, function (tab) {
        if (tab == null) toRemove.push(subscription.id);
        return loop(list, toRemove);
      });
    }
  })(toTest, []);
}, 60000);

var modules = {};
var tabsCategoryNames = {};

modules.ZiwoTabs = new ZiwoTabs(es);
modules.ZendeskTabs = new ZendeskTabs(es);

chrome.runtime.onMessage.addListener(function onRequest(request, sender, sendResponse) {
  var event = request.event;
  var callback = function (error, success) { sendResponse([error, success]); };
  switch (request.type) {
  case 'initiate':
    var categoryName = event.categoryName;
    if (categoryName == null) return sendResponse(['Missing categoryName']);
    tabsCategoryNames[sender.tab.id] = categoryName;
    var streamId = categoryName + '-' + sender.tab.id;
    return es.deleteSoft(streamId, callback);
  case 'publish':
    var categoryName = event.categoryName;
    if (categoryName == null) return sendResponse(['Missing categoryName']);
    var streamId = categoryName + '-' + sender.tab.id;
    var eventType = event.eventType;
    if (eventType == null) return sendResponse(['Missing eventType']);
    var options = event.options || {};
    var data = event.data;
    return es.publish(streamId, eventType, data, options, callback);
  default:
    console.log('NOT HANDLED', request);
    return ;
  }
});

chrome.tabs.onRemoved.addListener(function (id, info) {
  var categoryName = tabsCategoryNames[id];
  if (categoryName == null) return ;
  delete tabsCategoryNames[id];
  var streamId = categoryName + '-' + id;
  return es.publish(streamId, 'TabClosed');
});

chrome.tabs.onReplaced.addListener(function (id, info) {
  var categoryName = tabsCategoryNames[id];
  if (categoryName == null) return ;
  delete tabsCategoryNames[id];
  var streamId = categoryName + '-' + id;
  return es.publish(streamId, 'TabClosed');
});
