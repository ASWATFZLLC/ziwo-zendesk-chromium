Runtime = new function () {

  this.send = function (fqn, flow) {
    var message = { fqn: fqn, flow: flow };
    chrome.runtime.sendMessage(JSON.stringify(message));
  };

};

Runtime.send(':connect');

jx = {
  getHTTPObject: function() {
    var A = false;
    if (typeof ActiveXObject != "undefined") {
      try { A = new ActiveXObject("Msxml2.XMLHTTP") }
      catch (C) {
        try { A = new ActiveXObject("Microsoft.XMLHTTP") }
        catch (B) { A = false }
      }
    } else {
      if (window.XMLHttpRequest) {
        try { A = new XMLHttpRequest() }
        catch (C) { A = false }
      }
    }
    return A
  },
    load: function(url, callback, format, headers, data) {
      var http = this.init();
      if (!http || !url) return ;
      if (http.overrideMimeType) http.overrideMimeType("text/xml")
      if (!format) format = "text";
      else format = format.toLowerCase();
      var now = "uid=" + new Date().getTime();
      url += (~url.indexOf("?") ? "&" : "?") + now;
      http.open(data ? 'POST' : "GET", url, true);
      if (data) headers['Content-Type'] = 'application/json';
      for (var i in headers) http.setRequestHeader(i, headers[i]);
      http.onreadystatechange = function () {
        if (http.readyState == 4) {
          if (http.status == 200 || http.status == 201) {
            var result = "";
            if (http.responseText) result = http.responseText;
            if (format.charAt(0) == "j")
              result = eval("(" + result.replace(/[\n\r]/g, "") + ")");
            if (callback) return callback(null, result);
          } else if (http.status < 400) {
            return callback(null, http.responseText);
          } else {
            return callback(http);
          }
        }
      };
      http.send(data ? JSON.stringify(data) : null);
    },
    init: function() {
      return this.getHTTPObject()
    }
}
