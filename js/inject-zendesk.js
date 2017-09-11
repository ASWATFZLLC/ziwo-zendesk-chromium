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
    var meta = document.head.querySelector('meta[name="csrf-token"]');
    if (meta == null) return Runtime.send('Log:error', 'No Zendesk session available');
    var token = meta.content;
    authenticity_token = token;
    Runtime.publishAuthToken();
  })(0);

};

Runtime.send(':connect');

/******************/

jx={getHTTPObject:function(){var A=false;if(typeof ActiveXObject!="undefined"){try{A=new ActiveXObject("Msxml2.XMLHTTP")}catch(C){try{A=new ActiveXObject("Microsoft.XMLHTTP")}catch(B){A=false}}}else{if(window.XMLHttpRequest){try{A=new XMLHttpRequest()}catch(C){A=false}}}return A},load:function(url,callback,format,headers){var http=this.init();if(!http||!url){return }if(http.overrideMimeType){http.overrideMimeType("text/xml")}if(!format){var format="text"}format=format.toLowerCase();var now="uid="+new Date().getTime();url+=(url.indexOf("?")+1)?"&":"?";url+=now;http.open("GET",url,true);for(var i in headers)http.setRequestHeader(i,headers[i]);http.onreadystatechange=function(){if(http.readyState==4){if(http.status==200){var result="";if(http.responseText){result=http.responseText}if(format.charAt(0)=="j"){result=result.replace(/[\n\r]/g,"");result=eval("("+result+")")}if(callback){callback(result)}}else{if(error){error(http.status)}}}};http.send(null)},init:function(){return this.getHTTPObject()}}
