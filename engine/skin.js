var mainOpacity = 1;
var minorOpacity = 0.7;
var borderWidth = 8;

function drawArrow(center, direction, size, ctx) {
  var LEN_FACTOR = 2;
  var ARROW_ANGLE = Math.PI/4;
  var headlen = 14; 
  

  var fromx = center.x - direction.x * size * LEN_FACTOR;
  var fromy = center.y - direction.y * size * LEN_FACTOR;
  var tox = center.x + direction.x * size * LEN_FACTOR;
  var toy = center.y + direction.y * size * LEN_FACTOR;
  var angle = Math.atan2(toy-fromy,tox-fromx);
  
  ctx.save();

  ctx.strokeStyle = '#FFFFFF';
  ctx.lineCap = "round";
  ctx.lineWidth = 6;

  ctx.beginPath();
  ctx.moveTo(fromx, fromy);
  ctx.lineTo(tox, toy);
  ctx.lineTo(tox-headlen*Math.cos(angle-ARROW_ANGLE),toy-headlen*Math.sin(angle-ARROW_ANGLE));
  ctx.moveTo(tox, toy);
  ctx.lineTo(tox-headlen*Math.cos(angle+ARROW_ANGLE),toy-headlen*Math.sin(angle+ARROW_ANGLE));
  ctx.stroke();

  ctx.restore();
}

function drawMouseArea(x, y, size, ctx) {
  ctx.save();

  ctx.strokeStyle = '#39CCCC';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

function drawApproachCircle(x, y, size, color, curStage, ctx) {
  ctx.save();
  curStage = 1 - curStage;
  ctx.globalAlpha = 1 - curStage;
  ctx.strokeStyle = color;
  ctx.lineWidth = 4 + 6 * curStage;
  ctx.beginPath();
  ctx.arc(x, y, size * (1 + 3 * curStage), 0, 2 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

function drawCircle(x, y, number, size, color, repeatPath, ctx) {
  ctx.save();

  ctx.globalAlpha = minorOpacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fill();

  ctx.globalAlpha = mainOpacity;
  ctx.strokeStyle = '#e6e6e6';
  ctx.lineWidth = borderWidth / 2;
  ctx.beginPath();
  ctx.arc(x, y, size - 2, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.font = '25px Nova Square';
  ctx.fillStyle = '#e6e6e6';
  ctx.textAlign = "center";
  ctx.textBaseline = 'middle';
  ctx.fillText(number.toString(), x, y);
  ctx.restore();
}

function drawLine(points, size, color, ctx) {
  ctx.save();

  ctx.globalCompositeOperation = 'source-out';
  ctx.lineCap = "round";

  ctx.globalAlpha = minorOpacity;
  ctx.lineWidth = 2 * size - borderWidth;
  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.stroke();

  ctx.globalAlpha = mainOpacity;
  ctx.lineWidth = 2 * size;
  ctx.strokeStyle = '#eeeeee';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.stroke();

  ctx.restore();
}

function drawArc(arc, size, color, ctx) {
  ctx.save();

  ctx.globalCompositeOperation = 'source-out';
  ctx.lineCap = "round";

  ctx.globalAlpha = minorOpacity;
  ctx.lineWidth = 2 * size - borderWidth;
  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  ctx.arc(arc.x, arc.y, arc.r, arc.startAngle, arc.endAngle, arc.ccw);
  ctx.stroke();

  ctx.globalAlpha = mainOpacity;
  ctx.lineWidth = 2 * size;
  ctx.strokeStyle = '#eeeeee';
  ctx.beginPath();
  ctx.arc(arc.x, arc.y, arc.r, arc.startAngle, arc.endAngle, arc.ccw);
  ctx.stroke();

  ctx.restore();
}

function drawBezier(points, size, color, ctx) {
  ctx.save();

  ctx.globalCompositeOperation = 'source-out';
  ctx.lineCap = "round";

  ctx.globalAlpha = minorOpacity;
  ctx.lineWidth = 2 * size - borderWidth;
  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(points[0][0].x, points[0][0].y);
  _.forEach(points, function(n) {
    ctx.bezierCurveTo(n[1].x, n[1].y, n[2].x, n[2].y, n[3].x, n[3].y);
  });
  ctx.stroke();

  ctx.globalAlpha = mainOpacity;
  ctx.lineWidth = 2 * size;
  ctx.strokeStyle = '#eeeeee';
  ctx.beginPath();
  ctx.moveTo(points[0][0].x, points[0][0].y);
  _.forEach(points, function(n) {
    ctx.bezierCurveTo(n[1].x, n[1].y, n[2].x, n[2].y, n[3].x, n[3].y);
  });
  ctx.stroke();

  ctx.restore();
}
