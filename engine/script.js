$(function () {
  var testOsu = new Engine($('.game'));
  $.get('https://dl.dropboxusercontent.com/u/46950173/web_osu/test.osu', function (data) {
    console.log(parseOsu(data));
  });
  testOsu.start();
})
