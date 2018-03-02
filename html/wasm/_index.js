import { sq_dist, find_closest_char, make_ascii, get_grey_image, get_slice_of_img } from './ascii';
import { booted } from './ascii_wasm';

const ar1 = Int32Array.from([12, 3, 4, 3, 5]);
const ar2 = Int32Array.from([7, 5, 6, 8, 3]);

booted.then(() => {
  console.log(sq_dist(ar1, ar2));
  console.log(sqDist(ar1, ar2));
});
let count = 0;
function sqDist(ar1, ar2) {
  let sum = 0;
  for (let i = 0; i < ar1.length; i++) {
    sum += (ar1[i] - ar2[i]) * (ar1[i] - ar2[i]);
  }
  count++;
  return sum;
}

const grey = (r, g, b) => r * 0.21 + g * 0.72 + b * 0.07;
let charWidth;
let charHeight;
let charList = [];

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

function findClosestChar(matrix, charTable) {
  let char = '';
  let minDist = Infinity;
  Object.keys(charTable).forEach(key => {
    //const dist = sqDist(Uint8Array.from(matrix), Uint8Array.from(charTable[key]));
    const dist = sq_dist(matrix, charTable[key]);
    if (dist < minDist) {
      char = key;
      minDist = dist;
    }
  });
  return char;
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
const charTable = makeCharTable();
const charLength = charWidth * charHeight;
const charCount = charList.length;
const i32CharTable = new Int32Array(charLength * charCount);
charList.forEach((char, i) => i32CharTable.set(charTable[char], i * charLength));

function makeAscii(ctx, cw, ch) {
  //const ascii = [];
  const iw = ctx.canvas.width;
  const ih = ctx.canvas.height
  count = 0;
  console.time('makeAscii');
  /*
  for (let y = 0; y < ih; y += ch) {
    y > 0 && ascii.push('\n');
    for (let x = 0; x < iw; x += cw) {
      const m = getGrayMatrix(ctx.getImageData(x, y, cw, ch));
      //const char = findClosestChar(Int32Array.from(m), charTable);
      const char = charList[find_closest_char(Int32Array.from(m), i32CharTable, charCount)];
      ascii.push(char);
    }
  }
  const iData = ctx.getImageData(0, 0, iw, ih).data;
  console.log(get_slice_of_img(iData, iw, 0,0,8,8));
  console.log(get_grey_image(iData, iw, ih, cw, ch));
  console.log(iw,ih, iw*ih);
  console.log(charList.join(''));
  console.log(charList[~~(charList.lenght/2)]);
  console.log(make_ascii(iData, iw, ih, i32CharTable, cw, ch, charList.join(''), charList.length));
  */
  const ascii = make_ascii(ctx.getImageData(0, 0, iw, ih).data, iw, ih, i32CharTable, cw, ch, charList.join(''), charList.length);
  console.timeEnd('makeAscii');
  const textarea = document.querySelector('textarea');
  textarea.value = ascii;
  textarea.style.width = `${ctx.canvas.width}px`;
  textarea.style.height = `${ctx.canvas.height}px`;
}
const input = document.querySelector('input');
input.addEventListener('change', loadImage);

function loadImage() {
  const file = input.files[0];
  if (!file || /^image/i.test(!file.type)) {
    return;
  }
  const img = new Image();
  img.onload = () => {
    const can = document.createElement('canvas');
    const ctx = can.getContext('2d');
    const w = img.width - img.width % charWidth;
    const h = img.height - img.height % charHeight;
    can.width = w;
    can.height = h;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    normalizeImage(ctx);

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
