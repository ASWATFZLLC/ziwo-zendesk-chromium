/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  const cache = new Yolo.Cache();

  node.set('tab.id', null);
  node.set('bootstrap', null);

  node.on('execute-script', function ({ id, action }) {
    return chrome.tabs.executeScript(id, action);
  });

  node.on('connect')
    .then(function (id) {
      this.node.set('tab.id', id);
      return id;
    })
    .then(':execute-script', { id: '$:@', action: '#:bootstrap' })
    .end();

  node.on('execute', function ({ arg, fn }, callback) {
    if (typeof fn != 'function') return callback('Bad argument type');
    const strfunc = Function.prototype.toString.call(fn);
    const strarg = Yolo.Util.serialize(arg);
    const token = Yolo.Util.id();
    const fqncb = this.node.cwd() + ':execute-response';
    const strcb = Function.prototype.toString.call(function (error, success) {
      const data = { error, success };
      const message = { fqn: '%FQN%', flow: { token: '%TOKEN%', data } };
      debugger;
      chrome.runtime.sendMessage(JSON.stringify(message));
    }).replace('%FQN%', fqncb).replace('%TOKEN%', token);
    cache.set(token, callback, 10, function (callback) {
      return callback('Request ' + token + ' timed out');
    });
    const action = { code: '!' + strfunc + '(' + strarg + ', ' + strcb + ');' };
    const payload = { id: this.node.get('tab.id'), action };
    return this.node.send(':execute-script', payload);
  });

  node.on('execute-response', function ({ token, data }) {
    const cb = cache.pick(token);
    if (cb == null) return ;
    cb(data.error, data.success);
    return ;
  });

};
