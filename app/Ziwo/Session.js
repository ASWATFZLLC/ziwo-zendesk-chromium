/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  node.inherit('Chrome.Tab');

  node.set('bootstrap.file', 'js/inject-ziwo.js');
  node.set('domain', 'aswat.co');

  node.on('get-api-hostname')
    .then(':execute', { fn: { __: function (data, callback) {
      var hostname = window.location.hostname.replace('.aswat.co', '-api.aswat.co');
      return callback(null, hostname);
    } } })
    .end()

};
