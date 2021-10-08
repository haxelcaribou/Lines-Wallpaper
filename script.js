const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

// TODO
// update color settings without full color reset
// update line number without full reset
// add color support
// basic performance and cleanliness improvements

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
  return (n1 % n2 + n2) % n2;
}

function clamp(v, l, h) {
  return (v < l) ? l : (v > h) ? h : v;
}

function getColor() {
  let sBase = colorSettings.s;
  let lBase = colorSettings.l;
  let sVar = colorSettings.sVar;
  let lVar = colorSettings.lVar;

  if (sVar / 2 > sBase) {
    sBase = (sBase + sVar / 2) / 2;
    sVar = colorSettings.s + sVar / 2;
  } else if (sBase + sVar / 2 > 100) {
    sBase = 100 - ((100 - sBase) + sVar / 2) / 2;
    sVar = (100 - colorSettings.s) + sVar / 2;
  }

  if (lVar / 2 > lBase) {
    lBase = (lBase + lVar / 2) / 2;
    lVar = colorSettings.l + lVar / 2;
  } else if (lBase + lVar / 2 > 100) {
    lBase = 100 - ((100 - lBase) + lVar / 2) / 2;
    lVar = (100 - colorSettings.l) + lVar / 2;
  }

  let h = mod(colorSettings.h + Math.random() * colorSettings.hVar - colorSettings.hVar / 2, 360);
  let s = clamp(sBase + Math.random() * sVar - sVar / 2, 0, 100);
  let l = clamp(lBase + Math.random() * lVar - lVar / 2, 0, 100);
  return "hsl(" + h + "," + s + "%," + l + "%)";
}

function updateColors() {
  for(let line of lines) {
    line.c1 = getColor();
    line.c2 = getColor();
  }
}

function updateSpeed(pSpeed, speed) {
  let m = speed / pSpeed;
  for(let line of lines) {
    line.v *= m;
  }
}

function constructLines() {
  lines = [];
  let lineSize = canvas.height / wallpaperSettings.numLines;
  let numLines = wallpaperSettings.numLines;
  for (let i = 0; i < numLines; i += 1) {
    lines.push({
      c1: getColor(),
      c2: getColor(),
      y: i * lineSize,
      h: lineSize,
      p: Math.round(Math.random() * canvas.width),
      v: wallpaperSettings.lineSpeed / 2 + Math.random() * wallpaperSettings.lineSpeed / 2
    });
  }
}

function updateLinePos() {
  if (wallpaperSettings.direction == "rtl") {
    for(let line of lines) {
      if (line.p > 0) {
        line.p -= line.v;
      } else if (Math.random() <= wallpaperSettings.newLineProb) {
        line.p = canvas.width;
        line.c1 = line.c2;
        line.c2 = getColor();
      }
    }
  } else {
    for(let line of lines) {
      if (line.p < canvas.width) {
        line.p += line.v;
      } else if (Math.random() <= wallpaperSettings.newLineProb) {
        line.p = 0;
        line.c2 = line.c1;
        line.c1 = getColor();
      }
    }
  }
}

function drawLines() {
  for(let line of lines) {
    c.fillStyle = line.c1;
    c.fillRect(0, line.y, line.p, line.h);
    c.fillStyle = line.c2;
    c.fillRect(line.p, line.y, canvas.width - line.p, line.h);
  }
}

function step() {
  window.requestAnimationFrame(step);

  let now = performance.now() / 1000;
  let dt = Math.min(now - last, 1);
  last = now;

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
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
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
      colorSettings.sVar = properties.saturationrange.value;
      updateColors();
    }
    if (properties.lightnessrange) {
      colorSettings.lVar = properties.lightnessrange.value;
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
