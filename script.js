const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

// TODO
// do the speed math
// update display on variable change

var last = performance.now() / 1000;
var fpsThreshold = 0;

const colorSettings = {
  h: 160,
  s: 65,
  l: 50,
  hVar: 120,
  sVar: 70,
  lVar: 50
};

const wallpaperSettings = {
  numLines: 10,
  newLineProb: 1 / 50,
  lineSpeed: 500,
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
      p: Math.random(),
      v: 1 / (wallpaperSettings.lineSpeed + Math.random() * wallpaperSettings.lineSpeed)
    };
    lines.push(info);
  }
}

function updateLines() {
  lines.forEach(function(l) {
    if (l.p > 0) {
      l.p -= l.v;
    } else if (Math.random() <= wallpaperSettings.newLineProb) {
      l.p = 1;
      l.c1 = l.c2;
      l.c2 = getColor();
    }
  });
}

function drawLines() {
  let i;
  lines.forEach(function(l) {
    c.fillStyle = l.c1;
    c.fillRect(0, l.y, canvas.width * l.p, l.h);
    c.fillStyle = l.c2;
    c.fillRect(canvas.width * l.p, l.y, canvas.width * (1 - l.p), l.h);
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

  updateLines();
  drawLines();
}

function rgbToHsl(r, g, b) {
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max == min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

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

      let r = p[0];
      let g = p[1];
      let b = p[2];

      let v = rgbToHsl(p[0], p[1], p[2]);

      colorSettings.h = v[0];
      colorSettings.s = v[1];
      colorSettings.l = v[2];
    }
    if (properties.numlines) {
      wallpaperSettings.numLines = properties.numlines.value;
    }
    if (properties.temp) { // TODO: rename the thing
      wallpaperSettings.newLineProb = properties.temp.value;
    }
    if (properties.speed) {
      let value = properties.speed.value;
      wallpaperSettings.lineSpeed = value;
    }
    if (properties.huerange) {
      colorSettings.hVar = properties.huerange.value;
    }
    if (properties.saturationrange) {
      colorSettings.sVar = properties.saturationrange.value;
    }
    if (properties.lightnessrange) {
      colorSettings.lVar = properties.lightnessrange.value;
    }
  }
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
