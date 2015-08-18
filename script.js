$(function () {
  function interpolate(a, b, ratio) {
    return {
      x: a.x * (1 - ratio) + b.x * ratio,
      y: a.y * (1 - ratio) + b.y * ratio
    };
  }

  var c = document.getElementById("myCanvas");
  var cOverlay = document.getElementById("myCanvasOverlay");
  var ctxOverlay = cOverlay.getContext('2d');
  var ctx = c.getContext("2d");

  c.style.background = '#000';

  var RADIUS = c.width * 0.05;
  var curTime = 10;
  var noteStack = window.beatMap.HitObjects;

  function Bezier(a, b, c, d) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;

    this.len = 100;
    this.arcLengths = new Array(this.len + 1);
    this.arcLengths[0] = 0;

    var ox = this.x(0),
      oy = this.y(0),
      clen = 0;
    for (var i = 1; i <= this.len; i += 1) {
      var x = this.x(i * 0.01),
        y = this.y(i * 0.01);
      var dx = ox - x,
        dy = oy - y;
      clen += Math.sqrt(dx * dx + dy * dy);
      this.arcLengths[i] = clen;
      ox = x, oy = y;
    }
    this.length = clen;
  }

  Bezier.prototype = {
    map: function (s) {
      var targetLength = s;
      var low = 0,
        high = this.len,
        index = 0;
      while (low < high) {
        index = low + (((high - low) / 2) | 0);
        if (this.arcLengths[index] < targetLength) {
          low = index + 1;

        } else {
          high = index;
        }
      }
      if (this.arcLengths[index] > targetLength) {
        index--;
      }

      var lengthBefore = this.arcLengths[index];
      if (lengthBefore === targetLength) {
        return index / this.len;

      } else {
        return (index + (targetLength - lengthBefore) / (this.arcLengths[index + 1] - lengthBefore)) / this.len;
      }
    },
    arcLength: function () {
      return this.arcLengths[this.len];
    },
    mx: function (s) {
      return this.x(this.map(s));
    },
    my: function (s) {
      return this.y(this.map(s));
    },
    x: function (t) {
      return ((1 - t) * (1 - t) * (1 - t)) * this.a.x + 3 * ((1 - t) * (1 - t)) * t * this.b.x + 3 * (1 - t) * (t * t) * this.c.x + (t * t * t) * this.d.x;
    },
    y: function (t) {
      return ((1 - t) * (1 - t) * (1 - t)) * this.a.y + 3 * ((1 - t) * (1 - t)) * t * this.b.y + 3 * (1 - t) * (t * t) * this.c.y + (t * t * t) * this.d.y;
    }
  };

  function BezierSpline(beziers) {
    this.beziers = [];
    for (var i = 0; i < beziers.length; i++) {
      this.beziers.push(new Bezier(beziers[i][0], beziers[i][1], beziers[i][2], beziers[i][3]));
    }
    this.arcLength = 0;
    for (var i = 0; i < this.beziers.length; i++) {
      this.arcLength += this.beziers[i].arcLength();
    }
  }

  BezierSpline.prototype = {
    pointFromMap: function (s) {
      var t = 0;
      var curBezier = 0;

      while (s >= 0) {
        if (this.beziers[curBezier].arcLength() < s) {

          if (curBezier + 1 > this.beziers.length - 1) {
            return {
              x: this.beziers[curBezier].x(map),
              y: this.beziers[curBezier].y(map)
            };
          }
          s -= this.beziers[curBezier].arcLength();
          t += 1;
          curBezier += 1;
        } else {
          var map = this.beziers[curBezier].map(s);
          return {
            x: this.beziers[curBezier].x(map),
            y: this.beziers[curBezier].y(map)
          };
        }
      }
      return null;
    }
  };

  function Arc(begin, end, r, cx, cy, clockwise) {
    this.begin = begin;
    this.end = end;
    this.r = r;
    this.cx = cx;
    this.cy = cy;
    this.clockwise = clockwise;
    this.arcLength = Math.abs(begin - end) * r;
  }

  Arc.prototype = {
    map: function (s) {
      var theta = s / this.r;
      var curAngle;

      if (!this.clockwise) {
        curAngle = this.begin + theta;
      } else {
        curAngle = this.begin - theta;
      }

      if (curAngle > 2 * Math.PI) {
        curAngle = curAngle - 2 * Math.Pi;
      }

      if (curAngle < 0) {
        curAngle = 2 * Math.Pi + curAngle;
      }

      return curAngle;
    },
    pointFromMap: function (theta) {
      return {
        x: this.x(theta),
        y: this.y(theta)
      };
    },
    x: function (theta) {
      return this.cx + this.r * Math.cos(theta);
    },
    y: function (theta) {
      return this.cy + this.r * Math.sin(theta);
    }
  };

  function Line(points) {
    this.begin = points[0];
    this.end = points[1];
    this.arcLength = Math.sqrt(Math.pow(this.begin.x - this.end.x, 2) + Math.pow(this.begin.y - this.end.y, 2));
  }

  Line.prototype = {
    map: function (s) {
      return s / this.arcLength;
    },
    pointFromMap: function (u) {
      return {
        x: this.begin.x + (this.end.x - this.begin.x) * u,
        y: this.begin.y + (this.end.y - this.begin.y) * u
      };
    }
  };

  function strokeBorderPath(context) {
    context.save();
    context.lineCap = "round";
    context.strokeStyle = '#39CCCC';
    context.lineWidth = RADIUS * 2;
    context.stroke();
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.strokeStyle = "rgba(0,0,0,1)";
    context.lineWidth = RADIUS * 2 - 6;
    context.stroke();
    context.restore();
  }
  var test;

  function drawBezierFromBspline(bspline, context, noDraw) {
    context.save();

    var pairs = [];
    var one_thirds = [];
    var two_thirds = [];
    var beziers = [];

    bspline = bspline.slice(0);

    bspline.unshift(bspline[0]);
    bspline.unshift(bspline[0]);
    bspline.unshift(bspline[0]);

    bspline.push(bspline[bspline.length - 1]);
    bspline.push(bspline[bspline.length - 1]);
    bspline.push(bspline[bspline.length - 1]);

    for (var i = 0; i < bspline.length - 1; i++) {
      pairs.push([bspline[i], bspline[i + 1]]);
    }

    for (var i = 0; i < pairs.length; i++) {
      one_thirds.push(interpolate(pairs[i][0], pairs[i][1], 1 / 3));
      two_thirds.push(interpolate(pairs[i][1], pairs[i][0], 1 / 3));
    }

    context.beginPath();
    for (var i = 0; i < bspline.length - 3; i++) {
      var coords = [];
      var start = interpolate(two_thirds[i], one_thirds[i + 1], 0.5);
      coords.push(one_thirds[i + 1]);
      coords.push(two_thirds[i + 1]);
      coords.push(interpolate(two_thirds[i + 1], one_thirds[i + 2], 0.5));

      if (i === 0) {
        context.moveTo(start.x, start.y);
      }
      context.bezierCurveTo(coords[0].x, coords[0].y, coords[1].x, coords[1].y, coords[2].x, coords[2].y);
      beziers.push([start, coords[0], coords[1], coords[2]]);
    }

    if (noDraw != true) strokeBorderPath(context);
    context.restore();

    return (new BezierSpline(beziers));
  }

  function drawArcFromPoints(points, context, noDraw) {
    var a = points[0];
    var b = points[1];
    var c = points[2];
    var d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
    var ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) + (b.x * b.x + b.y * b.y) * (c.y - a.y) + (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;
    var uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) + (b.x * b.x + b.y * b.y) * (a.x - c.x) + (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;
    var r = Math.sqrt(Math.pow(a.x - ux, 2) + Math.pow(a.y - uy, 2));

    function atan2(y, x) {
      var theta = Math.atan2(y, x);
      if (theta < 0) {
        theta += Math.PI * 2;
      }
      return theta;
    }
    var angleStart = atan2(a.y - uy, a.x - ux);
    var angleEnd = atan2(c.y - uy, c.x - ux);
    var angleMid = atan2(b.y - uy, b.x - ux);
    var wrapped = (angleMid > angleStart && angleMid > angleEnd) || (angleMid < angleStart && angleMid < angleEnd);
    var counterclockwise = !((wrapped && angleStart > angleEnd) || (!wrapped && angleStart < angleEnd));

    context.save();
    context.beginPath();
    context.arc(ux, uy, r, angleStart, angleEnd, counterclockwise);
    if (noDraw != true) strokeBorderPath(context);
    context.restore();

    return (new Arc(angleStart, angleEnd, r, ux, uy, counterclockwise));
  }

  function drawLineFromPoints(points, context, noDraw) {
    context.save();
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    context.lineTo(points[1].x, points[1].y)
    if (noDraw != true) strokeBorderPath(context);
    context.restore();

    return (new Line(points));
  }

  var curNoteCount = 1;

  for (var i = 0; i < noteStack.length; i++) {
    if (noteStack[i].type === 5 || noteStack[i].type == 6) curNoteCount = 1;
    noteStack[i].noteCount = curNoteCount;
    curNoteCount++;
  }

  function drawNote(x, y, color, count, context) {
    context.lineWidth = 3;
    context.strokeStyle = color;
    context.beginPath();
    context.arc(x, y, RADIUS, 0, 2 * Math.PI);
    context.stroke();
    context.fillStyle = '#39CCCC';
    context.fill();
    context.fillStyle = '#fff';
    context.font = RADIUS + "px Georgia";
    context.fillText("" + count, x - RADIUS * 0.3, y + RADIUS * 0.3);
  }

  function drawApCircle(x, y, totalTime, curTime, color, context) {
    context.lineWidth = 4;
    context.strokeStyle = color;
    context.beginPath();
    context.arc(x, y, RADIUS * (1 + curTime / totalTime), 0, 2 * Math.PI);
    context.stroke();
  }

  function drawHitCircle(x, y, circleSize, isDrawn, color, context) {
    if (!isDrawn) return;
    context.lineWidth = 3;
    context.strokeStyle = color;
    context.beginPath();
    context.arc(x, y, RADIUS * (1 + circleSize * 0.6), 0, 2 * Math.PI);
    context.stroke();
  }



  ctx.translate(50.5, 50.5);
  ctxOverlay.translate(50.5, 50.5);

  var apTime = 4000 / window.beatMap.ApproachRate;
  var startNoteCount = curNoteCount;
  var startTime = null;
  var sliderSpeed = 1;
  var sliderNormVel = 4;
  var renderStart = 0;
  var renderEnd = 1;

  var lateBuffer = 50;
  var curPos = {
    x: 0,
    y: 0,
    circleSize: 0,
    curIndex: 0
  };

  var gameLoop = function (time) {
    if (renderStart == 0 && renderEnd == 1) {
      drawNoteObjects();
    }

    function drawNoteObjects() {
      for (var i = renderEnd - 1; i >= renderStart; i--) {
        var curNote = noteStack[i];
        var curStartPoint;
        if (curNote.type === 1 || curNote.type === 5) {
          curStartPoint = curNote;
        } else if (curNote.type === 2 || curNote.type === 6) {
          if (curNote.curvePoints.length === 2) {
            drawLineFromPoints(curNote.curvePoints, ctx);
          } else if (curNote.curvePoints.length === 3) {
            drawArcFromPoints(curNote.curvePoints, ctx);
          } else {
            drawBezierFromBspline(curNote.curvePoints, ctx);
          }
          curStartPoint = curNote.curvePoints[0]

        } else {
          continue;
        }

        drawNote(curStartPoint.x, curStartPoint.y, '#39CCCC', curNote.noteCount, ctx);
        if (curTime >= curNote.time) drawApCircle(curStartPoint.x, curStartPoint.y, apTime, curTime - curNote.time, '#39CCCC', ctxOverlay);
      }
    }

    function drawApCircles() {
      for (var i = renderEnd - 1; i >= renderStart; i--) {
        var curNote = noteStack[i];
        var curStartPoint;
        if (curNote.type === 1 || curNote.type === 5) {
          curStartPoint = curNote;
        } else if (curNote.type === 2 || curNote.type === 6) {
          curStartPoint = curNote.curvePoints[0];
        } else {
          continue;
        }
        if (curTime <= curNote.time && curNote.time - curTime <= apTime) drawApCircle(curStartPoint.x, curStartPoint.y, apTime, curNote.time - curTime, '#39CCCC', ctxOverlay);
      }
    }

    var newNotes = false;

    if (startTime === null) {
      startTime = time;
    }

    curTime = (time - startTime);


    var curNoteIndex = renderEnd;
    while (curNoteIndex < noteStack.length && noteStack[curNoteIndex].time - apTime < curTime) {
      renderEnd++;
      curNoteIndex++;
      newNotes = true;
    }

    curNoteIndex = renderStart;
    while (curNoteIndex < noteStack.length) {
      var curNote = noteStack[curNoteIndex];
      if ((curNote.type == 1 || curNote.type == 5) && curNote.time + lateBuffer < curTime) {
        curNoteIndex++;
        renderStart++;
        newNotes = true;
      } else if (curNote.type == 2 || curNote.type == 6) {
        var curSlider;

        if (curNote.curvePoints.length === 2) {
          curSlider = drawLineFromPoints(curNote.curvePoints, ctx, true);
        } else if (curNote.curvePoints.length === 3) {
          curSlider = drawArcFromPoints(curNote.curvePoints, ctx, true);
        } else {
          curSlider = drawBezierFromBspline(curNote.curvePoints, ctx, true);
        }

        if (curNote.time + curSlider.arcLength * (sliderSpeed * sliderNormVel) < curTime) {
          curNoteIndex++;
          renderStart++;
          newNotes = true;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    for (var i = parseInt(Math.max(renderStart - 1, 0)); i < renderEnd; i++) {
      if ((curTime < noteStack[i + 1].time || i == renderEnd - 1) && curTime >= noteStack[i].time) {
        var curNote = noteStack[i];
        var curStartPoint;
        if (curNote.type === 1 || curNote.type === 5) {
          curPos.x = curNote.x;
          curPos.y = curNote.y;
          curPos.circleSize = 0;
        } else if (curNote.type === 2 || curNote.type === 6) {
          var curSlider;
          var curCoord;
          if (curNote.curvePoints.length === 2) {
            curSlider = drawLineFromPoints(curNote.curvePoints, ctx, true);
            curCoord = curSlider.pointFromMap(curSlider.map(Math.min(curSlider.arcLength, (curTime - curNote.time) / (sliderSpeed * sliderNormVel))));
          } else if (curNote.curvePoints.length === 3) {
            curSlider = drawArcFromPoints(curNote.curvePoints, ctx, true);
            curCoord = curSlider.pointFromMap(curSlider.map(Math.min(curSlider.arcLength, (curTime - curNote.time) / (sliderSpeed * sliderNormVel))));
          } else {
            curSlider = drawBezierFromBspline(curNote.curvePoints, ctx, true);
            curCoord = curSlider.pointFromMap(Math.min(curSlider.arcLength, (curTime - curNote.time) / (sliderSpeed * sliderNormVel)));
          }
          curPos = {
            x: curCoord.x,
            y: curCoord.y,
            circleSize: 1,
            curIndex: i
          };
        }
      }
    }
    //console.log("%d %d", renderStart, renderEnd);
    if (newNotes) {
      ctx.translate(-50.5, -50.5);
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.translate(50.5, 50.5);
      drawNoteObjects();
    }

    ctxOverlay.translate(-50.5, -50.5);
    ctxOverlay.clearRect(0, 0, c.width, c.height);
    ctxOverlay.translate(50.5, 50.5);
    drawApCircles();

    drawHitCircle(curPos.x, curPos.y, curPos.circleSize, (curPos.curIndex >= renderStart), '#39CCCC', ctxOverlay);

    requestAnimationFrame(gameLoop);
  };
  requestAnimationFrame(gameLoop);
});
