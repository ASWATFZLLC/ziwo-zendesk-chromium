(function () {

  var Runtime = new function () {

    this.send = function (fqn, flow) {
      var message = { fqn: fqn, flow: flow };
      chrome.runtime.sendMessage(JSON.stringify(message));
    };

    this.publishAuthToken = function () {
      var authToken = localStorage.getItem('x-auth-token');
      if (authToken == null) return ;
      this.send('.Auth:-set', { prop: 'session.token', value: authToken });
    };

    this.publishApiHostname = function () {
      var hostname = window.location.hostname.replace('.aswat.co', '-api.aswat.co');
      this.send(':-setnx', { prop: 'api.hostname', value: hostname });
    };

  };

  Runtime.publishApiHostname();
  Runtime.publishAuthToken();
})();
