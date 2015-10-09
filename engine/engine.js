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
    slider: createCanvas('slider', 2),
    note: createCanvas('note', 3),
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

    self.audio.volume = 0.00;
    self.audio.currentTime = 9.5;
    self.audio.play();
    self.render();
  },
  render: function() {
    var self = this;
    var noteC = self.c.note;
    var sliderC = self.c.slider;
    var scaledArea = self.maxArea * self.scale;
    self.c.note.clearRect(0, 0, scaledArea, scaledArea);
    self.c.slider.clearRect(0, 0, scaledArea, scaledArea);
    self.c.buffer.clearRect(0, 0, scaledArea, scaledArea);

    _.each(self.c, function(v, k) {
      v.save();
      if (k === 'note' || k === 'slider' || k === 'cursor-area' || k ===
        'buffer') {
        if (k === 'buffer') {
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


    var fadeInTime = self.ar * self.arConst;
    var noteSolidTime = self.ar * self.arConst / 2;
    var fadeOutTime = self.ar * self.arConst / 2;
    var sliderSolidFactor = 2;
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

      if (curSongType != null) sliderTime = curSong.length * sliderSolidFactor * curSong.repeat;

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

      if (curSongType != null) sliderTime = curSong.length * sliderSolidFactor * curSong.repeat;

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
    function drawNotesIteration(curNote, opacity) {
      if (curNote.type == null) {
        drawCircle(curNote.x, curNote.y, curNote.number, self.circleSize,
          curNote.color, buffer);
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
          drawCircle(lastElem.x, lastElem.y, '', self.circleSize, curNote.color,
            buffer);
          drawCircle(curNote.points[0][0].x, curNote.points[0][0].y,
            curNote.number, self.circleSize, curNote.color, buffer);
        } else {
          var lastElem = curNote.points[curNote.points.length - 1];
          drawCircle(lastElem.x, lastElem.y, '', self.circleSize, curNote.color, buffer);
          drawCircle(curNote.points[0].x, curNote.points[0].y, curNote.number,
            self.circleSize, curNote.color, buffer);
        }
      }

      noteC.globalAlpha = opacity;
      noteC.drawImage(bufferCanvas, 0, 0);
      buffer.clearRect(0, 0, self.maxArea, self.maxArea);
    }

    //renders entrance
    for (var i = self.entranceQueue.end - 1; i >= self.entranceQueue.start; i--) {
      var curNote = self.songData[i];
      var opacity = 1 - ((curNote.time - curTime) / fadeInTime);

      opacity = Math.pow(opacity, 2.5);
      drawNotesIteration(curNote, opacity);
    }

    //renders play
    for (var i = self.playQueue.end - 1; i >= self.playQueue.start; i--) {
      var curNote = self.songData[i];
      var opacity = 1;
      drawNotesIteration(curNote, opacity);
    }

    //renders exitQueue
    for (var i = self.exitQueue.end - 1; i >= self.exitQueue.start; i--) {
      var curNote = self.songData[i];
      var sliderTime = 0;

      if (curNote.type != null) sliderTime = curNote.length *
        sliderSolidFactor;
      var opacity = 1 - ((curTime - (curNote.time + sliderTime +
        noteSolidTime)) / fadeOutTime);

      opacity = Math.pow(opacity, 2.5);
      drawNotesIteration(curNote, opacity);
    }



    //clears canvas
    _.each(self.c, function(v, k) {
      v.restore();
    });

    requestAnimationFrame(self.render.bind(self));
  }
};
