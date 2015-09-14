function Engine (container, songData) {
  function createCanvas(name, layer) {
    return $('<canvas>', {
      class: 'game-canvas',
      id: name,
      css: {
        'z-index': layer  
      },
           attr: {
             height: container.height() + 'px',
           width: container.height()*1.333 + 'px'
           }
    });  
  }

  var self = this;
  this.root = container;
  this.songData = songData;
  this.c = {};
  this.e = {
    bg: createCanvas('bg', 0),
    ui: createCanvas('ui', 1),
    slider: createCanvas('slider', 2),
    note: createCanvas('note', 3),
    cursorArea: createCanvas('cursor-area', 4)
  };
  console.log(songData);
  this.scale = this.root.height()/384;

  _.forOwn(this.e,function (x) {x.appendTo(self.root);}); 

  //resize
  $(window).resize(function () {
    _.each(self.e, function (v, k) {
      v.attr({
        'height': self.root.height() + 'px',
        'width': self.root.height()*1.333 + 'px'
      });
    }); 
    self.scale = self.root.height()/384;
  });

  //setup
  this.e.bg.css('background-color','#000');

  //get all canvas contexts
  _.each(self.e, function(v, k) {
    self.c[k] = document.getElementById(v.attr('id')).getContext('2d');
  });
}

Engine.prototype = {
  maxWidth: 512,
  maxHeight: 384,
  health: 1,
  accuracy: 0.4545,
  drawHealth: function (ctx) {
    var HEALTH_LEN = 220;
    var HEALTH_THICK = 8;

    ctx.save();
    ctx.fillStyle = '#FFF';
    ctx.fillRect(10, 10, HEALTH_LEN*this.health, HEALTH_THICK);  
    ctx.restore();
  },
  drawUIScore: function (ctx) { 
    //draw score
    ctx.font = '25px Nova Square';
    ctx.fillStyle = '#FFF';
    ctx.textAlign = 'right';
    ctx.fillText('00100020', 505, 25);

    //percentage
    ctx.font = '15px Nova Square';
    ctx.fillText((this.accuracy*100).toFixed(2) + '%', 505, 40);

    var tempComp = 0.4;
    //completion
    var cLeft = 430;
    var cTop = 35;

    ctx.fillStyle = '#AAA';
    ctx.beginPath();
    ctx.arc(cLeft, cTop, 7, 1.5*Math.PI, 2*Math.PI*tempComp);
    ctx.lineTo(cLeft, cTop);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(cLeft, cTop,7,0,2*Math.PI);
    ctx.moveTo(cLeft,cTop);
    ctx.arc(cLeft,cTop,0.5,0,2*Math.PI);
    ctx.stroke();
  },
  start: function () {
    var self = this;
    /*
       function drawArcFromPoints(points, context) {
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
       var angleStart = atan2(a.y - uy, a.x - ux);
       var angleEnd = atan2(c.y - uy, c.x - ux);
       var angleMid = atan2(b.y - uy, b.x - ux);
       var wrapped = (angleMid > angleStart && angleMid > angleEnd) || (angleMid < angleStart && angleMid < angleEnd);
       var counterclockwise = !((wrapped && angleStart > angleEnd) || (!wrapped && angleStart < angleEnd));
       context.beginPath();
       context.strokeStyle = '#FFF';
       context.arc(a.x,a.y,1,0,2*Math.PI);
       context.moveTo(b.x,b.y);
       context.arc(b.x,b.y,1,0,2*Math.PI);
       context.moveTo(c.x,c.y);
       context.arc(c.x,c.y,1,0,2*Math.PI);
       context.moveTo(ux,uy);
       function tan(x,y) {
       return Math.atan2(y,x);
    //return (2*Math.PI+Math.atan2(y,x)) % (2*Math.PI);
    }
    context.arc(ux,uy, r, tan(c.x-ux, c.y-uy), tan(a.x-ux, a.y-uy)); 
    context.stroke();
    }
    */

    _.each(self.c, function(v, k) {
      v.save();
      v.scale(self.scale, self.scale);
    });

    //sets UI layer
    var testSlider = 11;
    self.c.ui.clearRect(0, 0, 512, 384);
    self.drawHealth(self.c.ui);
    self.drawUIScore(self.c.ui);
    self.c.ui.beginPath();
    self.c.ui.moveTo(self.songData[testSlider].points[0][0].x, self.songData[testSlider].points[0][0].y);
    _.forEach(self.songData[testSlider].points, function(x) {
      self.c.ui.bezierCurveTo(x[1].x, x[1].y, x[2].x, x[2].y, x[3].x, x[3].y);
    });
    
    self.c.ui.stroke();
    var arc = self.songData[14].arc;
    self.c.ui.beginPath();
    self.c.ui.arc(arc.x, arc.y, arc.r, arc.startAngle, arc.endAngle, arc.ccw);
    self.c.ui.stroke();

    _.forEach(self.songData[testSlider].path, function(x) {
      self.c.ui.beginPath();
      self.c.ui.arc(x.x,x.y,2,0,2*Math.PI);
      self.c.ui.stroke();
    });
    /*
       var points = [{
       x:262,
       y:200
       },{
       x:260,
       y:252
       },{
       x:288,
       y:292
       }];
       drawArcFromPoints(points, self.c.ui);
       */
    _.each(self.c, function(v, k) {
      v.restore();
    });

    requestAnimationFrame(self.start.bind(self));
  }
};














