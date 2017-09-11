/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  node.on('-set', function (flow) {
    this.node.set(flow.prop, flow.value);
    return true;
  });

  node.on('display-end-user')
    .then('.Session:execute', { arg: '$:@', fn: { __: function (userId, callback) {
      var a = document.createElement('a');
      a.href = '#/users/' + userId;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return callback(null, null);
    } } })
    .end();

  node.on('find-user')
    .then('.Session:execute', { arg: '$:@', fn: { __: function (user, callback) {
      return jx.load('/api/v2/search.json?query=' + user.identity, function (data) {
        return callback(null, data.results);
      }, 'json', { 'X-CSRF-Token': Runtime.getAuthToken() });
    } } })
    .end();

  node.on('create-end-user')
    .then('.Session:execute', { arg: '$:@', fn: { __: function (user, callback) {
      alert('create end-user for: ' + user.identity);
    } } })
    .end();

};
