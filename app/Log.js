/*!UroxGvT3uDMQCT1va20i43ZZSxo*/
export default function (node, logger) {
  node.on('error', function (message) {
    console.error(message);
  });

  node.on('alert', function (message) {
    alert(message);
  });
};
