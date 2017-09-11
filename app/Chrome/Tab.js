/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  const cache = new Yolo.Cache();

  node.set('tab.id', null);
  node.set('domain', null);
  node.set('bootstrap', null);

  node.on('-load', function (payload) {
    chrome.runtime.onMessage.addListener((message, sender, callback) => {
      if (sender.id != chrome.runtime.id) return ;
      const hostname = new URL(sender.url).hostname;
      const domain = hostname.split('.').slice(-2).join('.');
      if (domain != this.node.get('domain')) return ;
      const data = JSON.parse(message);
      const flow = data.flow == null ? {} : data.flow;
      if (typeof flow == 'object') flow._tab = sender.tab;
      this.node.send(data.fqn, flow, callback);
    });
    return payload;
  });

  node.on('connect')
    .then(function ({ _tab }) {
      logger.log(this.node.cwd(), 'Connected with tab:', _tab.id);
      this.node.set('tab.id', _tab.id);
    })
    .end();

  node.on('bootstrap')
    .then(':find-tabs')
    .assert('$:0', '%:No tab with domain #{domain} found')
    .then(':execute-script', { id: '$:0.id', action: '#:bootstrap' })
    .end();

  node.on('find-tabs', function (data, callback) {
    const tabs = [];
    return chrome.windows.getAll({ populate: true }, windows => {
      windows.forEach(window => {
        window.tabs.forEach(tab => {
          const hostname = new URL(tab.url).hostname;
          const domain = hostname.split('.').slice(-2).join('.');
          if (domain != this.node.get('domain')) return ;
          tabs.push(tab);
        });
      });
      return callback(null, tabs);
    });
  });

  node.on('execute', function ({ arg, fn }, callback) {
    if (typeof fn != 'function') return callback('Bad argument type');
    const strfunc = Function.prototype.toString.call(fn);
    const strarg = Yolo.Util.serialize(arg);
    const token = Yolo.Util.id();
    const fqncb = this.node.cwd() + ':execute-response';
    const strcb = Function.prototype.toString.call(function (error, success) {
      const data = { error, success };
      const message = { fqn: '%FQN%', flow: { token: '%TOKEN%', data } };
      chrome.runtime.sendMessage(JSON.stringify(message));
    }).replace('%FQN%', fqncb).replace('%TOKEN%', token);
    cache.set(token, callback, 10, function (callback) {
      return callback('Request ' + token + ' timed out');
    });
    const action = { code: '!' + strfunc + '(' + strarg + ', ' + strcb + ');' };
    const payload = { id: this.node.get('tab.id'), action };
    return this.node.send(':execute-script', payload);
  });

  node.on('execute-script', function ({ id, action }) {
    if (id == null) throw new Error('Missing tab id');
    try { return chrome.tabs.executeScript(id, action); }
    catch (e) { throw new Error('Unkonwn tab id: ' + id); }
  });

  node.on('execute-response', function ({ token, data }) {
    const cb = cache.pick(token);
    if (cb == null) return ;
    cb(data.error, data.success);
    return ;
  });

};
