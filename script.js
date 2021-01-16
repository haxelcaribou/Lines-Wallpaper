const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

const numLines = 10;
const newLineProb = 1 / 50;
const lineSpeed = 500;

const colorSettings = {
  h: 160,
  s: 65,
  l: 50,
  hVar: 120,
  sVar: 70,
  lVar: 50
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
  let lineSize = canvas.height / numLines;
  let i;
  for (i = 0; i < numLines; i += 1) {
    let info = {
      c1: getColor(),
      c2: getColor(),
      y: i * lineSize,
      h: lineSize,
      p: Math.random(),
      v: 1 / (lineSpeed  + Math.random() * lineSpeed)
    };
    lines.push(info);
  }
}

function updateLines() {
  lines.forEach(function(l) {
    if (l.p > 0) {
      l.p -= l.v;
    } else if (Math.random() <= newLineProb) {
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
  drawLines();
  updateLines();
  window.requestAnimationFrame(step);
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
