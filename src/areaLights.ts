import { ClampToEdgeWrapping, DataTexture, DataUtils, FloatType, HalfFloatType, LinearFilter, NearestFilter, RGBAFormat, UniformsLib, UVMapping, type WebGLRenderer } from 'three';

// Exact Three.js r180 LTC tables, stored as binary to avoid parsing thousands
// of numeric JS literals. Float32 and FP16 equivalence is checked by the exporter.
let tables: Float32Array | undefined;
let pending: Promise<void> | undefined;
const textures = new Map<boolean, [DataTexture, DataTexture]>();

export function prepareAreaLights() {
  if (tables) return Promise.resolve();
  const compressed = typeof DecompressionStream !== 'undefined';
  const url = compressed ? new URL('./assets/area-light-lut.bin.gz', import.meta.url) : new URL('./assets/area-light-lut.bin', import.meta.url);
  const load = async (source: URL, gzip: boolean) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
      const response = await fetch(source, { signal: controller.signal });
      if (!response.ok) throw new Error('Could not load studio lighting');
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Some hosts decode gzip themselves; never decompress an already decoded response.
      const decoded = gzip && bytes[0] === 0x1f && bytes[1] === 0x8b
        ? await new Response(new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer()
        : buffer;
      if (decoded.byteLength !== 131072) throw new Error('Invalid studio lighting table');
      return new Float32Array(decoded);
      } finally {
        clearTimeout(timeout);
      }
  };
  return pending ??= load(url, compressed)
    .catch(error => {
      if (!compressed) throw error;
      return load(new URL('./assets/area-light-lut.bin', import.meta.url), false);
    })
    .then(data => { tables = data; })
    .catch(error => { pending = undefined; throw error; });
}

export function initAreaLights(renderer: WebGLRenderer) {
  if (!tables) throw new Error('Studio lighting is not ready');
  const float = renderer.extensions.has('OES_texture_float_linear');
  let pair = textures.get(float);
  if (!pair) {
    pair = [0, 1].map(index => {
      const source = tables!.subarray(index * 16384, (index + 1) * 16384);
      const data = float ? source : Uint16Array.from(source, DataUtils.toHalfFloat);
      const texture = new DataTexture(data, 64, 64, RGBAFormat, float ? FloatType : HalfFloatType, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, NearestFilter, 1);
      texture.needsUpdate = true;
      return texture;
    }) as [DataTexture, DataTexture];
    textures.set(float, pair);
  }
  Object.assign(UniformsLib, { LTC_FLOAT_1: pair[0], LTC_FLOAT_2: pair[1], LTC_HALF_1: pair[0], LTC_HALF_2: pair[1] });
}
