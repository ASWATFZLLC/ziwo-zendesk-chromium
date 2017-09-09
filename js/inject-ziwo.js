(function () {

  var Runtime = new function () {

    this.publishAuthToken = function () {
      var authToken = localStorage.getItem('x-auth-token');
      if (authToken == null) return ;
      var message = { type: 'event', key: 'auth-token', value: authToken };
      chrome.runtime.sendMessage(JSON.stringify(message));
    };

    this.publishApiOrigin = function () {
      var origin = window.location.origin.replace('.aswat.co', '-api.aswat.co');
      var message = { type: 'event', key: 'api-origin', value: origin };
      chrome.runtime.sendMessage(JSON.stringify(message));
    };

  };

  Runtime.publishApiOrigin();
  Runtime.publishAuthToken();
})();
