/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  node.kind('Record');

  node.inherit('LocalStorage.Record');
  node.set('storage.prefix', 'ziwo.auth');

  node.field('type', 'Primitive.String');
  node.field('session.token', 'Primitive.String');
  node.field('agent.username', 'Primitive.String');
  node.field('agent.password', 'Primitive.String');

  node.on('-load', function (flow, callback) {
    return this.node.begin()
      .then(':fetch', { type: {} })
      .then(function ({ type }) {
        if (type == null) type = 'session';
        this.node.set('type', type);
        return { type };
      }).merge()
      .then(':pull', { agent: { username: {}, password: {} } }).merge()
      .end({}, error => {
        if (error) return callback(error);
        else return callback(null, flow);
      });
  });

  node.on('-set', function (flow) {
    this.node.set(flow.prop, flow.value);
    return true;
  });

  node.on('get-token', function (data, callback) {
    var type = this.node.get('type');
    if (type == 'session') {
      var token = this.node.get('session.token');
      if (token != null) return callback(null, token);
      else return callback('No session available');
    } else if (type == 'agent-user-password') {
      var username = this.node.get('agent.username');
      var password = this.node.get('agent.password');
      if (username == null || password == null) return callback('Missing agent credentials');
      return callback('Agent authentication not yet implemented');
    } else {
      return callback('Unknown authentication type');
    }
  });

};
