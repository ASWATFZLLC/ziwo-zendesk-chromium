Runtime = new function () {

  this.send = function (fqn, flow) {
    var message = { fqn: fqn, flow: flow };
    chrome.runtime.sendMessage(JSON.stringify(message));
  };

};

Runtime.send(':connect');
