function parseOsu(rawOsu) {
  var BeatMap = {};

  rawOsu.replace(/^\[(.*)\]$((\r\n.+)*)/gm, function (_, header, body) {
    body = body.substring(1);
    switch (header) {
    case 'General':
      body.replace(/^([a-z]+):\s*(.*)/gmi, function (_, key, value) {
        BeatMap[key] = isNaN(value) ? value : +value;
      });
      break;
    case 'Metadata':
      body.replace(/^([a-z]+):\s*(.*)/gmi, function (_, key, value) {
        BeatMap[key] = value;
      });
      break;
    case 'Difficulty':
      body.replace(/^([a-z]+):\s*(.*)/gmi, function (_, key, value) {
        BeatMap[key] = isNaN(value) ? value : +value;
      });
      break;
    case 'TimingPoints':
      body.replace(/^(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*)/gmi, function (_, Offset, MillisecondsPerBeat, Meter, SampleType, SampleSet, Volume, Inherited, KiaiMode) {
        BeatMap["TimingPoints"] = {
          "Offset": +Offset,
          "MillisecondsPerBeat": +MillisecondsPerBeat,
          "Meter": +Meter,
          "SampleType": +SampleSet,
          "Volume": +Volume,
          "Inherited": +Inherited,
          "KiaiMode": +KiaiMode
        };
      });
      break;
    case 'HitObjects':
      var lines = body.split("\n");
      var hitObjs = [];
      for (var i = 0; i < lines.length; i++) {
        if (/^([0-9]*),([0-9]*),([0-9]*),(1|5),([0-9]*)/.test(lines[i])) {
          var circle = {};
          lines[i].replace(/^([0-9]*),([0-9]*),([0-9]*),([0-9]*),([0-9]*)/, function (_, x, y, time, type, hitSound) {
            circle = {
              "x": +x,
              "y": +y,
              "time": +time,
              "type": +type,
              "hitSound": +hitSound
            };
          });
          hitObjs.push(circle);
        } else if (/\|/.test(lines[i])) {
          var slider = {};
          lines[i].replace(/^([0-9]*),([0-9]*),([0-9]*),([0-9]*),([0-9]*),([CBLP](\|[0-9]*:[0-9]*)*),([0-9]*),/, function (_, x, y, time, type, hitSound, properties, __, repeat) {
            slider = {
              "time": +time,
              "type": +type,
              "hitSound": +hitSound,
              "sliderType": properties.substring(0, 1),
              "repeat": +repeat
            };
            slider.curvePoints = [];
            slider.curvePoints.push({
              "x": +x,
              "y": +y
            });
            var arr = properties.substring(2).split("|");
            for (var j = 0; j < arr.length; j++) {
              arr[j].replace(/^([0-9]*):([0-9]*)$/, function (_, cX, cY) {
                var point = {
                  "x": +cX,
                  "y": +cY
                };
                slider.curvePoints.push(point);
              });
            }
          });
          hitObjs.push(slider);
        } else if (/^([0-9]*),([0-9]*),([0-9]*),(8|12),([0-9]*),([0-9]*)/.test(lines[i])) {
          var spinner = {};
          lines[i].replace(/^([0-9]*),([0-9]*),([0-9]*),([0-9]*),([0-9]*),([0-9]*)/, function (_, x, y, time, type, hitSound, endTime) {
            spinner = {
              "x": +x,
              "y": +y,
              "time": +time,
              "type": +type,
              "hitSound": +hitSound,
              "endTime": +endTime
            };
          });
          hitObjs.push(spinner);
        }
      }
      BeatMap["HitObjects"] = hitObjs;
      break;
    }
  });
  return BeatMap;
}
