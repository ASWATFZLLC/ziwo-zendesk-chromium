/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  node.inherit('Chrome.Tab');

  node.set('domain', 'zendesk.com');
  node.set('bootstrap.file', 'js/inject-zendesk.js');

  const tabs = {};

  node.on('connect', function (flow, callback) {
    const tabId = this.node.get('tab.id');
    const currentTabId = Bhiv.Util.getIn(flow, '_tab.id');
    tabs[currentTabId] = { date: new Date() };
    if (tabId) {
      if (tabId == currentTabId) return callback(null, flow);
      return this.node.send(':unmark-primary', { tabId: currentTabId }, err => {
        if (err) return callback(err);
        return callback(null, flow);
      });
    } else {
      this.super(flow, callback);
    }
  });

  node.on('request-primary')
    .then(':mark-primary', { tabId: '$:_tab.id' })
    .end();

  node.on('mark-primary', function ({ tabId }, callback) {
    const currentTabId = this.node.get('tab.id');
    if (tabId == currentTabId) return callback(null, tabId);
    return this.node.send(':execute', { arg: null, fn: function self(_, callback) {
      const button = document.querySelector('#ziwo-main-button');
      if (button == null) return setTimeout(self, 1000, _, callback);
      button.markPrimary();
      return callback(null, null);
    }, tabId: tabId }, err => {
      if (err) return callback(err);
      this.node.set('tab.id', tabId);
      const tabIds = Object.keys(tabs).filter(id => id != tabId);
      return this.node.begin().Map('.')
        .  then(':unmark-primary', { tabId: '$:value' })
        .  end()
        .end(tabIds, callback)
    });
  });

  node.on('unmark-primary')
    .then(function (payload) { return { tabId: +payload.tabId }; })
    .trap({}, ':unregister-tab', { tabId: '$:payload.tabId' })
    .then(':execute', { arg: null, fn: { __: function self(_, callback) {
      const button = document.querySelector('#ziwo-main-button');
      if (button == null) return setTimeout(self, 1000, _, callback);
      button.unmarkPrimary();
      return callback(null, null);
    } }, tabId: '$:tabId' })
    .end();

  node.on('unregister-tab', function ({ tabId }) {
    delete tabs[tabId];
  });

  node.on('show-user')
    .then(':execute', { arg: '$:@', fn: { __: function (userId, callback) {
      var a = document.createElement('a');
      a.href = '#/users/' + userId;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return callback(null, null);
    } } })
    .end();

  node.on('find-first-user')
    .memoize(10000, '$:identity')
    .then(':execute', { arg: '$:@', fn: { __: function (user, callback) {
      var path = '/api/v2/search.json?query=type:user';
      if (user.identity) {
        var phoneNumber = new PhoneNumber(user.identity);
        path += '%20phone:*' + phoneNumber.number;
      }
      return jx.load(path, function (err, data) {
        if (err) return callback(err);
        return callback(null, (data.results || {})[0] || null);
      }, 'json', { 'X-CSRF-Token': Runtime.getAuthToken() });
    } } })
    .end();

  node.on('create-user')
    .then(':execute', { arg: '$:@', fn: { __: function (user, callback) {
      return jx.load('/api/v2/users.json', function (err, data) {
        if (err) return callback(err);
        return callback(null, data);
      }, 'json', { 'X-CSRF-Token': Runtime.getAuthToken() }, { user });
    } } })
    .end();

  node.on('get-info')
    .memoize(10000, null)
    .then(':execute', { fn: { __: function (_, callback) {
      return jx.load('/api/v2/users/me', function (err, data) {
        if (err) return callback(err);
        return callback(null, data);
      }, 'json', { 'X-CSRF-Token': Runtime.getAuthToken() });
    } } })
    .end()

  node.on('create-phone-call-record')
    .then('Ziwo:get-api-origin').merge({ ziwo: { origin: '$:@' } })
    .then(':get-info').merge('self', { id: '$:user.id' })
    .then(':find-user', { identity: '$:identity.number' }).merge('user', { id: '$:0.id' })
    .then(':execute', { arg: '$:@', fn: { __: function (infos, callback) {
      var submitter_id = infos.self.id;
      var requester_id = infos.user.id;
      var html_body = [ 'ziwo-phone-call-record'
                      , infos.ziwo.origin
                      , infos.call.id
                      ].join(':');
      var data = { ticket: { status: 'solved', tags: ['ziwo-call-record']
                           , submitter_id, requester_id, subject: 'Ziwo phone call record'
                           , comment: { html_body, 'public': false, author_id: submitter_id }
                           }
                 };
      return jx.load('/api/v2/tickets', function (err, data) {
        if (err) return callback(err);
        return callback(null, data);
      }, 'json', { 'X-CSRF-Token': Runtime.getAuthToken() }, data);
    } } })
    .end();


};
