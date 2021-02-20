import type {Writable} from 'svelte/store';
import {ctxToAscii} from './wasm';

interface Circle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
}

type Line = [[number, number], [number, number]];

type WeightMap = number[][];

const H = 50;
const W = 50;

const rnd = (num: number) => Math.random() * num;

const isInRange = (val: number, limA: number, limB: number) =>
  Math.min(limA, limB) <= val && val <= Math.max(limA, limB);

const findThreshold = (t: number, a: number, b: number): number | undefined => {
  if (isInRange(t, a, b)) {
    return Math.abs(t - a) / Math.abs(a - b);
  }
  return undefined;
};

const calculateWeights = (width: number, height: number, circles: Circle[]): WeightMap =>
  Array.from({length: height + 1}, (_v1, y) =>
    Array.from({length: width + 1}, (_v2, x) => calculateWeight(x, y, circles))
  );

const calculateWeight = (cx: number, cy: number, circles: Circle[]): number =>
  circles.reduce((sum, {x, y, r}) => sum + (r * r) / ((cx - x) ** 2 + (cy - y) ** 2), 0);

const randomCircle = (maxX: number, maxY: number, minR: number, maxR: number): Circle => ({
  x: rnd(maxX),
  y: rnd(maxY),
  r: rnd(maxR - minR) + minR,
  vx: rnd(0.4) - 0.2,
  vy: rnd(0.4) - 0.2,
});

const updateCircles = (circles: Circle[], W: number, H: number): Circle[] =>
  circles.map(({x, y, r, vx, vy}) => {
    x = x + vx;
    if (x < 0 || x > W) {
      vx = -vx;
    }
    y = y + vy;
    if (y < 0 || y > H) {
      vy = -vy;
    }
    return {x, y, r, vx, vy};
  });

const calculateLines = (ws: WeightMap, t: number = 1): Line[] => {
  const lines: Line[] = [];
  ws.forEach((row, y) =>
    row.forEach((wA, x) => {
      const points = [];
      const wB = ws[y][x + 1];
      const wC = ws[y + 1]?.[x + 1];
      const wD = ws[y + 1]?.[x];
      const p1 = findThreshold(t, wA, wB);
      const p2 = findThreshold(t, wA, wD);
      const p3 = findThreshold(t, wD, wC);
      const p4 = findThreshold(t, wB, wC);
      if (p1 !== undefined) points.push([x + p1, y]);
      if (p2 !== undefined) points.push([x, y + p2]);
      if (p3 !== undefined) points.push([x + p3, y + 1]);
      if (p4 !== undefined) points.push([x + 1, y + p4]);
      if (points.length === 2) {
        lines.push(points as Line);
      }
    })
  );

  return lines;
};

function drawLines(lines: Line[], ctx: CanvasRenderingContext2D) {
  const cellH = ctx.canvas.height / H;
  const cellW = ctx.canvas.width / W;
  lines.forEach(([[x1, y1], [x2, y2]]) => {
    ctx.beginPath();
    ctx.moveTo(x1 * cellW, y1 * cellH);
    ctx.lineTo(x2 * cellW, y2 * cellH);
    ctx.stroke();
  });
}

let blobReqId: number;

export const startBlobs = ($ascii: Writable<string>, width = 300, height = 300) => {
  const can = document.createElement('canvas');
  can.width = width;
  can.height = height;
  const ctx = can.getContext('2d')!;
  const loop = (circles: Circle[]) => {
    const weights = calculateWeights(W, H, circles);
    ctx.clearRect(0, 0, width, height);

    const lines1 = calculateLines(weights);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2;
    drawLines(lines1, ctx);
    $ascii.set(ctxToAscii(ctx));
    blobReqId = requestAnimationFrame(() => loop(updateCircles(circles, W, H)));
  };

  const circles = Array.from({length: 10}, () => randomCircle(W, H, 1, 7));
  loop(circles);
};

export const stopBlobs = () => {
  cancelAnimationFrame(blobReqId);
};
