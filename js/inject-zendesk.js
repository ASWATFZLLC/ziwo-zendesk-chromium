Runtime = new function () {
  var Runtime = this;

  this.send = function (fqn, flow) {
    var message = { fqn: fqn, flow: flow };
    chrome.runtime.sendMessage(JSON.stringify(message));
  };

  this.getAuthToken = (function () {
    var authenticity_token = null;
    (function wait(count) {
      if (count == 5) return Runtime.send('Log:alert', 'Please reload Zendesk page');
      if (document.head == null) return setTimeout(wait, 1, count + 1);
      var token = document.head.querySelector('meta[name="csrf-token"]').content;
      authenticity_token = token;
      return Runtime.send('.Auth:-set', { prop: 'session.token', value: token });
    })(0);
    return function () { return authenticity_token; };
  })();

  this.publishAuthToken = function () {
    var token = this.getAuthToken();
    return this.send('.Auth:-set', { prop: 'session.token', value: token });
  };

  this.publishApiHostname = function () {
    var hostname = window.location.hostname;
    this.send(':-set', { prop: 'api.hostname', value: hostname });
  };

};

Runtime.publishApiHostname();
Runtime.publishAuthToken();

/******************/

jx={getHTTPObject:function(){var A=false;if(typeof ActiveXObject!="undefined"){try{A=new ActiveXObject("Msxml2.XMLHTTP")}catch(C){try{A=new ActiveXObject("Microsoft.XMLHTTP")}catch(B){A=false}}}else{if(window.XMLHttpRequest){try{A=new XMLHttpRequest()}catch(C){A=false}}}return A},load:function(url,callback,format,headers){var http=this.init();if(!http||!url){return }if(http.overrideMimeType){http.overrideMimeType("text/xml")}if(!format){var format="text"}format=format.toLowerCase();var now="uid="+new Date().getTime();url+=(url.indexOf("?")+1)?"&":"?";url+=now;http.open("GET",url,true);for(var i in headers)http.setRequestHeader(i,headers[i]);http.onreadystatechange=function(){if(http.readyState==4){if(http.status==200){var result="";if(http.responseText){result=http.responseText}if(format.charAt(0)=="j"){result=result.replace(/[\n\r]/g,"");result=eval("("+result+")")}if(callback){callback(result)}}else{if(error){error(http.status)}}}};http.send(null)},init:function(){return this.getHTTPObject()}}
