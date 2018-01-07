var CallbackHandler = function (timeout) {
  this.listeners = {};
  this.timeout = timeout;
};

CallbackHandler.uuidv4 = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

CallbackHandler.prototype.addListener = function (callback) {
  this.gc();
  if (callback == null) return null;
  var _this = this;
  var id = CallbackHandler.uuidv4();
  var handler = function () {
    delete _this.listeners[id];
    return callback.apply(this, arguments);
  };
  this.listeners[id] = { date: Date.now(), handler: handler };
  return id;
};

CallbackHandler.prototype.satisfy = function (id, params) {
  this.gc();
  if (this.listeners[id] == null) return null;
  return this.listeners[id].handler.apply(this, params);
};

CallbackHandler.prototype.gc = function () {
  var now = Date.now();
  var toDelete = [];
  for (var i in this.listeners)
    if (this.listeners[i].now + this.timeout < now)
      toDelete.push(i);
  for (var j = 0; j < toDelete.length; j++) {
    this.listeners[toDelete[i]]('Timed out');
    delete this.listeners[toDelete[i]];
  }
};
