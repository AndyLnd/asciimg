import {ctxToAscii} from './wasm';
import type {Writable} from 'svelte/store';

let camReqId: number;
let stream: MediaStream;

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
  stream = await navigator.mediaDevices.getUserMedia(constraints);
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
  stream?.getTracks().forEach((track) => track.stop());
  cancelAnimationFrame(camReqId);
}

export async function fileToAscii(
  file: File,
  contrast: number,
  threshold: number,
  offsetX: number,
  offsetY: number
): Promise<string> {
  if (!/^image/i.test(file.type)) {
    return '';
  }
  const img = await loadImage(window.URL.createObjectURL(file));
  const can = document.createElement('canvas');
  const ctx = can.getContext('2d')!;
  const scaleW = img.width > 1000 ? 1000 / img.width : 1;
  const scaleH = img.height > 1000 ? 1000 / img.height : 1;
  const scale = Math.min(scaleW, scaleH);
  const w = img.width * scale; // - img.width % charWidth;
  const h = img.height * scale; // - img.height % charHeight;
  can.width = w;
  can.height = h;
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, offsetX, offsetY, w, h);
  return ctxToAscii(ctx, contrast, threshold);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.src = url;
  });
}
