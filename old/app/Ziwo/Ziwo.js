/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  node.inherit('LocalStorage.Record');
  node.set('storage.prefix', 'ziwo.base');

  node.set('emitter', new EventEmitter());

  node.set('api.protocol', 'https');

  node.field('api.hostname', 'Primitive.String');

  node.on('-emit', function (message) {
    var event = message.event;
    var data = message.data;
    this.node.get('emitter').emit(event, data);
    return message;
  });

  node.on('get-api-origin')
    .memoize(600, null)
    .Match('#:api.hostname')
    .  WhenType('String')
    .    as('$:@').merge('hostname')
    .  Otherwise()
    .    then(':pull', { api: { hostname: {} } }).dismiss()
    .    Match('#:api.hostname')
    .      WhenEquiv(null)
    .        then('.Session:get-api-hostname').merge('hostname')
    .      Otherwise()
    .        as('#:api.hostname').merge('hostname')
    .      end()
    .  end()
    .as('%:#{api.protocol}://${hostname}')
    .end()

};
