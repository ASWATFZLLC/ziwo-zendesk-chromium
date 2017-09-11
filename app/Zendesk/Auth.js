/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  node.kind('Record');

  node.inherit('LocalStorage.Record');
  node.set('storage.prefix', 'zendesk.auth');

  node.field('type', 'Primitive.String');
  node.field('session.token', 'Primitive.String');

  node.on('set-auth-token', function ({ token }) {
    this.node.set('session.token', token);
  });

};
