import { make_ascii } from './ascii';
import { booted } from './ascii_wasm';

function sqDist(ar1, ar2) {
  let sum = 0;
  for (let i = 0; i < ar1.length; i++) {
    sum += (ar1[i] - ar2[i]) * (ar1[i] - ar2[i]);
  }
  return sum;
}

const grey = (r, g, b) => r * 0.21 + g * 0.72 + b * 0.07;
let charWidth;
let charHeight;
let charList = [];
let charString = '';

function getGrayMatrix(iData) {
  const d = iData.data;
  const matrix = [];
  for (let i = 0; i < d.length; i += 4) {
    matrix.push(~~grey(d[i], d[i + 1], d[i + 2]));
  }
  return matrix;
}

function getRedMatrix(iData) {
  const matrix = [];
  const d = iData.data;
  for (let i = 0; i < d.length; i += 4) {
    matrix.push(d[i]);
  }
  return matrix;
}

function makeCharTable(fontSize = '8px', fontFamily = 'monospace') {
  const span = document.createElement('span');
  span.style.fontFamily = fontFamily;
  span.style.fontSize = fontSize;
  span.textContent = '.';
  document.body.appendChild(span);
  charWidth = span.offsetWidth;
  charHeight = span.offsetHeight;
  document.body.removeChild(span);
  const can = document.createElement('canvas');
  can.width = charWidth;
  can.height = charHeight;
  const ctx = can.getContext('2d');
  const charTable = {};
  for (let i = 32; i < 256; i++) {
    if (i > 126 && i < 161) continue;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, charWidth, charHeight);
    ctx.fillStyle = '#000';
    ctx.font = `${fontSize} ${fontFamily}`;
    const char = String.fromCharCode(i);
    ctx.fillText(char, 0, charHeight);
    charTable[char] = Int32Array.from(getGrayMatrix(ctx.getImageData(0, 0, charWidth, charHeight)));
    charList.push(char);
  }
  return charTable;
}

function makeCharImage(fontSize = '8px', fontFamily = 'monospace') {
  const span = document.createElement('span');
  span.style.fontFamily = fontFamily;
  span.style.fontSize = fontSize;
  span.textContent = '.';
  document.body.appendChild(span);
  charWidth = span.offsetWidth;
  charHeight = span.offsetHeight;
  document.body.removeChild(span);
  charString = '';
  for (let i = 32; i < 256; i++) {
    if (i > 126 && i < 161) continue;
    charString += String.fromCharCode(i);
  }
  const can = document.createElement('canvas');
  can.width = charString.length * charWidth;
  can.height = charHeight;
  const ctx = can.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, can.width, can.height);
  ctx.fillStyle = '#000';
  ctx.font = `${fontSize} ${fontFamily}`;
  ctx.fillText(charString, 0, charHeight);
  return ctx.getImageData(0, 0, can.width, can.height).data;
}

const charTable = makeCharTable();
const charImageData = makeCharImage();
const charLength = charWidth * charHeight;
const charCount = charList.length;
const i32CharTable = new Int32Array(charLength * charCount);
charList.forEach((char, i) => i32CharTable.set(charTable[char], i * charLength));

function makeAscii(ctx) {
  const iw = ctx.canvas.width;
  const ih = ctx.canvas.height;

  const contrast = parseInt(document.querySelector('#contrast').value);
  const threshold = 255 - parseInt(document.querySelector('#threshold').value);

  console.time('make_ascii');
  const ascii = make_ascii(
    ctx.getImageData(0, 0, iw, ih).data,
    iw,
    ih,
    i32CharTable,
    charWidth,
    charHeight,
    charList.join(''),
    charList.length,
    contrast,
    threshold
  );
  //console.log(ctx.getImageData(0, 0, iw, ih).data, iw, ih, charImageData, cw, ch, charString, charString.length);
  //console.log(make_ascii_2());
  /*
  const ascii = make_ascii_2(
    ctx.getImageData(0, 0, iw, ih).data,
    iw,
    ih,
    charImageData,
    cw,
    ch,
    charString,
    charString.length
  );
  */
  console.timeEnd('make_ascii');

  const output = document.querySelector('#output');
  output.value = ascii;
  output.style.width = `${ctx.canvas.width}px`;
  output.style.height = `${ctx.canvas.height}px`;
}
const fileInput = document.querySelector('#file');
fileInput.addEventListener('change', loadImage);

document.querySelector('#webcam').addEventListener('click', startWebcam);

document.querySelector('#contrast').addEventListener('change', loadImage);
document.querySelector('#threshold').addEventListener('change', loadImage);
document.querySelector('#make-ascii').addEventListener('click', loadImage);

function loadImage() {
  const file = fileInput.files[0];
  if (!file || /^image/i.test(!file.type)) {
    return;
  }
  const img = new Image();
  img.onload = () => {
    const can = document.createElement('canvas');
    const ctx = can.getContext('2d');
    const w = img.width; // - img.width % charWidth;
    const h = img.height; // - img.height % charHeight;
    can.width = w;
    can.height = h;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    // normalizeImage(ctx);

    makeAscii(ctx, charWidth, charHeight);
  };
  img.src = window.URL.createObjectURL(file);
}

function adjustAlpha(c, a, d, s) {
  const amount = a / 255;
  return (255 - (255 - c) * amount - d) * s;
}

function normalizeImage(ctx) {
  const iData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  const d = iData.data;
  let lightest = 0;
  let darkest = 255;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const a = d[i + 3];

    if (a === 0) {
      d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 255;
    } else {
      const greyValue = Math.round(grey(r, g, b));
      if (greyValue > lightest) {
        lightest = greyValue;
      }
      if (greyValue < darkest) {
        darkest = greyValue;
      }
    }
  }
  const scale = 255 / (lightest - darkest);

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const a = d[i + 3];
    if (a === 0) {
      d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 255;
    } else {
      const greyValue = grey(r, g, b);
      const newValue = Math.round(adjustAlpha(greyValue, a, darkest, scale));
      d[i] = d[i + 1] = d[i + 2] = newValue;
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(iData, 0, 0);
}

function startWebcam() {
  const constraints = { audio: false, video: { width: 640, height: 360 } };
  const video = document.createElement('video');
  const can = document.createElement('canvas');
  can.width = 640;
  can.height = 360;
  const ctx = can.getContext('2d');
  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(stream => {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        function processFrame (){
          ctx.drawImage(video,0,0);
          makeAscii(ctx);
          setTimeout(processFrame, 0);
        }
        processFrame();
      };
    })
    .catch(err => console.log(err.name + ': ' + err.message));
}
