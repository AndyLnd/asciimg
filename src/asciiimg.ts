import {ctxToAscii} from './wasm';
import type {Writable} from 'svelte/store';

let camReqId: number;

export async function startCam(
  $ascii: Writable<string>,
  $contrast: Writable<number>,
  $threshold: Writable<number>,
  width = 512,
  height = 288
) {
  const constraints = {audio: false, video: {width, height}};
  const video = document.createElement('video');
  const can = document.createElement('canvas');
  let contrast: number;
  let threshold: number;
  $contrast.subscribe((val) => {
    contrast = val;
  });
  $threshold.subscribe((val) => {
    threshold = val;
  });
  can.width = width;
  can.height = height;
  const ctx = can.getContext('2d')!;
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;
  video.onloadedmetadata = () => {
    video.play();
    function processFrame() {
      ctx.drawImage(video, 0, 0);
      $ascii.set(ctxToAscii(ctx, contrast, threshold));
      camReqId = requestAnimationFrame(processFrame);
    }
    processFrame();
  };
}

export function stopCam() {
  cancelAnimationFrame(camReqId);
}

export async function fileToAscii(file: File, contrast: number, threshold: number): Promise<string> {
  if (!/^image/i.test(file.type)) {
    return '';
  }
  const img = await loadImage(window.URL.createObjectURL(file));
  const can = document.createElement('canvas');
  const ctx = can.getContext('2d')!;
  const w = img.width; // - img.width % charWidth;
  const h = img.height + 3; // - img.height % charHeight;
  can.width = w;
  can.height = h;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 3, w, h);
  return ctxToAscii(ctx, contrast, threshold);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = url;
  });
}
