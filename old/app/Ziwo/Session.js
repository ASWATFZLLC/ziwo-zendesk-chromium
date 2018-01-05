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
    .end();

  node.on('dial')
    .then(':execute', { arg: '$:number', fn: { __: function (number, callback) {
      var dialler = document.querySelector('.dialler-head input');
      dialler.value = number;
      var event = document.createEvent('HTMLEvents');
      event.initEvent('change', false, true);
      dialler.dispatchEvent(event);
      document.querySelector('.dialler-bottom button').click();
      return callback(null, true);
    } } })
    .end();

  node.on('pickup-call')
    .then(':execute', { fn: { __: function (_, callback) {
      document.querySelector('.dialler-ringing-state-button.answer button').click()
      return callback(null, true);
    } } })
    .end();

  node.on('hangup-call')
    .then(':execute', { fn: { __: function (_, callback) {
      Array.prototype.slice.call(document.querySelectorAll('.dialler-bottom-button button'))
        .filter(n => n.textContent == 'call_end')[0]
        .click()
      return callback(null, true);
    } } })
    .end();

  node.on('get-profile')
    .then(':execute', { fn: { __: function (_, callback) {
      var accessToken = localStorage.getItem('x-auth-token');
      var APIHostname = window.location.hostname.replace('.aswat.co', '-api.aswat.co');
      if (accessToken == null) return callback('Not identified');
      return jx.load('//' + APIHostname + '/profile', function (err, data) {
        if (err) return err.responseText;
        return callback(null, data);
      }, 'json', { access_token: accessToken });
    } } })
    .end();

};
