var lastCalledTime;
var fps;
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
    var height, width;
    var marginLeft = 0;
    if (self.root.height() / self.root.width() > 524 / 612) {
      width = self.root.width();
      height = width * 524 / 612;
    } else {
      height = self.root.height();
      width = height * 612 / 524;
      marginLeft = (self.root.width() - width) / 2;
    }
    
    _.each(self.e, function(v, k) {
      if (k === 'ui' || k === 'cursorArea') {
        v.attr({
        'height': self.root.height() + 'px',
        'width': self.root.width() + 'px'
        });
        return;
      }
      v.css({left: marginLeft + 'px'});
      v.attr({
        'height': height + 'px',
        'width': width + 'px'
      });
    });
    self.cursorXOffset = marginLeft;
    self.scale = width / self.maxArea;
    self.maxUIWidth = self.root.width() / self.scale;
  }

  var self = this;
  this.scoreManager = new Score();
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
    clickStatus: createCanvas('click-Status', 4),
    cursorArea: createCanvas('cursor-area', 5)
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

  //CURSOR
  document.addEventListener('mousemove', onMouseUpdate, false);
  document.addEventListener('mouseenter', onMouseUpdate, false);
  document.addEventListener('keydown', onKeyDown, false);

  var scaledArea = self.maxArea * self.scale;

  function onKeyDown(e) {
    if (e.keyCode === 65 || e.keyCode === 83) {
      self.checkClick();
    }
  }

  function onMouseUpdate(e) {
    self.cursorPos.x = e.pageX;
    self.cursorPos.y = e.pageY;

    //drawCursor(e.pageX, e.pageY, self.c.cursorArea);
  }

  this.playableTime = {
    start: this.songData[0].time,
    end: this.songData[this.songData.length - 1].time,
    duration: this.songData[this.songData.length - 1].time - this.songData[0]
      .time
  };
}

Engine.prototype = {
  //turn on for engine debugging
  debug: {
    lifecycle: false,
    path: false
  },
  cursorPos: {
    x: 0,
    y:0
  },
  cursorXOffset: 0,
  cursorState: 0,
  maxUIWidth: 612,
  maxArea: 612,
  maxWidth: 512,
  maxHeight: 384,
  health: 1,
  accuracy: 0.4545,
  scoreManager: null,
  drawHealth: function(ctx) {
    var self = this;
    var HEALTH_LEN = 300;
    var HEALTH_THICK = 8;

    if (self.audio.currentTime * 1000 < self.playableTime.start - 1500) {
      curHealth = -2;
      if (self.audio.currentTime * 1000 > self.playableTime.start - 8000) {
        curHealth = HEALTH_LEN * (1 - ((self.playableTime.start - self.audio
          .currentTime * 1000 - 1500) / 5000));
      }
    } else if (self.audio.currentTime * 1000 >= self.playableTime.start) {
      curHealth += (HEALTH_LEN * this.scoreManager.curHealth/100 - curHealth) * 0.3;
    }

    ctx.save();
    ctx.fillStyle = '#FFF';
    ctx.fillRect(10, 10, curHealth, HEALTH_THICK);
    ctx.restore();
  },
  drawUIScore: function(ctx) {
    var self = this;
    var alignRight = Math.round(this.maxUIWidth - 7);
    //draw score
    ctx.font = '25px Nova Square';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'right';
    var curScore = '00000000' + this.scoreManager.curScore.toString()
    ctx.fillText(curScore.slice(-8), alignRight, 25);

    //draw combo
    ctx.font = '15px Nova Square';
    ctx.textAlign = 'left';
    ctx.fillText('x', 10, 505);
    ctx.font = '25px Nova Square';
    ctx.fillText(this.scoreManager.curMultiplier.toString(), 20, 505);

    //percentage
    ctx.font = '15px Nova Square';
    ctx.textAlign = 'right';
    ctx.fillText((this.scoreManager.curAcc * 100).toFixed(2) + '%', alignRight, 40);

    //completion
    var cLeft = Math.round(this.maxUIWidth - 82);
    var cTop = 35;
    var endTime;
    var isCCW = self.audio.currentTime * 1000 < self.playableTime.start;

    if (self.audio.currentTime * 1000 >= self.playableTime.start) {
      endTime = (((self.audio.currentTime * 1000 - self.playableTime.start) /
        self.playableTime.duration) * 2 * Math.PI + 1.5 * Math.PI) % (2 *
        Math.PI)
    } else if (isCCW) {
      endTime = ((self.audio.currentTime * 1000 / self.playableTime.start) *
        2 * Math.PI + 1.5 * Math.PI) % (2 * Math.PI);
    }

    ctx.fillStyle = isCCW ? '#01FF70' : '#AAA';
    ctx.beginPath();
    ctx.arc(cLeft, cTop, 7, 1.5 * Math.PI, endTime, isCCW);
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

    self.curNote = 0;
    self.statusQueue = [];
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
    console.log(self.audio);
    self.audio.volume = 0.0;
    self.audio.currentTime = 20;
    //26.5
    self.audio.play();
    self.render();
  },
  getSliderPos: function(percentage, posArr, length, iteration) {
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

    function posArrIndex(index) {
      if (iteration % 2 === 0) {
        return posArr[index];
      } else {
        return posArr[posArr.length - index - 1];
      }
    }

    var index = Math.min(Math.floor(percentage * length / 10), posArr.length -
      1);
    var progress = (percentage * length / 10) - index;
    var next = 1;
    if (index >= posArr.length - 1) next = 0;

    return {
      x: posArrIndex(index).x + (posArrIndex(index + next).x - posArrIndex(
          index).x) *
        progress,
      y: posArrIndex(index).y + (posArrIndex(index + next).y - posArrIndex(
          index).y) *
        progress
    }
  },
  checkClick: function () {
    function dist(x1, y1, x2, y2) {
      return Math.sqrt( Math.pow((x1-x2), 2) + Math.pow((y1-y2), 2) );
    }
    var self = this;  
    var clickThresh = 100;
    var distThresh = self.circleSize * 7
    var curTime = self.audio.currentTime * 1000;

    //Cursor pos
    var cursorX = (self.cursorPos.x - self.cursorXOffset - 50 * self.scale)/ self.scale;
    var cursorY = (self.cursorPos.y - 90 * self.scale) / self.scale;
    
    //get curnote
    var curQueue;

    if (self.playQueue.start != self.playQueue.end) {
      curQueue = self.playQueue;
    } else if (self.entranceQueue.start != self.entranceQueue.end){
      curQueue = self.entranceQueue;
    } else {
      return;
    }

    var curNote = self.songData[curQueue.start];

    //get note position
    var noteX;
    var noteY;

    if (curNote.type == null) {
      noteX = curNote.x;
      noteY = curNote.y;
    } else {
      if (curNote.type === 'bezier') {
        noteX = curNote.points[0][0].x;
        noteY = curNote.points[0][0].y;
      } else {
        noteX = curNote.points[0].x;
        noteY = curNote.points[0].y;
      }
    }
    var clickOffset = Math.abs(curNote.time - curTime);
    var curStatus = {
      x: noteX,
      y: noteY,
      state: 0
    };
    //console.log('%f %f', dist(noteX, noteY, cursorX, cursorY), distThresh);
    if (dist(noteX, noteY, cursorX, cursorY) <= distThresh) {
      if (clickOffset <= clickThresh * 2 / 3) {
        self.scoreManager.addNote(300);
        curStatus.status = 300;
        self.curNote++;
      } else if (clickOffset <= clickThresh * 5 / 6){
        self.scoreManager.addNote(100);
        curStatus.status = 100;
      } else if (clickOffset <= clickThresh) {
        self.scoreManager.addNote(50);
        curStatus.status = 50;
      } else {
        self.scoreManager.addNote(0);
        curStatus.status = 0;
      }
      self.statusQueue.push(curStatus);
    } else {
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
    self.c.ui.clearRect(0, 0, self.maxUIWidth * self.scale, scaledArea);
    self.c.clickStatus.clearRect(0, 0, scaledArea, scaledArea);

    self.c.cursorArea.clearRect(0, 0, self.root.width(), self.root.height());
    drawCursor(self.cursorPos.x, self.cursorPos.y, self.c.cursorArea);

    _.each(self.c, function(v, k) {
      v.save();
      if (k === 'note' || k === 'sliderCircle' ||
        k === 'buffer' || k === 'clickStatus') {
        if (k === 'buffer' || k === 'sliderCircle' || k ===
          'cursorArea' || k === 'clickStatus') {
          v.translate(50 * self.scale, 90 * self.scale);
          v.scale(self.scale, self.scale);
        }
      } else {
        v.scale(self.scale, self.scale);
      }
    });

    //ticks health
    self.scoreManager.tick(0.1);

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

    //cursor tests
    // var testCX = (self.cursorPos.x - self.cursorXOffset - 50 * self.scale)/self.scale;
    // var testCY = (self.cursorPos.y - 90 * self.scale) /self.scale;
    // drawCircle(testCX, testCY, 0, 10, '#39CCCC', false, self.c.sliderCircle);
    
    //configure entrance queue
    while (true) {
      var curNoteTime = self.songData[self.entranceQueue.end].time;

      if (curNoteTime - fadeInTime <= curTime && self.entranceQueue.end <
        self.songData.length - 1) {
        // pushes into entrance queue
        self.entranceQueue.end++;
      } else {
        break;
      }
    }

    while (true) {
      if (self.songData[self.entranceQueue.start].time <= curTime && self.entranceQueue
        .start < self.songData.length - 1) {
        // pops out of entrance queue
        self.entranceQueue.start++;
        // pushes into play queue
        self.playQueue.end++;
      } else {
        break;
      }
    }

    while (true) {
      var curNote = self.songData[self.playQueue.start];
      var curNoteType = curNote.type;
      var curNoteTime = curNote.time;
      var sliderTime;

      if (curNoteType != null) sliderTime = curNote.length *
        sliderSolidFactor * curNote.repeat * (200 / curNote.bpm);

      if ((curNoteType == null && curNoteTime + noteSolidTime <= curTime) ||
        (curNoteType != null && curNoteTime + noteSolidTime + sliderTime <=
          curTime)) {
        // pops out of play queue
        self.playQueue.start++;
        // pushes into exit queue
        self.exitQueue.end++;
        if (self.curNote === self.exitQueue.end - 1) {
          self.curNote++;
        }
      } else {
        break;
      }
    }
    //console.log(self.playQueue.end - self.playQueue.start);

    while (true) {
      var curNote = self.songData[self.exitQueue.start];
      var curNoteType = curNote.type;
      var curNoteTime = curNote.time;
      var sliderTime;

      if (curNoteType != null) sliderTime = curNote.length *
        sliderSolidFactor * curNote.repeat * (200 / curNote.bpm);

      if ((curNoteType == null && curNoteTime + noteSolidTime + fadeOutTime <=
          curTime) ||
        (curNoteType != null && curNoteTime + noteSolidTime + sliderTime +
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
    function drawNotesIteration(curNote, opacity, drawAC, isExit, isPlay,
      drawRepeat) {
      var size = self.circleSize;
      var number = isPlay ? '' : curNote.number;

      if (isExit) size = size * (1 + (curStage * 0.35));
      if (curNote.type == null) {
        drawCircle(curNote.x, curNote.y, number, size,
          curNote.color, null, buffer);

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
          drawCircle(lastElem.x, lastElem.y, '', size, curNote.color, null,
            buffer);
          drawCircle(curNote.points[0][0].x, curNote.points[0][0].y,
            number, size, curNote.color, null, buffer);

          if (drawAC) drawApproachCircle(curNote.points[0][0].x, curNote.points[
              0][0].y, self.circleSize, curNote.color,
            curStage, buffer);
        } else {
          var lastElem = curNote.points[curNote.points.length - 1];
          drawCircle(lastElem.x, lastElem.y, '', size, curNote.color, null,
            buffer);
          drawCircle(curNote.points[0].x, curNote.points[0].y, number,
            size, curNote.color, null, buffer);

          if (drawAC) drawApproachCircle(curNote.points[0].x, curNote.points[
              0].y, self.circleSize, curNote.color,
            curStage, buffer);
        }
        if (drawRepeat === 0) {
          drawArrow(curNote.path[curNote.path.length - 1], curNote.arrow.end,
            5, buffer);
        } else if (drawRepeat === 1) {
          drawArrow(curNote.path[0], curNote.arrow.start, 5, buffer);
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
      var curRepeatArrow = curNote.repeat > 1 ? 0 : -1;
      drawNotesIteration(curNote, opacity, true, false, false,
        curRepeatArrow);

      if (self.debug.lifecycle) drawStatusCircle(curNote, '#2ECC40', i);
    }

    //renders play
    for (var i = self.playQueue.end - 1; i >= self.playQueue.start; i--) {
      var curNote = self.songData[i];
      var opacity = 1;

      //console.log(200 / curNote.bpm);
      if (curNote.type != null) {
        var curNoteTime = curNote.time;
        var sliderTime = curNote.length * curNote.repeat *
          sliderSolidFactor * (200 / curNote.bpm);
        //percentage before removal of repeat slider percentage (ex. 120% is 1 iteration and 20% into the second)
        var percentage = (1 - (((curNoteTime + sliderTime) - curTime) /
          sliderTime)) * curNote.repeat;
        //counts current slider repeat iteration
        var iteration = Math.floor(percentage);
        //removes iteration overflow percentage
        percentage = percentage % 1;
        var mouseArea = self.getSliderPos(percentage, curNote.path, curNote
          .length, iteration);

        var curRepeatArrow = curNote.repeat > 1 && iteration < curNote.repeat -
          1 ? iteration % 2 : -1;
        drawNotesIteration(curNote, opacity, false, false, true,
          curRepeatArrow);
        drawMouseArea(mouseArea.x, mouseArea.y, self.circleSize * 1.6,
          sliderC);
      } else {
        drawNotesIteration(curNote, opacity, false, false, true);
      }

      if (self.debug.lifecycle) drawStatusCircle(curNote, '#FFDC00', i);
    }

    //renders exitQueue
    for (var i = self.exitQueue.end - 1; i >= self.exitQueue.start; i--) {
      var curNote = self.songData[i];
      var sliderTime = 0;

      if (curNote.type != null) sliderTime = curNote.length * curNote.repeat *
        sliderSolidFactor * (200 / curNote.bpm);
      var opacity = 1 - ((curTime - (curNote.time + sliderTime +
        noteSolidTime)) / fadeOutTime);
      var curStage = 1 - opacity;
      opacity = Math.pow(opacity, 2.5);
      drawNotesIteration(curNote, opacity, false, true, true);

      if (self.debug.lifecycle) drawStatusCircle(curNote, '#FF4136', i);
    }

    //renders click status
    _.forEach(self.statusQueue, function (el, i) {
      var curOp = 1;
      if (el.state <= 10) {
        curOp = el.state / 10;
      } else if (el.state >= 50) {
        curOp = 1 - ((el.state - 50) / 15);
      }

      el.state++;

      //console.log(el.state);
      drawNoteStatus(el.status, el.x, el.y, curOp, self.c.clickStatus);
    });

    while (self.statusQueue.length > 0 && self.statusQueue[0].state > 65) {
      self.statusQueue.shift();
    }

    //clears canvas
    _.each(self.c, function(v, k) {
      v.restore();
    });

    //fps check
    if(!lastCalledTime) {
     lastCalledTime = Date.now();
     fps = 0;
    } else {
      delta = (new Date().getTime() - lastCalledTime)/1000;
      lastCalledTime = Date.now();
      //console.log(1/delta);
    }

    
    requestAnimationFrame(self.render.bind(self));
  }
};
