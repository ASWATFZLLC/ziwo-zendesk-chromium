const catchError = function (error) { if (error) console.error(error); };

const Hive = Yolo.create(chrome.runtime.getURL('/'));

Hive.build('Log', catchError);

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

ziwoEE.on('live-calls', Yolo.Util.debounce(function (calls) {
  for (var i = 0; i < calls.length; i++) {
    var call = calls[i];
    var caller = /^0+$/.test(call.callerID) ? call.callerPosition : call.callerID;
    var callId = call.callID;
    console.log('Incoming call', caller, callId);
    Hive.send('Helpdesk:display-end-user', { identity: caller });
  }
}, 200));

Hive.send('Ziwo.Session:bootstrap');
Hive.send('Zendesk.Session:bootstrap');
