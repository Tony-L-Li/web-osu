$(function () {
  $.get('https://dl.dropboxusercontent.com/u/46950173/web_osu/test2.osu', function (data) {
  	
    var testOsu = new Engine($('.game'), parseNotes(parseOsu(data)), 'https://dl.dropboxusercontent.com/u/46950173/web_osu/test2.mp3');
    
    testOsu.start();
    });
});
