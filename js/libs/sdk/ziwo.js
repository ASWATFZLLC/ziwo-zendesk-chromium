module.exports = new function () {
  var DB = { get: function (k, c) { return c('Failure'); }
           , set: function (k, v, c) { return c('Failure'); }
           };

  var Ziwo = this.Node = new Yolo.Node('Ziwo');

  this.setDB = function (db) { DB = db; };
  this.setEventEmitter = function (ee) {
    var old = Ziwo.get('event-emitter');
    if (old) throw new Error('EventEmitter already set');
    Ziwo.set('event-emitter', ee);
  };

  this.Node.attach(new Yolo.Node('Auth'), 'Auth');
  this.Node.attach(new Yolo.Node('Channel'), 'Channel');

  Ziwo.on('set-api-origin', function (origin) {
    Ziwo.set('api.origin', origin);
  });

  Ziwo.getChild('Auth').on('set-token', function (token, callback) {
    return DB.set('auth.token', token, function (err, hasChanged) {
      if (err) return callback(err);
      if (!hasChanged) return ;
      Ziwo.set('auth.token', token);
      if (Ziwo.get('uplink')) return Ziwo.send('Channel:reconnect', {}, callback);
      else return Ziwo.send('Channel:connect', {}, callback);
    });
  });

  Ziwo.getChild('Auth').on('disconnected', function (error, callback) {
    var ee = Ziwo.get('event-emitter');
    if (ee) ee.emit('auth-disconnected', error);
    
  });


  var Channel = Ziwo.getChild('Channel');
  Channel.set('events.live.queue', 'GET /live/queues');
  Channel.set('events.live.position', 'GET /live/positions');
  Channel.set('events.live.agent', 'GET /live/agents');
  Channel.set('events.live.call', 'GET /live/calls');
  Channel.set('events.live.stat', 'GET /live/stats');
  Channel.set('events.live.call-stats-per-agent', 'GET /live/statistics/channels/calls/by/agents');

  Ziwo.getChild('Channel').on('connect', function (data, callback) {
    var origin = Ziwo.get('api.origin');
    if (origin == null) return callback();
    var token = Ziwo.get('auth.token');
    if (token == null) return callback('Missing token');
    if (Ziwo.get('uplink')) return callback();
    var params = { query: 'access_token=' + encodeURIComponent(token), path: '/socket'
                 , reconnectionDelay: 1000
                 };
    var uplink = io.connect(origin, params);
    var ee = Ziwo.get('event-emitter');
    uplink.on('error', function (error) {
      if (ee && error == 'Invalid access token') Ziwo.send('Auth:disconnected', error);
      else if (callback) return callback(error);
      else console.error(error);
    });
    uplink.on('connect', function (data) {
      if (cb == null) return ;
      var cb = callback;
      Ziwo.set('uplink', uplink);
      callback = null;
      return cb(null, data);
    });
    var eventMap = this.node.get('events.live');
    for (var name in eventMap) (function (ename, event) {
      uplink.on(event, function (message) {
        if (message == null) return ;
        if (message.info.status != 200) return console.error(ename, message);
        if (message.content instanceof Array && message.content.length == 0) return ;
        if (ee != null) ee.emit(ename, message.content);
        else console.log(ename, message);
      });
    })('live-' + name, eventMap[name]);
  });

  Ziwo.getChild('Channel').on('disconnect', function () {
    var uplink = Ziwo.get('uplink');
    uplink.disconnect();
    Ziwo.set('uplink', null);
  });

  Ziwo.getChild('Channel').on('reconnect')
    .then(':disconnect').dismiss()
    .then(':connect')
    .end();

};
