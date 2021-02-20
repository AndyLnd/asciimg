// @ts-ignore
import wasm from './rust/Cargo.toml';

let charWidth: number;
let charHeight: number;
let chars = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^`abcdefghijklmnopqrstuvwxyz{|}~'.split(
  ''
);
let ascii: any;
let charData: Uint32Array;

(async () =>  {
  ascii = await wasm();
  makeCharTable();
})()

function makeCharTable(fontSize = '8px', fontFamily = 'monospace') {
  const span = document.createElement('span');
  span.style.fontFamily = fontFamily;
  span.style.fontSize = fontSize;
  span.textContent = 'X';
  document.body.appendChild(span);
  charWidth = span.offsetWidth;
  charHeight = span.offsetHeight;
  document.body.removeChild(span);
  const can = document.createElement('canvas');
  can.width = charWidth * chars.length;
  can.height = charHeight;
  const ctx = can.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, can.width, can.height);
  ctx.fillStyle = '#000';
  ctx.font = `${fontSize} ${fontFamily}`;
  chars.forEach((c, i) => {
    ctx.fillText(c, i * charWidth, charHeight);
  });
  const iData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
  charData = ascii.get_char_blocks(iData.data, can.width, charWidth, charHeight);
  console.groupCollapsed('charData generated');
  console.log('charWidth:', charWidth);
  console.log('charHeight:', charHeight);
  console.log('chars:', chars.join(''));
  console.groupEnd();
}

export function ctxToAscii(ctx: CanvasRenderingContext2D, contrast = 1, threshold = 0): string {
  const {width, height} = ctx.canvas;
  const iData = ctx.getImageData(0, 0, width, height);
  console.time('make_ascii');
  const asciiI32 = ascii.make_ascii(iData.data, width, height, charData, charWidth, charHeight, contrast, threshold);
  console.timeEnd('make_ascii');
  return i32ToAscii(asciiI32);
}

function i32ToAscii(vals: Uint32Array): string {
  return Array.from(vals)
    .map((num) => (num === -1 ? '\n' : chars[num]))
    .join('');
}


