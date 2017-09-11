/*!UroxGvT3uDMQCT1va20i43ZZSxo*/

export default function (node, logger) {


  node.set('events.live.queues', 'GET /live/queues');
  node.set('events.live.positions', 'GET /live/positions');
  node.set('events.live.agents', 'GET /live/agents');
  node.set('events.live.calls', 'GET /live/calls');
  node.set('events.live.stats', 'GET /live/stats');
  node.set('events.live.call-stats-per-agent', 'GET /live/statistics/channels/calls/by/agents');

  node.set('interval', setInterval(function () {
    node.send(':connect', {}, function (error, success) {
      if (!error) return ;
      if (error.message == 'ALREADY_CONNECTED') return ;
      logger.error(error);
    });
  }, 1000));

  node.on('connect')
    .assert(function () { return this.node.get('uplink') == null; }, '=:ALREADY_CONNECTED')
    .then('Ziwo.Auth:get-token', {}).merge({ token: '$:@' })
    .then('Ziwo:get-api-origin', {}).merge('origin')
    .assert('$:token', 'authentication token not found')
    .then(function ({ origin, token }, callback) {
      const Ziwo = this.node.parent;
      const params = { query: 'access_token=' + encodeURIComponent(token), path: '/socket'
                     , reconnectionDelay: 1000
                     };
      if (this.node.get('uplink') != null) return callback('An uplink already exists');
      const uplink = io.connect(origin, params);
      uplink.on('error', error => {
        if (error == 'Invalid access token')
          this.node.send('Ziwo:-emit', { event: 'disconnected', data: error });
        else if (callback) return callback(error);
        else logger.error(error);
      });
      uplink.on('connect', data => {
        if (callback == null) return ;
        const cb = callback;
        callback = null;
        return cb(null, uplink);
      });
      const eventMap = this.node.get('events.live');
      for (let name in eventMap) ((ename, event) => {
        uplink.on(event, message => {
          if (message == null) return ;
          if (message.info.status != 200) return logger.error(ename, message);
          if (message.content instanceof Array && message.content.length == 0) return ;
          this.node.send('Ziwo:-emit', { event: ename, data: message.content });
        });
      })('live-' + name, eventMap[name]);
      this.node.set('uplink', uplink);
    })
    .end();

};
