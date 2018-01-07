var EventStore = function () {
  this.version       = -1;
  this.versions      = {};
  this.streams       = {};
  this.subscriptions = {};
  this.subscribe('$input', this.$input, { state: this });
};

EventStore.uuidv4 = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

EventStore.prototype.$input = function (state, payload) {
  var event      = payload.event;
  var streamId   = event.streamId;
  var options    = event.options || {};
  var dashOffset = streamId.indexOf('-');
  console.log(streamId, event.eventType, event.data, event.options);
  switch (event.eventType) {
  case '$delete':
    if (state.streams[streamId] != null) {
      if (options.hard) {
        delete state.streams[streamId];
        delete state.versions[streamId];
        delete state.subscriptions[streamId];
      } else {
        state.streams[streamId] = new Array(state.streams[streamId].length);
      }
    }
    break ;
  default :
    if (event.createdAt == null) event.createdAt = new Date();
    if (event.eventId == null) event.eventId = EventStore.uuidv4();
    if (event.identityId == null) event.identityId = ~dashOffset ? streamId.substr(dashOffset + 1) : null;
    if (options.version != null && options.version != state.versions[streamId]) {
      if (payload.callback) payload.callback('Bad version');
      return state;
    }
    break ;
  }
  if (event.eventType[0] != '$') {
    state.version += 1;
    if (state.versions[streamId] == null) state.versions[streamId] = -1;
    state.versions[streamId] += 1;
    var eventNumber = state.versions[streamId]
    event.eventNumber = eventNumber;
    if (state.streams[streamId] == null) state.streams[streamId] = [];
    state.streams[streamId].push(event);
    state.dispatch('$all', event);
    state.dispatch(streamId, event);
    if (eventNumber > 0 && eventNumber % 1000 == 0) state.dispatch('$gc', event);
    if (payload.callback) payload.callback(null, { eventNumber: eventNumber });
    return state;
  } else {
    var eventNumber = streamId in state.versions ? state.versions[streamId] : -1;
    if (payload.callback) payload.callback(null, { eventNumber: eventNumber });
    return state;
  }
};

EventStore.prototype.publish = function (streamId, eventType, data, options, callback) {
  var event = { streamId: streamId, eventType: eventType, data: data, options: options };
  return this.dispatch('$input', { event: event, callback: callback });
};

EventStore.prototype.dispatch = function (streamId, event) {
  var subscriptions = this.subscriptions[streamId];
  if (subscriptions == null) return null;
  for (var i = 0; i < subscriptions.length; i += 1) {
    var s = subscriptions[i];
    s.state = this.apply(s.state, s.mapping, s.options, event);
  }
};

EventStore.prototype.apply = function (state, mapping, options, event) {
  if (options == null) options = {};
  if (options.filter && !options.filter(event)) return state;
  var eventType = options.prefix + event.eventType;
  var handler = typeof mapping == 'function' ? mapping
    : typeof mapping[eventType] == 'function' ? mapping[eventType]
    : function (state) { return state };
  return handler(state, event);
};

EventStore.prototype.subscribe = function (streamId, mapping, options, onSubscribed) {
  var subscriptionId = EventStore.uuidv4();
  if (this.subscriptions[streamId] == null) this.subscriptions[streamId] = [];
  if (options == null) options = {};
  if (options.prefix == null) options.prefix = '';
  var $init = 'state' in options ? function () { return options.state; }
    : mapping.$init != null ? mapping.$init
    : function () { return null; };
  var state = $init();
  var subscription = { mapping: mapping, options: options, state: state };
  this.subscriptions[streamId].push(subscription);
  if (onSubscribed) onSubscribed();
  return subscriptionId;
};

EventStore.prototype.subscribeCategory = function (categoryName, mapping, options, onSubscribed) {
  if (options == null) options = {};
  options.filter = function (event) { return event.streamId.indexOf(categoryName + '-') == 0; };
  return this.subscribe('$all', mapping, options, onSubscribed);
};

EventStore.prototype.onGC = function (categoryName, predicate) {
  var options = {};
  options.filter = function (event) { return event.streamId.indexOf(categoryName + '-') == 0; };
  var _this = this;
  return this.subscribe('$gc', function (state, event) {
    var stream = _this.streams[event.streamId];
    var state = {};
    for (var i = stream.length - 1; i >= 0; i -= 1) {
      if (stream[i] == null) continue ;
      if (predicate(state, stream[i])) stream[i] = void 0;
    }
  }, options);
};

EventStore.prototype.releaseSubscriptions = function (streamId) {
  var subscriptions = this.subscriptions[streamId];
  if (subscriptions == null) return ;
  alert('TODO');
};

EventStore.prototype.link = function (categoryName, identityId, mapping, options) {
  var streamId = categoryName + '-' + identityId;
  if (options.state == null) options.state = mapping;
  this.readForwardFrom(streamId, -1, mapping, options);
  return this.subscribe(streamId, mapping, options);
};

EventStore.prototype.readForwardFrom = function (streamId, eventNumber, mapping, options, callback) {
  var stream = this.streams[streamId];
  if (stream == null) return typeof callback == 'function' ? callback() : null;
  if (options == null) options = {};
  if (options.prefix == null) options.prefix = '';
  var $init = 'state' in options ? function () { return options.state; }
    : mapping.$init != null ? mapping.$init
    : function () { return null; };
  var state = $init();
  var version = this.versions[streamId];
  for (var i = eventNumber | 0; i < version; i += 1) {
    var event = stream[i + 1];
    if (event == null) continue ;
    state = this.apply(state, mapping, options, event);
  }
  var summary = { state: state };
  if (callback) return callback(null, summary);
};

EventStore.prototype.deleteSoft = function (streamId, callback) {
  this.publish(streamId, '$delete', {}, {}, callback);
};

EventStore.prototype.deleteHard = function (streamId, callback) {
  this.publish(streamId, '$delete', {}, { hard: true }, callback);
};
