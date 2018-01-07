document.head.appendChild(function (script) {
  script.src = chrome.runtime.getURL('vendor/audiojs/index.js');
  return script;
}(document.createElement('script')));

/********************************************/

var ZendeskAdapter = function ZendeskTab(window) {
  this.window       = window;
  this.api_origin   = this.window.location.origin + '/api/v2';
  this.initiate();
  if (this.isLogged())
    this.publish('LoggedTabAppend', { auth: this.getAuthToken() });
};

ZendeskAdapter.prototype.request = function (method, path, data, callback) {
  if (method.toLowerCase() == 'get') { callback = data; data = null; }
  var payload = { url: this.api_origin + path, method: method };
  payload.headers = {};
  payload.headers['X-CSRF-Token'] = this.getAuthToken();
  if (data != null) payload.data = data;
  payload.success = function (value) {
    return callback(null, value);
  };
  payload.error = function (err) {
    return callback(err);
  };
  return jQuery.ajax(payload);
};

ZendeskAdapter.prototype.isLogged = function () {
  return this.getAuthToken() != null
};

ZendeskAdapter.prototype.getAuthToken = function () {
  return $('html head meta[name=csrf-token]').attr('content') || null;
};

ZendeskAdapter.prototype.searchUserByPhoneNumber = function (identity, callback) {
  var path = '/search.json?query=type:user%20phone:*' + identity;
  return this.request('get', path, callback);
};

ZendeskAdapter.prototype.createUser = function (user, callback) {
  return this.request('post', '/users', { user: user }, callback);
};

ZendeskAdapter.prototype.displayUser = function (userId) {
  var a = document.createElement('a');
  a.href = '#/users/' + userId;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/*
ZendeskAdapter.prototype.search = function (identity, callback) {
  return this.request('get', '/api/v2/search.json?query=' + identity, null, callback);
};

ZendeskAdapter.prototype.setAsPrimary = function () {
  const button = document.querySelector('#ziwo-main-button');
  if (button == null) return setTimeout(self, 1000, _, callback);
  button.markPrimary();
};

ZendeskAdapter.prototype.unsetAsPrimary = function () {
  const button = document.querySelector('#ziwo-main-button');
  if (button == null) return setTimeout(self, 1000, _, callback);
  button.markPrimary();
};
*/

/**********************************/

ZendeskAdapter.prototype.OnLoggedTabAppend = function (event) {
  
};

/**********************************/

ZendeskAdapter.prototype.publish = function (eventType, data, options, callback) {
  var event = { eventType: eventType, data: data, options: options };
  return this.send('publish', event, callback);
};

ZendeskAdapter.prototype.initiate = function (callback) {
  return this.send('initiate', {}, callback);
};

ZendeskAdapter.prototype.send = function (type, event, callback) {
  event.categoryName = this.constructor.name;
  var payload = { type: type, event: event };
  if (type == 'publish' && this['On' + event.eventType])
    this['On' + event.eventType](event);
  return chrome.runtime.sendMessage(payload, function (args) {
    if (callback == null) return ;
    return callback.apply(this, args);
  });
};

var adapter = new ZendeskAdapter(window);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  return adapter[request.method].apply(adapter, request.params.concat(function () {
    if (request.callbackId == null) return ;
    adapter.publish('Response', { id: request.callbackId, data: Array.prototype.slice.call(arguments) });
  }));
});

/**********************************/

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

var PhoneNumber = function (number) {
  number = (number + '').replace(/[^\d]/g, '');
  var getIndicatif = /^(1(?:2(?:4[26]|6[48]|84)|34[05]|4(?:41|73)|6(?:49|64|7[01]|84)|7(?:21|58|67|8[47])|8(?:[024]9|6[89]|76)|939)?|2(?:[07]|1[1-368]|[2-46]\d|5[0-8]|9[017-9])|3(?:[0-469]|[57]\d|8[0-35-79])|4(?:[013-9]|2[013])|5(?:[09]\d|[1-8])|6(?:[0-6]|7[02-9]|8[0-35-9]|9[0-2])|7|8(?:00|[1246]|5[02356]|8[016])|9(?:[0-58]|6[0-8]|7[0-7]|9[2-68]))/;
  var indicatif = getIndicatif.exec(number);
  this.indicatif = indicatif ? indicatif[1] : '';
  this.number = number.substr(indicatif.length);
}
PhoneNumber.prototype.toString = function () {
  return this.indicatif + this.number;
};

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
      call.src = chrome.runtime.getURL('ui/images/ringing.gif');
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
      logo.src = chrome.runtime.getURL('ui/images/ds_icon_48.png');
      logo.style.width = '55%';
      logo.style.cursor = 'pointer';
      logo.onclick = function () {
        if (this.isPrimary) {
          // Already Primary
        } else {
          adapter.setAsPrimary();
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
    img.src = chrome.runtime.getURL('ui/images/ds_icon_48.png');
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
      adapter.publish('ClickToCallClicked', { number: pn.toString() });
    };
  }

})();
