document.addEventListener('audiojs-wrap', function (e) {
  //audiojs.create(e.target);

  audiojs.events.ready(function() {
    var as = audiojs.createAll();
  });
  //audiojs.events.
}, true);
