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

const catchError = function (error) { if (error) console.error(error); };

const Hive = Bhiv.create(chrome.runtime.getURL('/'));

Hive.build('Log', catchError);
Hive.build('Type', catchError);

Hive.build('Ziwo', catchError);
Hive.build('Ziwo.Agent', catchError);
Hive.build('Ziwo.Auth', catchError);
Hive.build('Ziwo.Channel', catchError);
Hive.build('Ziwo.Session', catchError);

Hive.build('Helpdesk', catchError);

Hive.build('Zendesk', catchError);
Hive.build('Zendesk.Auth', catchError);
Hive.build('Zendesk.Session', catchError);

const ziwoEE = Hive.getChild('Ziwo').get('emitter');

ziwoEE.on('live-calls', Bhiv.Util.debounce(function (calls) {
  for (var i = 0; i < calls.length; i++) {
    var call = calls[i];
    if (call.direction == 'outbound') continue ;
    var caller = /^0+$/.test(call.callerID) ? ('ziwo:' + call.callerPosition) : call.callerID;
    var callId = call.callID;
    console.log('Incoming call', caller, callId);
    Hive.begin()
      .then('Helpdesk:display-end-user').merge()
      .then('Zendesk.Session:create-phone-call-record').merge()
      .end({ identity: caller, call: { id: callId } }, function (err, result) {
        if (err) console.error(err);
      });
  }
}, 800));

Hive.send('Ziwo.Session:bootstrap');
Hive.send('Zendesk.Session:bootstrap');
