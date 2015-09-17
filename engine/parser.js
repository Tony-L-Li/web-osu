function Bezier(bezier) {
  this.a = bezier[0];
  this.b = bezier[1];
  this.c = bezier[2];
  this.d = bezier[3];

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

function BezierSpline(bezierSpline) {
  var self = this;
  self.beziers = [];
  self.arcLength = 0;

  _.forEach(bezierSpline, function (x) {
    self.beziers.push(new Bezier(x));
    self.arcLength += self.beziers[self.beziers.length-1].arcLength();
  });
}

BezierSpline.prototype = {
  getPath: function (velocity) {
    var self = this;
    var path = [];
    var curNode = 0;
    var prevArclength = 0;

    for (var i = 0; i < self.beziers.length; i++) {
      _.forEach(self.beziers[i].arcLengths, function (x, index) {
        if (curNode * velocity <= x + prevArclength) {
          var curArcCount = self.beziers[i].len;
          path.push({
            x: self.beziers[i].x(index/curArcCount),
            y: self.beziers[i].y(index/curArcCount)
          });
          curNode++;
        }
      });
      prevArclength += self.beziers[i].arcLength();
    }
    return path;
  }
};

function getArcPath(arc, velocity) {
  var path = [];
  var wrapped = (arc.startAngle > arc.endAngle && !arc.ccw) || (arc.startAngle < arc.endAngle && arc.ccw);
  var angle = Math.abs(arc.startAngle - arc.endAngle);

  if (wrapped) {angle = 2*Math.PI - angle;}
  console.log(Math.round(angle * arc.r / velocity));
  for (var i = 0; i < Math.round(angle * arc.r / velocity); i++) {
    var curAngle = arc.startAngle + ((velocity*i/arc.r) * -(2 * arc.ccw - 1));
    path.push({
      x: arc.x + Math.cos(curAngle)* arc.r,
      y: arc.y + Math.sin(curAngle)* arc.r
    }); 
  }

  //push end point of arc
  path.push({
    x: arc.x + Math.cos(arc.endAngle)* arc.r,
    y: arc.y + Math.sin(arc.endAngle)* arc.r
  });

  return path;
}

function generateCurvePath(bezierSpline, velocity) {
  return;
}

function generateArcFromPoints(points) {
  var a = points[0];
  var b = points[1];
  var c = points[2];
  var d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) 
      + c.x * (a.y - b.y));
  var ux = ((a.x * a.x + a.y * a.y) * (b.y - c.y) 
      + (b.x * b.x + b.y * b.y) * (c.y - a.y) 
      + (c.x * c.x + c.y * c.y) * (a.y - b.y)) / d;
  var uy = ((a.x * a.x + a.y * a.y) * (c.x - b.x) 
      + (b.x * b.x + b.y * b.y) * (a.x - c.x) 
      + (c.x * c.x + c.y * c.y) * (b.x - a.x)) / d;
  var r = Math.sqrt(Math.pow(a.x - ux, 2) + Math.pow(a.y - uy, 2));

  function atan2(y, x) {
    var theta = Math.atan2(y, x);
    if (theta < 0) {
      theta += Math.PI * 2;
    }
    return theta;
  }

  function tan(x,y) {
    return Math.atan2(y,x);
    //return (2*Math.PI+Math.atan2(y,x)) % (2*Math.PI);
  }
  var angleStart = tan(a.y - uy, a.x - ux);
  var angleEnd = tan(c.y - uy, c.x - ux);
  var angleMid = tan(b.y - uy, b.x - ux);
  var wrapped = (angleMid > angleStart && angleMid > angleEnd) || (angleMid < angleStart && angleMid < angleEnd);
  var counterclockwise = !((wrapped && angleStart > angleEnd) || (!wrapped && angleStart < angleEnd));
  
  return {
    x: ux,
    y: uy,
    r: r,
    startAngle: tan(c.x-ux, c.y-uy),
    endAngle: tan( a.x-ux, a.y-uy),
    ccw: counterclockwise
  };
}

function BsplineToBezierSpline(bspline) {
  function interpolate(a, b, ratio) {
    return {
      x: a.x * (1 - ratio) + b.x * ratio,
        y: a.y * (1 - ratio) + b.y * ratio
    };
  }

  var pairs = [];
  var one_thirds = [];
  var two_thirds = [];
  var beziers = [];

  bspline = bspline.slice(0);
  for (var i = 0; i < 3; i++) {
    bspline.unshift(bspline[0]);
    bspline.push(bspline[bspline.length - 1]);
  }

  for (var i = 0; i < bspline.length - 1; i++) {
    pairs.push([bspline[i], bspline[i + 1]]);
  }

  for (var i = 0; i < pairs.length; i++) {
    one_thirds.push(interpolate(pairs[i][0], pairs[i][1], 1 / 3));
    two_thirds.push(interpolate(pairs[i][1], pairs[i][0], 1 / 3));
  }

  for (var i = 0; i < bspline.length - 3; i++) {
    var coords = [];
    var start = interpolate(two_thirds[i], one_thirds[i + 1], 0.5);
    coords.push(one_thirds[i + 1]);
    coords.push(two_thirds[i + 1]);
    coords.push(interpolate(two_thirds[i + 1], one_thirds[i + 2], 0.5));

    beziers.push([start, coords[0], coords[1], coords[2]]);
  }

  return beziers;
}

function parseNotes(osuObj) {
  return _.map(osuObj.HitObjects, function (x) {
    var newObj = {
      time: x.time,
         newCombo: (x.type & 4) > 0
    };

    if ((x.type & 1) > 0) {
      newObj.x = x.x;
      newObj.y = x.y;
    } else if ((x.type & 2) > 0) {
      if (x.sliderType === 'P') {
        newObj.points = x.curvePoints;
        newObj.type = 'arc';
        newObj.arc = generateArcFromPoints(newObj.points);
        newObj.path = getArcPath(newObj.arc, 10);
      } else if (x.sliderType === 'B') {
        newObj.points = BsplineToBezierSpline(x.curvePoints);
        newObj.type = 'bezier';
        var tempB = new BezierSpline(newObj.points);
        newObj.path = tempB.getPath(10);
        newObj.arcLength = tempB.arcLength;
      }
    } else if ((x.type & 8) > 0) {
      newObj.endTime = x.endTime;
    }
    return newObj;
  });
}
