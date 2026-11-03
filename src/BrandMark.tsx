import { useEffect, useRef } from 'react';

/** Composite the supplied JPG onto the dark stage without redrawing its mark.
 * RGB values and proportions of the original artwork remain unchanged.
 * Only the warm ivory page surrounding the artwork becomes transparent.
 */
export default function BrandMark({ className = '' }: { className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let alive = true;
    const image = new Image();
    image.onload = () => {
      if (!alive || !canvas.current) return;
      const source = document.createElement('canvas');
      source.width = image.naturalWidth; source.height = image.naturalHeight;
      const context = source.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, source.width, source.height);
      const visited = new Uint8Array(source.width * source.height);
      const queue: number[] = [];
      for (let x = 0; x < source.width; x++) queue.push(x, (source.height - 1) * source.width + x);
      for (let y = 0; y < source.height; y++) queue.push(y * source.width, y * source.width + source.width - 1);
      for (let head = 0; head < queue.length; head++) {
        const n = queue[head];
        if (visited[n]) continue;
        visited[n] = 1;
        const p = n * 4;
        const r = pixels.data[p], g = pixels.data[p + 1], b = pixels.data[p + 2];
        if (Math.min(r, g, b) < 186 || Math.max(r, g, b) - Math.min(r, g, b) > 55 || r < b - 2 || g < b - 4) continue;
        pixels.data[p + 3] = 0;
        const x = n % source.width, y = Math.floor(n / source.width);
        if (x > 0) queue.push(n - 1);
        if (x < source.width - 1) queue.push(n + 1);
        if (y > 0) queue.push(n - source.width);
        if (y < source.height - 1) queue.push(n + source.width);
      }
      let left = source.width, top = source.height, right = 0, bottom = 0;
      for (let y = 1; y < source.height - 1; y++) {
        for (let x = 0; x < source.width - 1; x++) {
          const p = (y * source.width + x) * 4;
          const [r, g, b] = pixels.data.subarray(p, p + 3);
          const paper = r > 222 && g > 215 && b > 202 && r - b > 5 && r >= g && g >= b;
          if (paper) pixels.data[p + 3] = 0;
          else if(pixels.data[p + 3]) { left = Math.min(left, x); right = Math.max(right, x); top = Math.min(top, y); bottom = Math.max(bottom, y); }
        }
      }
      // Remove the one-pixel JPG border together with its surrounding paper.
      for (let y = 0; y < source.height; y++) pixels.data[(y * source.width + source.width - 1) * 4 + 3] = 0;
      context.putImageData(pixels, 0, 0);
      if (right <= left || bottom <= top) return;
      const output = canvas.current;
      output.width = right - left + 1; output.height = bottom - top + 1;
      const target = output.getContext('2d');
      target?.drawImage(source, left, top, output.width, output.height, 0, 0, output.width, output.height);
    };
    image.src = '/logounda.jpg';
    return () => { alive = false; image.onload = null; };
  }, []);
  return <canvas className={className} ref={canvas} role="img" aria-label="UNDA Studios" width="150" height="52" />;
}
