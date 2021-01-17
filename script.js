const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

// TODO
// update color settings without full color reset
// update line number without full reset
// fix excessive max and min s/l values at high variances
// add color support

var last = performance.now() / 1000;
var fpsThreshold = 0;

var colorSettings = {
  h: 160,
  s: 65,
  l: 50,
  hVar: 120,
  sVar: 70,
  lVar: 50
};

var wallpaperSettings = {
  numLines: 10,
  newLineProb: 1 / 50,
  lineSpeed: 1,
  direction: "rtl",
  fps: 0
};

var lines = [];

function mod(n1, n2) {
  return ((n1 % n2) + n2) % n2;
}

function clamp(v, l, h) {
  return (v < l) ? l : (v > h) ? h : v;
}

function getColor() {
  let h = mod(colorSettings.h + Math.random() * colorSettings.hVar - colorSettings.hVar / 2, 360);
  let s = clamp(colorSettings.s + Math.random() * colorSettings.sVar - colorSettings.sVar / 2, 0, 100);
  let l = clamp(colorSettings.l + Math.random() * colorSettings.lVar - colorSettings.lVar / 2, 0, 100);
  return "hsl(" + h + "," + s + "%," + l + "%)";
}

function updateColors() {
  lines.forEach(function(n) {
    n.c1 = getColor();
    n.c2 = getColor();
  });
}

function updateSpeed(pSpeed, speed) {
  let m = speed / pSpeed;
  lines.forEach(function(n) {
    n.v *= m;
  });
}

function constructLines() {
  lines = [];
  let lineSize = canvas.height / wallpaperSettings.numLines;
  let i;
  for (i = 0; i < wallpaperSettings.numLines; i += 1) {
    let info = {
      c1: getColor(),
      c2: getColor(),
      y: i * lineSize,
      h: lineSize,
      p: Math.round(Math.random()*canvas.width),
      v: wallpaperSettings.lineSpeed / 2 + Math.random() * wallpaperSettings.lineSpeed / 2
    };
    lines.push(info);
  }
}

function updateLinePos() {
  if (wallpaperSettings.direction == "rtl") {
    lines.forEach(function(n) {
      if (n.p > 0) {
        n.p -= n.v;
      } else if (Math.random() <= wallpaperSettings.newLineProb) {
        n.p = canvas.width;
        n.c1 = n.c2;
        n.c2 = getColor();
      }
    });
  } else {
    lines.forEach(function(n) {
      if (n.p < canvas.width) {
        n.p += n.v;
      } else if (Math.random() <= wallpaperSettings.newLineProb) {
        n.p = 0;
        n.c2 = n.c1;
        n.c1 = getColor();
      }
    });
  }
}

function drawLines() {
  lines.forEach(function(n) {
    c.fillStyle = n.c1;
    c.fillRect(0, n.y, n.p, n.h);
    c.fillStyle = n.c2;
    c.fillRect(n.p, n.y, canvas.width - n.p, n.h);
  });
}

function step() {
  window.requestAnimationFrame(step);

  // Figure out how much time has passed since the last animation
  let now = performance.now() / 1000;
  let dt = Math.min(now - last, 1);
  last = now;

  // Abort updating the animation if we have reached the desired FPS
  if (wallpaperSettings.fps > 0) {
    fpsThreshold += dt;
    if (fpsThreshold < 1.0 / wallpaperSettings.fps) {
      return;
    }
    fpsThreshold -= 1.0 / wallpaperSettings.fps;
  }

  updateLinePos();
  drawLines();
}

function rgbToHsl(r, g, b) {
  let cmin = Math.min(r,g,b),
      cmax = Math.max(r,g,b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

    if (delta == 0)
      h = 0;
    else if (cmax == r)
      h = ((g - b) / delta) % 6;
    else if (cmax == g)
      h = (b - r) / delta + 2;
    else
      h = (r - g) / delta + 4;

    h = Math.round(h * 60);

    h = mod(h, 360);

    l = (cmax + cmin) / 2;

    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return [h, s, l];
}

window.wallpaperPropertyListener = {
  applyGeneralProperties: function(properties) {
    if (properties.fps) {
      wallpaperSettings.fps = properties.fps;
    }
  },
  applyUserProperties: function(properties) {
    if (properties.color) {
      let p = properties.color.value.split(" ");

      let v = rgbToHsl(p[0], p[1], p[2]);

      colorSettings.h = v[0];
      colorSettings.s = v[1];
      colorSettings.l = v[2];

      updateColors();
    }
    if (properties.numlines) {
      wallpaperSettings.numLines = properties.numlines.value;
      constructLines();
    }
    if (properties.temp) { // TODO: rename the thing
      //wallpaperSettings.newLineProb = properties.temp.value;
    }
    if (properties.speed) {
      let pSpeed = wallpaperSettings.lineSpeed;
      wallpaperSettings.lineSpeed = properties.speed.value;
      updateSpeed(pSpeed, wallpaperSettings.lineSpeed);
    }
    if (properties.direction) {
      wallpaperSettings.direction = properties.direction.value;
    }
    if (properties.huerange) {
      colorSettings.hVar = properties.huerange.value;
      updateColors();
    }
    if (properties.saturationrange) {
      let saturationRange = properties.saturationrange.value;
      if (saturationRange / 2 > colorSettings.s) {
        colorSettings.s = saturationRange / 2;
      } else if (colorSettings.s + saturationRange / 2 > 100) {
        colorSettings.s = 100 - saturationRange / 2;
      }
      colorSettings.sVar = saturationRange;
      updateColors();
    }
    if (properties.lightnessrange) {
      let lightnessRange = properties.lightnessrange.value;
      if (lightnessRange / 2 > colorSettings.l) {
        colorSettings.l = lightnessRange / 2;
      } else if (colorSettings.l + lightnessRange / 2 > 100) {
        colorSettings.l = 100 - lightnessRange / 2;
      }
      colorSettings.lVar = lightnessRange;
      updateColors();
    }
  },
}

window.onResize = function() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.onload = function() {
  window.onResize();
  constructLines();
  window.requestAnimationFrame(step);
}
