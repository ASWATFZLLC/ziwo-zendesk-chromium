/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  node.set('domain', 'aswat.co');

  node.set('emitter', new EventEmitter());

  node.on('-setnx', function (flow) {
    var old = this.node.get(flow.prop);
    if (old != null) return false;
    this.node.set(flow.prop, flow.value);
    return true;
  });

  node.on('-emit', function (message) {
    var event = message.event;
    var data = message.data;
    this.node.get('emitter').emit(event, data);
    return message;
  });

};
