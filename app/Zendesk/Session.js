/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {

  node.inherit('Chrome.Tab');

  node.set('domain', 'zendesk.com');
  node.set('bootstrap.file', 'js/inject-zendesk.js');

};
