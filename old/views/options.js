$(function () {

  var jqev = function (str) { return '"' + (str + '').replace(/([^a-z.\-])/g, '\\$1') + '"'; };

  $('body').on('change', '.azc-section-selector', function () {
    var name = $(this).attr('name');
    var value = $(this).val();
    var $set = $('.azc-section-condition').filter('[x-section-selector=' + jqev(name) + ']');
    $set.hide().filter('[x-section-when=' + jqev(value) + ']').show();
  });

  chrome.runtime.getBackgroundPage(function (background) {

    debugger;
    var Runtime = background.YCE.Root;

    $('.azc-form-field').find('input,select,textarea').each(function () {
      var name = $(this).attr('name');
      if (name == null) return ;
      return Runtime.send(name, {}, function () {
        debugger;
        console.log(name);
      });
    });

  });

});
