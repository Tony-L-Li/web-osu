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
  _.map(osuObj.HitObjects, function (x) {
    if (x.type === 5) {
      
    }
  });
}
