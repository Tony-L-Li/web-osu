function drawCircle(x, y, number, size, opacity, color, ctx) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.fill();

  ctx.strokeStyle = '#e6e6e6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.font = '25px Nova Square';
  ctx.fillStyle = '#e6e6e6';
  ctx.textAlign = "center";
  ctx.textBaseline = 'middle';
  ctx.fillText(number.toString(), x, y);
  ctx.restore();
}

function drawLine(points, size, opacity, color, ctx) {
  ctx.save();

  ctx.lineCap = "round";
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 2 * size;
  ctx.strokeStyle = '#aaaaaa';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.stroke();

  ctx.globalAlpha = opacity;
  ctx.lineWidth = 2 * size - 6;
  ctx.strokeStyle = '#333333';
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  ctx.lineTo(points[1].x, points[1].y);
  ctx.stroke();

  ctx.restore();
}

function drawArc(arc, size, opacity, color, ctx) {
  ctx.save();

  ctx.lineCap = "round";
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 2 * size;
  ctx.strokeStyle = '#aaaaaa';
  ctx.beginPath();
  ctx.arc(arc.x, arc.y, arc.r, arc.startAngle, arc.endAngle, arc.ccw);
  ctx.stroke();

  ctx.lineWidth = 2 * size - 6;
  ctx.strokeStyle = '#333333';
  ctx.beginPath();
  ctx.arc(arc.x, arc.y, arc.r, arc.startAngle, arc.endAngle, arc.ccw);
  ctx.stroke();

  ctx.restore();
}

function drawBezier(points, size, opacity, color, ctx) {
  ctx.save();

  ctx.lineCap = "round";
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 2 * size;
  ctx.strokeStyle = '#aaaaaa';
  ctx.beginPath();
  ctx.moveTo(points[0][0].x, points[0][0].y);
  _.forEach(points, function(n) {
    ctx.bezierCurveTo(n[1].x, n[1].y, n[2].x, n[2].y, n[3].x, n[3].y);
  });
  ctx.stroke();

  ctx.lineWidth = 2 * size - 6;
  ctx.strokeStyle = '#333333';
  ctx.beginPath();
  ctx.moveTo(points[0][0].x, points[0][0].y);
  _.forEach(points, function(n) {
    ctx.bezierCurveTo(n[1].x, n[1].y, n[2].x, n[2].y, n[3].x, n[3].y);
  });
  ctx.stroke();

  ctx.restore();
}
