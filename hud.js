$(function () {
  $("#combo p").text("x" + 0);
  $("#score p").text(0);

  $(".songAudio").trigger('load');
  $(".songAudio").data("pause", true);

  $(".songAudio").trigger('play');

  function setScore(val) {
    $("#score p").text(val);
  }

  function setCombo(val) {
    $("#combo p").text("x" + val);
  }

  var hBar = $('.health-bar'),
    bar = hBar.find('.bar'),
    hit = hBar.find('.hit');

  function setHealth(percent) {
    var barWidth = percent + "%";
    bar.css('width', barWidth + "%");
  }

  function toggleAudio() {
    if ($(".songAudio").data("pause") === true) {
      $(".songAudio").trigger('play');
      $(".songAudio").data("pause", false);
    } else {
      $(".songAudio").trigger('pause');
      $(".songAudio").data("pause", true);
    }
  }


  $("#wrapper").on("click", function () {
    setHealth(Math.random() * 100);
    setScore(Math.floor(Math.random() * 10000) + 1);
    setCombo(Math.floor(Math.random() * 100) + 1);
    toggleAudio();
  });

  // $(".file_wrapper .button").on("click", function() {
  // 	var reader = new FileReader();
  // 	var mp3File = $("#mp3File").file;
  // 	reader.readAsDataURL(mp3File);
  // 	window.alert("test");
  // 	reader.onload = function(event) {
  // 		the_url = event.target.result;
  // 		window.alert(the_url);
  // 		$(".songAudio").attr("src", the_url).trigger("play");
  // 	}
});
