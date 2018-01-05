Runtime = new function () {
  var Runtime = this;
  var authenticity_token = null;

  this.send = function (fqn, flow) {
    var message = { fqn: fqn, flow: flow };
    chrome.runtime.sendMessage(JSON.stringify(message));
  };

  this.getAuthToken = function () {
    return authenticity_token;
  };

  this.publishAuthToken = function () {
    var token = this.getAuthToken();
    return this.send('Zendesk.Auth:set-auth-token', { token });
  };

  (function fetch_authenticity_token(count) {
    if (count == 5) return Runtime.send('Log:error', 'No Zendesk session available');
    if (document.head == null) return setTimeout(fetch_authenticity_token, 1, count + 1);
    document.head.appendChild(function (script) {
      script.src = chrome.runtime.getURL('js/libs/audiojs/audio.min.js');
      return script;
    }(document.createElement('script')));
    document.head.appendChild(function (script) {
      script.src = chrome.runtime.getURL('js/frame-zendesk.js');
      return script;
    }(document.createElement('script')));
    var meta = document.head.querySelector('meta[name="csrf-token"]');
    if (meta == null) return Runtime.send('Log:error', 'No Zendesk session available');
    var token = meta.content;
    authenticity_token = token;
    Runtime.publishAuthToken();
  })(0);

};

Runtime.send(':connect');

(function inject_ziwo_area() {
  var ziwoBlock = document.querySelector('#main_navigation .ziwo-block');
  var nav = document.querySelector('#main_navigation');
  if (!nav) {
    if (/[^a-z0-9]analytics\./.test(window.location + '')) return ;
    return setTimeout(inject_ziwo_area, 1000);
  }
  if (ziwoBlock) nav.removeChild(ziwoBlock);

  nav.appendChild(function (block) {
    block.className = 'ziwo-block';
    block.style.position = 'absolute';
    block.style.bottom = '6px';
    block.style.textAlign = 'center';
    block.style.width = '100%';
    block.appendChild(function (call) {
      call.src = chrome.runtime.getURL('images/ringing.gif');
      call.style.width = '55%';
      call.style.cursor = 'pointer';
      call.style.display = 'none';
      call.onclick = function () {
        alert(42);
      };
      return call;
    }(document.createElement('img')));
    block.appendChild(function (logo) {
      logo.id = 'ziwo-main-button';
      logo.isPrimary = true;
      logo.src = chrome.runtime.getURL('images/ds_icon_48.png');
      logo.style.width = '55%';
      logo.style.cursor = 'pointer';
      logo.onclick = function () {
        if (this.isPrimary) {
          // Already Primary
        } else {
          Runtime.send(':request-primary', {})
        }
      };
      logo.unmarkPrimary = function () {
        this.isPrimary = false;
        this.style.cursor = 'pointer';
        this.style.filter = 'grayscale(100%)';
        this.style.opacity = '0.7';
      };
      logo.markPrimary = function () {
        this.isPrimary = false;
        this.style.filter = '';
        this.style.opacity = '1';
        this.style.cursor = 'default';
      };
      return logo;
    }(document.createElement('img')));
    return block;
  }(document.createElement('div')));
})();

(function () {
  if (Runtime.onChangHooked) return ;

  document.addEventListener('DOMCharacterDataModified', debounce(handleDomChange, 250), true);
  document.addEventListener('DOMNodeInserted'         , debounce(handleDomChange, 250), true);

  var isPhoneNumber = /(^|\s)((((\+|(00))[1-9]\d{0,3}[\s\-.]?)?\d{2,4}[\s\/\-.]?)|21)\d{5,9}(\s|$)/;
  var isPhoneRecord = /^ziwo-phone-call-record:(.+):([0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12})$/;
  var notraverseTags = { script: true, style: true };

  function handleDomChange () {
    return (function walk(dom, phoneArea) {
      switch (dom && dom.nodeType) {
      case 1: case 9: case 11:
        var nodeName = (dom.nodeName || '').toLowerCase();
        var classes = (dom.className + '').split(' ');
        if (~classes.indexOf('main_panes') && ~classes.indexOf('user')) phoneArea = true;
        for (var child = dom.firstChild; child; child = child.nextSibling) {
          if (nodeName in notraverseTags) continue ;
          walk(child, phoneArea);
        }
        return ;
      case 3:
        var text = dom.textContent;
        if (text.charCodeAt(0) == 173) return ;
        if (phoneArea) {
          (function (match) {
            if (!match) return ;
            addClickToCall(dom, match);
          })(isPhoneNumber.exec(text));
        }
        (function (match) {
          if (!match) return ;
          addPhoneCallRecordPlayer(dom, match);
        })(isPhoneRecord.exec(text));
      }
      })(window.document.body, false);
  }

  function addPhoneCallRecordPlayer(dom, match) {
    var src = match[1] + '/surveillance/recordings/' + match[2] + '.mp3';
    var audio = document.createElement('audio');
    audio.src = src;
    dom.parentNode.insertBefore(audio, dom);
    dom.parentNode.removeChild(dom);
    var event = new Event('audiojs-wrap');
    audio.dispatchEvent(event);
  }

  function addClickToCall(dom, match) {
    var text = dom.textContent;
    var frag = document.createDocumentFragment();
    var span = document.createElement('span');
    span.innerHTML = '&shy;' + match[0];
    var img = document.createElement('img');
    img.src = chrome.runtime.getURL('images/ds_icon_48.png');
    img.style.height = '1em';
    img.style.verticalAlign = 'sub';
    img.style.margin = '0 0.25em';
    img.style.cursor = 'pointer';
    img.onclick = makeCall(match[0]);
    if (match.index > 0)
      frag.appendChild(document.createTextNode(text.substr(0, match.index)));
    frag.appendChild(span.firstChild);
    frag.appendChild(img);
    var end = text.substr(match.index + match[0].length);
    if (end != '') frag.appendChild(document.createTextNode(end));
    dom.parentNode.insertBefore(frag, dom);
    dom.parentNode.removeChild(dom);
  }

  function makeCall(phoneNumber) {
    return function () {
      var pn = new PhoneNumber(phoneNumber);
      Runtime.send('Ziwo.Session:dial', { number: pn.toString() });
    };
  }

})();


/******************/

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


function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

function PhoneNumber(number) {
  number = (number + '').replace(/[^\d]/g, '');

  if (~number.indexOf('ziwo:')) {

    this.indicatif = '';
    this.number = number.substr(5);

  } else {

    const getIndicatif = /^(1(?:2(?:4[26]|6[48]|84)|34[05]|4(?:41|73)|6(?:49|64|7[01]|84)|7(?:21|58|67|8[47])|8(?:[024]9|6[89]|76)|939)?|2(?:[07]|1[1-368]|[2-46]\d|5[0-8]|9[017-9])|3(?:[0-469]|[57]\d|8[0-35-79])|4(?:[013-9]|2[013])|5(?:[09]\d|[1-8])|6(?:[0-6]|7[02-9]|8[0-35-9]|9[0-2])|7|8(?:00|[1246]|5[02356]|8[016])|9(?:[0-58]|6[0-8]|7[0-7]|9[2-68]))/;

    var indicatif = getIndicatif.exec(number);
    this.indicatif = indicatif ? indicatif[1] : '';
    this.number = number.substr(indicatif.length);
  }

  this.toString = function () {
    return this.indicatif + this.number;
  };
}
