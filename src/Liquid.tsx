import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { initAreaLights, prepareAreaLights } from './areaLights';
import { HERO_QUALITY, heroQuality, prefersLightHeroEffects, type HeroQuality } from './heroPerformance';
import { sculptureGeometry, sculptureProfiles, brandGeometry } from './liquidGeometry';
export { prepareAreaLights };

/** Curved studio cards supply reflected light; they never appear as objects. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#111b25');
  // Feather the light cards so reflections roll off instead of looking painted on.
  const size = 64, pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = (x / (size - 1) - .5) * 2, v = (y / (size - 1) - .5) * 2;
    const light = Math.round(255 * Math.exp(-4 * (u ** 8 + v ** 8)));
    const offset = (y * size + x) * 4;
    pixels.set([light, light, light, 255], offset);
  }
  const diffuser = new THREE.DataTexture(pixels, size, size);
  diffuser.minFilter = diffuser.magFilter = THREE.LinearFilter;
  diffuser.needsUpdate = true;
  const resources: { geometry: THREE.PlaneGeometry; material: THREE.MeshBasicMaterial }[] = [];
  function softbox(color: string, intensity: number, width: number, height: number, position: number[], roll = 0) {
    const geometry = new THREE.PlaneGeometry(width, height, 20, 6);
    const points = geometry.getAttribute('position');
    for (let i = 0; i < points.count; i++) {
      const x = points.getX(i), y = points.getY(i);
      points.setZ(i, .35 * Math.sin(x / width * 4) + .25 * Math.cos(y / height * 3));
    }
    const material = new THREE.MeshBasicMaterial({ map: diffuser, color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false });
    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(position[0], position[1], position[2]);
    panel.lookAt(0, 0, 0); panel.rotateZ(roll);
    studio.add(panel); resources.push({ geometry, material });
  }
  softbox('#f4fbff', 5.5, 2.2, 12, [-4, 3, 5], -.6);
  softbox('#d9f1ff', 2.8, 3.2, 9, [5, 2, 2], .7);
  softbox('#78acff', 1.2, .55, 10, [3, -2, 5], -.55);
  softbox('#edffff', 4, 1.5, 7, [3, -2.7, 5], -.55);
  softbox('#f4ffff', 4.5, 10, 1.2, [0, 5, -3], -.3);
  softbox('#8ee2d4', 1.4, 6, 1.1, [-2, -5, 1], -.5);
  softbox('#b4e5ff', 2, 1.8, 8, [-5, -1, -3], .4);
  softbox('#ffffff', 3.5, .5, 8, [2, -1, -5], .7);
  softbox('#d6efff', 2.8, 3, 4.5, [-.5, -4, 5], -.65);
  const pmrem = new THREE.PMREMGenerator(renderer);
  try { return pmrem.fromScene(studio, .035, .1, 60); }
  finally {
    pmrem.dispose();
    diffuser.dispose();
    resources.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); });
    studio.clear();
  }
}

function glassMaterial(time: { value: number }, index: number) {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#edf8fa', metalness: 0, roughness: .075,
    transmission: .96, thickness: 1, ior: 1.46,
    attenuationColor: new THREE.Color('#73b9c5'), attenuationDistance: 2.8,
    envMapIntensity: 1.25, clearcoat: .18, clearcoatRoughness: .09,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = shader => {
    shader.uniforms.uFlowTime = time;
    shader.uniforms.uFlowPhase = { value: index * 2.4 };
    shader.uniforms.uFlowSpeed = { value: index === 0 ? .32 : .27 };
    shader.vertexShader = `
      uniform float uFlowTime;
      uniform float uFlowPhase;
      uniform float uFlowSpeed;
      attribute float liquidThickness;
      varying vec3 vSculpturePosition;
      varying float vLiquidThickness;
      const vec3 swellDirection = vec3(.48, .32, .18);
      const vec3 crossDirection = vec3(-.35, .82, .24);
      const vec3 rippleDirection = vec3(1.6, .9, -.3);
      const vec3 swellAmplitude = vec3(.025, .065, .105);
      const vec3 crossAmplitude = vec3(.018, .028, .042);
      const vec3 rippleAmplitude = vec3(.002, .004, .008);
      vec3 liquidFlow(vec3 p) {
        float t = uFlowTime * uFlowSpeed + uFlowPhase;
        return p + swellAmplitude * sin(dot(p, swellDirection) - t)
          + crossAmplitude * sin(dot(p, crossDirection) + t * .73 + 1.4)
          + rippleAmplitude * sin(dot(p, rippleDirection) - t * 1.23 + .6);
      }
      mat3 flowDerivative(vec3 amplitude, vec3 direction, float phase) {
        return mat3(amplitude * direction.x, amplitude * direction.y, amplitude * direction.z) * cos(phase);
      }
      mat3 liquidJacobian(vec3 p) {
        float t = uFlowTime * uFlowSpeed + uFlowPhase;
        return mat3(1.) + flowDerivative(swellAmplitude, swellDirection, dot(p, swellDirection) - t)
          + flowDerivative(crossAmplitude, crossDirection, dot(p, crossDirection) + t * .73 + 1.4)
          + flowDerivative(rippleAmplitude, rippleDirection, dot(p, rippleDirection) - t * 1.23 + .6);
      }
    ` + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
      #include <beginnormal_vertex>
      mat3 flowJ = liquidJacobian(position);
      objectNormal = normalize(mat3(cross(flowJ[1], flowJ[2]), cross(flowJ[2], flowJ[0]), cross(flowJ[0], flowJ[1])) * objectNormal);
    `).replace('#include <begin_vertex>', 'vec3 transformed = liquidFlow(position); vSculpturePosition = transformed; vLiquidThickness = liquidThickness;');
    // Match absorption to each section's depth; thin folds remain clearer.
    // The orthographic camera has parallel viewing rays, unlike perspective.
    const transmission = THREE.ShaderChunk.transmission_fragment
      .replace('material.thickness = thickness;', 'material.thickness = thickness * vLiquidThickness;')
      .replace('vec3 v = normalize( cameraPosition - pos );', 'vec3 v = isOrthographic ? inverseTransformDirection(vec3(0., 0., 1.), viewMatrix) : normalize(cameraPosition - pos);');
    shader.fragmentShader = 'varying vec3 vSculpturePosition;\nvarying float vLiquidThickness;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <transmission_fragment>', `
      ${transmission}
      #ifdef USE_TRANSMISSION
        vec3 glassRay = refract(-v, n, 1.0 / material.ior);
        vec3 internalLight = textureCubeUV(envMap, envMapRotation * glassRay, material.roughness).rgb;
        vec3 absorption = volumeAttenuation(material.thickness, material.attenuationColor, material.attenuationDistance);
        float facing = clamp(abs(dot(n, v)), 0., 1.);
        float f0 = pow((material.ior - 1.) / (material.ior + 1.), 2.);
        float fresnel = f0 + (1. - f0) * pow(1. - facing, 5.);
        // A CSS backdrop cannot be sampled by WebGL; the studio supplies the
        // missing transmitted light without replacing the physical reflections.
        totalDiffuse += internalLight * absorption * material.transmission * (1. - fresnel) * .18;
        material.transmissionAlpha = max(fresnel, material.transmissionAlpha);
      #endif
    `).replace('#include <opaque_fragment>', `
      // The left side recedes into the unlit stage behind the copy.
      float stageLight = mix(.28, 1., smoothstep(-4.5, 1.4, vSculpturePosition.x));
      outgoingLight *= stageLight;
      #include <opaque_fragment>
    `);
  };
  return material;
}

export default function Liquid({ onReady, onFailure }: { onReady: () => void; onFailure: () => void }) {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = mount.current!;
    let disposed = false;
    const graphics: (() => void)[] = [];
    const releaseGraphics = () => { for (const release of graphics.splice(0).reverse()) release(); };
    try {
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { onFailure(); return; }
    graphics.push(() => { renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); });
    renderer.domElement.style.opacity = '0';
    let lightEffects = prefersLightHeroEffects();
    let qualityName: HeroQuality = heroQuality();
    let quality = HERO_QUALITY[qualityName];
    renderer.setPixelRatio(Math.min(devicePixelRatio, lightEffects ? 1 : 1.5));
    renderer.setClearColor('#000000', 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.transmissionResolutionScale = lightEffects ? .5 : .75;
    el.appendChild(renderer.domElement);
    initAreaLights(renderer);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-8.92, 8.92, 5, -5, .1, 60);
    camera.position.set(0, 0, 16);
    const environment = studioEnvironment(renderer);
    graphics.push(() => environment.dispose());
    scene.environment = environment.texture;
    const stage = new THREE.Group(); scene.add(stage);
    const group = new THREE.Group(); stage.add(group);
    const time = { value: 0 };
    const resources = sculptureProfiles.map((profile, i) => {
      const geometry = sculptureGeometry(profile, quality.rows, quality.sides);
      const material = glassMaterial(time, i);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = i === 0 ? 'Upper liquid sculpture' : 'Lower liquid sculpture';
      group.add(mesh);
      const resource = { geometry, material, mesh };
      graphics.push(() => { resource.geometry.dispose(); material.dispose(); });
      return resource;
    });
    const logoGeometry = brandGeometry();
    graphics.push(() => logoGeometry.dispose());
    let textureReady = false, ready = false;
    const artwork = new THREE.TextureLoader().load('/hero-brand-texture.webp', () => { if (!disposed) { textureReady = true; invalidate(); } }, undefined, () => { if (!disposed) onFailure(); });
    graphics.push(() => artwork.dispose());
    artwork.colorSpace = THREE.SRGBColorSpace;
    artwork.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    // The brand artwork colors the face. Real bevels and extruded sides receive
    // the same studio light as the glass and reveal depth during parallax.
    const logoFace = new THREE.MeshPhysicalMaterial({ map: artwork, emissiveMap: artwork, emissive: '#ffffff', emissiveIntensity: .65, color: '#ffffff', metalness: .3, roughness: .17, envMapIntensity: .45, clearcoat: .7, clearcoatRoughness: .12 });
    const logoEdge = new THREE.MeshPhysicalMaterial({ color: '#185269', metalness: .7, roughness: .2, clearcoat: 1, envMapIntensity: .8 });
    graphics.push(() => { logoFace.dispose(); logoEdge.dispose(); });
    const logo = new THREE.Mesh(logoGeometry, [logoFace, logoEdge]);
    logo.name = 'UNDA original contours — extruded';
    logo.position.set(4.2, .6, .75);
    logo.rotation.set(.025, -.065, 0);
    // Waves retain their approved framing; the brand never inherits X-only scale.
    scene.add(logo);
    logoGeometry.computeBoundingBox();
    const logoRotation = new THREE.Matrix4().makeRotationFromEuler(logo.rotation);
    const logoBounds = logoGeometry.boundingBox!.clone().applyMatrix4(logoRotation);
    const logoSize = logoBounds.getSize(new THREE.Vector3());
    const logoCenter = logoBounds.getCenter(new THREE.Vector3());
    let logoBaseY = .6;
    const key = new THREE.RectAreaLight('#e3faff', .25, .7, 8);
    key.position.set(-3, 4, 6); key.lookAt(2, 0, 0); scene.add(key);
    const rim = new THREE.RectAreaLight('#2a9fff', .3, 1, 7);
    rim.position.set(6, 0, 4); rim.lookAt(3, 0, 0); scene.add(rim);
    const fill = new THREE.PointLight('#3bd8b0', .6, 18);
    fill.position.set(3, -3, 4); scene.add(fill);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const target = { x: 0, y: 0 };
    const hero = el.closest<HTMLElement>('.unda-hero')!;
    const pointer = (e: PointerEvent) => {
      if (reduced.matches || lightEffects || e.pointerType === 'touch') return;
      const bounds = hero.getBoundingClientRect();
      target.x = ((e.clientX - bounds.left) / bounds.width - .5) * .045;
      target.y = ((e.clientY - bounds.top) / bounds.height - .5) * .025;
    };
    const resetPointer = () => { target.x = 0; target.y = 0; };
    hero.addEventListener('pointermove', pointer, { passive: true });
    hero.addEventListener('pointerleave', resetPointer);
    let visible = true, covered = document.body.style.overflow === 'hidden', frame: number | null = null, last = 0, elapsed = 0, needsRender = true;
    let resolutionScale = 1, slowFrames = 0, adaptiveStill = false;
    let frameRate: number = quality.fps;
    function schedule() {
      if (!disposed && textureReady && frame === null && visible && !covered && !document.hidden) {
        frame = requestAnimationFrame(draw);
      }
    }
    function stop() { if (frame !== null) cancelAnimationFrame(frame); frame = null; last = 0; }
    function invalidate() { needsRender = true; schedule(); }
    function resizeScene() {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      lightEffects = prefersLightHeroEffects();
      if (lightEffects) resetPointer();
      const next = heroQuality();
      if (next !== qualityName) {
        qualityName = next; quality = HERO_QUALITY[next];
        resolutionScale = 1; slowFrames = 0; adaptiveStill = false; frameRate = quality.fps;
        resources.forEach((resource, i) => {
          resource.geometry.dispose();
          resource.geometry = sculptureGeometry(sculptureProfiles[i], quality.rows, quality.sides);
          resource.mesh.geometry = resource.geometry;
        });
      }
      resources.forEach(({ material }) => {
        const side = quality.doubleSided ? THREE.DoubleSide : THREE.FrontSide;
        if (material.side !== side) { material.side = side; material.needsUpdate = true; }
      });
      const baseRatio = Math.min(devicePixelRatio, quality.dpr, Math.sqrt(quality.pixels / (w * h)));
      const minRatio = Math.min(baseRatio, .8);
      const pixelRatio = Math.max(minRatio, baseRatio * resolutionScale);
      if (renderer.getPixelRatio() !== pixelRatio) renderer.setPixelRatio(pixelRatio);
      renderer.transmissionResolutionScale = quality.transmission;
      renderer.setSize(w, h);
      const mobile = matchMedia('(max-width: 767px)').matches;
      if (mobile) {
        const height = 9.8 / (w / h);
        camera.left = -.5; camera.right = 9.3;
        camera.top = height / 2 - .2; camera.bottom = -height / 2 - .2;
        stage.scale.set(1, 1, 1);
      } else {
        camera.left = -5 * w / h; camera.right = 5 * w / h;
        camera.top = 5; camera.bottom = -5;
        stage.scale.set((w / h) / 1.784, 1, 1);
      }
      camera.updateProjectionMatrix();
      // Fit the rotated bounding box to a safe rectangle, using ONE scale for
      // X/Y/Z. Orthographic camera units remain isotropic in screen pixels.
      const canvasBounds = el.getBoundingClientRect();
      const titleBounds = hero.querySelector('#hero-title')!.getBoundingClientRect();
      const actionBounds = hero.querySelector('.hero-actions')!.getBoundingClientRect();
      const titleRight = (titleBounds.right - canvasBounds.left) * w / canvasBounds.width;
      const left = mobile ? w * .065 : Math.max(w * .53, titleRight + Math.max(12, w * .012));
      const right = w * (mobile ? .935 : .96);
      const top = mobile ? Math.max(h * .16, (actionBounds.bottom - canvasBounds.top) * h / canvasBounds.height + 22) : h * .30;
      const bottom = h * (mobile ? .71 : .58);
      const pixelsPerUnit = h / (camera.top - camera.bottom);
      const scale = Math.min((right - left) / (logoSize.x * pixelsPerUnit), (bottom - top) / (logoSize.y * pixelsPerUnit)) * .985;
      logo.scale.setScalar(Math.max(.01, scale));
      const centerX = (left + right) / 2, centerY = (top + bottom) / 2;
      logo.position.x = camera.left + centerX / pixelsPerUnit - logoCenter.x * scale;
      logoBaseY = camera.top - centerY / pixelsPerUnit - logoCenter.y * scale;
      logo.position.y = logoBaseY;
      invalidate();
    }
    const safeResize = () => { try { resizeScene(); } catch { stop(); onFailure(); } };
    const resize = new ResizeObserver(safeResize);
    resize.observe(el);
    resize.observe(hero.querySelector('#hero-title')!);
    resize.observe(hero.querySelector('.hero-copy')!);
    const qualityMedia = matchMedia('(max-width: 1024px), (pointer: coarse)');
    qualityMedia.addEventListener('change', safeResize);
    const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) invalidate(); else stop(); });
    visibility.observe(el);
    const motionChange = () => { resetPointer(); elapsed = 0; last = 0; invalidate(); };
    reduced.addEventListener('change', motionChange);
    const tabVisibility = () => { if (document.hidden) stop(); else invalidate(); };
    document.addEventListener('visibilitychange', tabVisibility);
    const overlays = new MutationObserver(() => {
      covered = document.body.style.overflow === 'hidden';
      if (covered) stop(); else invalidate();
    });
    overlays.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    const contextLost = (event: Event) => { event.preventDefault(); stop(); onFailure(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    function draw(now: number) {
      frame = null;
      if (!visible || covered || document.hidden) return;
      if (last && now - last < 1000 / frameRate - .8) { schedule(); return; }
      const delta = last ? Math.min((now - last) / 1000, .08) : 1 / 30;
      last = now;
      if ((reduced.matches || adaptiveStill) && !needsRender) return;
      if (!reduced.matches && !adaptiveStill) elapsed += delta;
      time.value = elapsed;
      const ease = 1 - Math.exp(-delta * 1.8);
      group.rotation.y = reduced.matches ? 0 : group.rotation.y + (target.x - group.rotation.y) * ease;
      group.rotation.x = reduced.matches ? 0 : group.rotation.x + (target.y - group.rotation.x) * ease;
      logo.rotation.y = reduced.matches ? -.065 : logo.rotation.y + (-.065 + target.x * .8 - logo.rotation.y) * ease;
      logo.rotation.x = reduced.matches ? .025 : logo.rotation.x + (.025 + target.y * .8 - logo.rotation.x) * ease;
      logo.position.y = logoBaseY + Math.sin(elapsed * .16) * .025 * logo.scale.y;
      scene.environmentRotation.y = Math.sin(elapsed * .08) * .045;
      const started = performance.now();
      try { renderer.render(scene, camera); }
      catch { stop(); onFailure(); return; }
      const renderTime = performance.now() - started;
      needsRender = false;
      if (!ready) { ready = true; renderer.domElement.style.opacity = '1'; onReady(); }
      // Persistent slow draws reduce the buffer first, then freeze only the
      // decorative scene. Keep the original geometry and full-resolution logo.
      if (!reduced.matches && !adaptiveStill && ready) {
        slowFrames = renderTime > 45 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
        if (slowFrames >= 12) {
          slowFrames = 0;
          if (resolutionScale > .7) { resolutionScale *= .82; frameRate = Math.min(frameRate, 24); safeResize(); }
          else if (renderTime > 80) { adaptiveStill = true; el.dataset.renderMode = 'static'; }
        }
      }
      if (!reduced.matches && !adaptiveStill) schedule();
    }
    schedule();
    return () => {
      disposed = true; stop(); resize.disconnect(); visibility.disconnect(); overlays.disconnect();
      qualityMedia.removeEventListener('change', safeResize);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost);
      hero.removeEventListener('pointermove', pointer); hero.removeEventListener('pointerleave', resetPointer);
      document.removeEventListener('visibilitychange', tabVisibility); reduced.removeEventListener('change', motionChange);
      releaseGraphics();
    };
    } catch {
      disposed = true; releaseGraphics(); onFailure();
    }
  }, [onReady, onFailure]);
  return <div className="liquid-canvas" ref={mount} />;
}
