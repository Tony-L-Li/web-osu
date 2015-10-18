function Engine(container, songData, songUrl) {
  function createCanvas(name, layer) {
    return $('<canvas>', {
      class: 'game-canvas',
      id: name,
      css: {
        'z-index': layer
      },
      attr: {
        height: container.height() + 'px',
        width: container.height() + 'px'
      }
    });
  }

  function resizeCanvas() {
    var curDim = Math.min(self.root.height(), self.root.width());
    _.each(self.e, function(v, k) {
      v.attr({
        'height': curDim * 524 / 612 + 'px',
        'width': curDim + 'px'
      });
    });
    self.scale = curDim / self.maxArea;
  }

  var self = this;
  this.root = container;
  this.songData = songData.HitObjects;
  this.metaData = songData;
  this.colorArray = '';
  this.audio = new Audio(songUrl);

  this.currentTime = -1;
  this.c = {};
  this.e = {
    buffer: createCanvas('buffer', 0),
    bg: createCanvas('bg', 0),
    ui: createCanvas('ui', 1),
    note: createCanvas('note', 2),
    sliderCircle: createCanvas('slider-circle', 3),
    cursorArea: createCanvas('cursor-area', 4)
  };
  this.scale = this.root.height() / self.maxArea;

  _.forOwn(this.e, function(x, key) {
    if (key === 'buffer') return;
    x.appendTo(self.root);
  });

  resizeCanvas();
  //resize
  $(window).resize(function() {
    resizeCanvas();
  });

  //setup
  this.e.bg.css('background-color', '#333');

  //get all canvas contexts
  _.each(self.e, function(v, k) {
    self.c[k] = v[0].getContext('2d');
  });

  //METADATA
  this.ar = 9;
  this.arConst = 30;
  this.circleSize = this.metaData.CircleSize * 7;
}

Engine.prototype = {
  //turn on for engine debugging
  debug: {
    lifecycle: false,
    path: false
  },
  maxArea: 612,
  maxWidth: 512,
  maxHeight: 384,
  health: 1,
  accuracy: 0.4545,
  /*
  initOffscreenCanvases: function() {
    function getNoteCanvas(note) {
      var buffer = document.createElement('canvas');
      var ctx = buffer.getContext('2d');
      var size = this.metaData.CircleSize * 9;

      buffer.width = 
      drawCircle()
    }

    var self = this;

    _.forEach(self.songData, function(note) {

    });
  },*/
  drawHealth: function(ctx) {
    var HEALTH_LEN = 300;
    var HEALTH_THICK = 8;

    ctx.save();
    ctx.fillStyle = '#FFF';
    ctx.fillRect(10, 10, HEALTH_LEN * this.health, HEALTH_THICK);
    ctx.restore();
  },
  drawUIScore: function(ctx) {
    //draw score
    ctx.font = '25px Nova Square';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'right';
    ctx.fillText('00100020', 605, 25);

    //percentage
    ctx.font = '15px Nova Square';
    ctx.fillText((this.accuracy * 100).toFixed(2) + '%', 605, 40);

    var tempComp = 0.4;
    //completion
    var cLeft = 530;
    var cTop = 35;

    ctx.fillStyle = '#AAA';
    ctx.beginPath();
    ctx.arc(cLeft, cTop, 7, 1.5 * Math.PI, 2 * Math.PI * tempComp);
    ctx.lineTo(cLeft, cTop);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(cLeft, cTop, 7, 0, 2 * Math.PI);
    ctx.moveTo(cLeft, cTop);
    ctx.arc(cLeft, cTop, 0.5, 0, 2 * Math.PI);
    ctx.stroke();
  },
  start: function() {
    var self = this;
    console.log(self.metaData);
    console.log(self.songData);
    //queues for different stages of notes
    self.entranceQueue = {
      start: 0,
      end: 0
    };
    self.playQueue = {
      start: 0,
      end: 0
    };
    self.exitQueue = {
      start: 0,
      end: 0
    };

    self.audio.volume = 0.0;
    self.audio.currentTime = 40.5;
    self.audio.play();
    self.render();
  },
  getSliderPos: function(percentage, posArr, length) {
    //Test Paths
    var self = this;

    if (self.debug.path) {
      self.c.sliderCircle.save();
      self.c.sliderCircle.strokeStyle = '#ffffff';
      _.forEach(posArr, function(val) {
        self.c.sliderCircle.beginPath();
        self.c.sliderCircle.arc(val.x, val.y, 4, 0, Math.PI * 2);

        self.c.sliderCircle.stroke();
      });
      self.c.sliderCircle.restore();
    }


    var index = Math.min(Math.floor(percentage * length / 10), posArr.length - 1);
    var progress = (percentage * length / 10) - index;
    var next = 1;
    if (index >= posArr.length - 1) next = 0;

    return {
      x: posArr[index].x + (posArr[index + next].x - posArr[index].x) *
        progress,
      y: posArr[index].y + (posArr[index + next].y - posArr[index].y) *
        progress
    }
  },
  render: function() {
    var self = this;
    var noteC = self.c.note;
    var sliderC = self.c.sliderCircle;
    var scaledArea = self.maxArea * self.scale;
    self.c.note.clearRect(0, 0, scaledArea, scaledArea);
    self.c.sliderCircle.clearRect(0, 0, scaledArea, scaledArea);
    self.c.buffer.clearRect(0, 0, scaledArea, scaledArea);

    _.each(self.c, function(v, k) {
      v.save();
      if (k === 'note' || k === 'cursorArea' || k === 'sliderCircle' ||
        k ===
        'buffer') {
        if (k === 'buffer' || k === 'sliderCircle') {
          v.translate(50 * self.scale, 90 * self.scale);
          v.scale(self.scale, self.scale);
        }
      } else {
        v.scale(self.scale, self.scale);
      }
    });

    //sets UI layer
    self.c.ui.clearRect(0, 0, self.maxArea, self.maxArea);
    self.drawHealth(self.c.ui);
    self.drawUIScore(self.c.ui);


    var fadeInTime = self.ar * 3 * self.arConst;
    var noteSolidTime = self.ar * self.arConst / 2;
    noteSolidTime = 0;
    var fadeOutTime = self.ar * self.arConst;
    var sliderSolidFactor = 3 * (1 / self.metaData.SliderMultiplier);

    var curTime = self.audio.currentTime * 1000;


    //configure entrance queue
    while (true) {
      var curNoteTime = self.songData[self.entranceQueue.end].time;

      if (curNoteTime - fadeInTime <= curTime) {
        // pushes into entrance queue
        self.entranceQueue.end++;
      } else {
        break;
      }
    }

    while (true) {
      //console.log('%f %f',self.entranceQueue.start, self.entranceQueue.end);
      if (self.songData[self.entranceQueue.start].time <= curTime) {
        // pops out of entrance queue
        self.entranceQueue.start++;
        // pushes into play queue
        self.playQueue.end++;
      } else {
        break;
      }
    }

    while (true) {
      var curSong = self.songData[self.playQueue.start];
      var curSongType = curSong.type;
      var curNoteTime = curSong.time;
      var sliderTime;

      if (curSongType != null) sliderTime = curSong.length *
        sliderSolidFactor * curSong.repeat;

      if ((curSongType == null && curNoteTime + noteSolidTime <= curTime) ||
        (curSongType != null && curNoteTime + noteSolidTime + sliderTime <=
          curTime)) {
        // pops out of play queue
        self.playQueue.start++;
        // pushes into exit queue
        self.exitQueue.end++;
      } else {
        break;
      }
    }

    while (true) {
      var curSong = self.songData[self.exitQueue.start];
      var curSongType = curSong.type;
      var curNoteTime = curSong.time;
      var sliderTime;

      if (curSongType != null) sliderTime = curSong.length *
        sliderSolidFactor * curSong.repeat;

      if ((curSongType == null && curNoteTime + noteSolidTime + fadeOutTime <=
          curTime) ||
        (curSongType != null && curNoteTime + noteSolidTime + sliderTime +
          fadeOutTime <= curTime)) {
        // pops out of exit queue
        self.exitQueue.start++;
      } else {
        break;
      }
    }
    var buffer = self.c.buffer;
    var bufferCanvas = self.e.buffer[0];


    // RENDER NOTES
    // Everything has be rendered in reverse order (Kind of... not sure... it works...)
    function drawNotesIteration(curNote, opacity, drawAC, isExit) {
      var size = self.circleSize;

      if (isExit) size = size * (1 + (curStage * 0.35));
      if (curNote.type == null) {
        drawCircle(curNote.x, curNote.y, curNote.number, size,
          curNote.color, buffer);

        if (drawAC) drawApproachCircle(curNote.x, curNote.y, self.circleSize,
          curNote.color,
          curStage, buffer);
      } else {
        switch (curNote.type) {
          case 'line':
            drawLine(curNote.points, self.circleSize, '#ffffff', buffer);
            break;
          case 'arc':
            drawArc(curNote.arc, self.circleSize, '#ffffff', buffer);
            break;
          case 'bezier':
            drawBezier(curNote.points, self.circleSize, '#ffffff', buffer);
            break;
        }
        if (curNote.type === 'bezier') {
          var lastElem = curNote.points[curNote.points.length - 1];
          lastElem = lastElem[lastElem.length - 1];
          drawCircle(lastElem.x, lastElem.y, '', size, curNote.color,
            buffer);
          drawCircle(curNote.points[0][0].x, curNote.points[0][0].y,
            curNote.number, size, curNote.color, buffer);

          if (drawAC) drawApproachCircle(curNote.points[0][0].x, curNote.points[
              0][0].y, self.circleSize, curNote.color,
            curStage, buffer);
        } else {
          var lastElem = curNote.points[curNote.points.length - 1];
          drawCircle(lastElem.x, lastElem.y, '', size, curNote.color,
            buffer);
          drawCircle(curNote.points[0].x, curNote.points[0].y, curNote.number,
            size, curNote.color, buffer);

          if (drawAC) drawApproachCircle(curNote.points[0].x, curNote.points[
              0].y, self.circleSize, curNote.color,
            curStage, buffer);
        }
      }

      noteC.globalAlpha = opacity;
      noteC.drawImage(bufferCanvas, 0, 0);
      buffer.clearRect(0, 0, self.maxArea, self.maxArea);
    }

    function drawStatusCircle(curNote, color, number) {
      var x, y;
      self.c.sliderCircle.save();
      self.c.sliderCircle.fillStyle = color;
      self.c.sliderCircle.beginPath();

      if (curNote.type == null) {
        x = curNote.x;
        y = curNote.y;

      } else {
        if (curNote.type === 'bezier') {
          x = curNote.points[0][0].x;
          y = curNote.points[0][0].y;
        } else {
          x = curNote.points[0].x;
          y = curNote.points[0].y;
        }
      }

      self.c.sliderCircle.arc(x, y, 4, 0, Math.PI * 2);
      self.c.sliderCircle.fill();
      self.c.sliderCircle.fillStyle = '#ffffff';
      self.c.sliderCircle.fillText(number.toString(), x, y + 12);
      self.c.sliderCircle.restore();
    }

    //renders entrance
    for (var i = self.entranceQueue.end - 1; i >= self.entranceQueue.start; i--) {
      var curNote = self.songData[i];
      var opacity = 1 - ((curNote.time - curTime) / fadeInTime);
      var curStage = opacity;

      opacity = Math.min(1, Math.pow(opacity * 2, 2.5));
      drawNotesIteration(curNote, opacity, true);

      if (self.debug.lifecycle) drawStatusCircle(curNote, '#2ECC40', i);
    }

    //renders play
    for (var i = self.playQueue.end - 1; i >= self.playQueue.start; i--) {
      var curNote = self.songData[i];
      var opacity = 1;
      drawNotesIteration(curNote, opacity, false);

      if (curNote.type != null) {
        var curNoteTime = curNote.time;
        var sliderTime = curNote.length * sliderSolidFactor;
        var percentage = 1 - (((curNoteTime + sliderTime) - curTime) /
          sliderTime);

        var mouseArea = self.getSliderPos(percentage, curNote.path, curNote
          .length);

        drawMouseArea(mouseArea.x, mouseArea.y, self.circleSize, sliderC);
      }

      if (self.debug.lifecycle) drawStatusCircle(curNote, '#FFDC00', i);
    }

    //renders exitQueue
    for (var i = self.exitQueue.end - 1; i >= self.exitQueue.start; i--) {
      var curNote = self.songData[i];
      var sliderTime = 0;

      if (curNote.type != null) sliderTime = curNote.length *
        sliderSolidFactor;
      var opacity = 1 - ((curTime - (curNote.time + sliderTime +
        noteSolidTime)) / fadeOutTime);
      var curStage = 1 - opacity;
      opacity = Math.pow(opacity, 2.5);
      drawNotesIteration(curNote, opacity, false, true);

      if (self.debug.lifecycle) drawStatusCircle(curNote, '#FF4136', i);
    }



    //clears canvas
    _.each(self.c, function(v, k) {
      v.restore();
    });

    requestAnimationFrame(self.render.bind(self));
  }
};
