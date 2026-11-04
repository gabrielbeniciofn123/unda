import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { prefersLightHeroEffects } from './heroPerformance';

/** A closed, oval section swept along a smooth curve: real volume, no planes,
 * no tapering ribbon edges. Rounded caps remain outside the hero framing. */
function glassVolume(points: number[][], width: number, depth: number, mobile: boolean) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
  const lengthSegments = mobile ? 96 : 160;
  const radialSegments = mobile ? 24 : 32;
  const frames = curve.computeFrenetFrames(lengthSegments, false);
  const positions: number[] = [], indices: number[] = [];
  for (let i = 0; i <= lengthSegments; i++) {
    const t = i / lengthSegments;
    const center = curve.getPointAt(t);
    const n = frames.normals[i], b = frames.binormals[i];
    const edge = Math.min(1, t / .045, (1 - t) / .045);
    const cap = Math.sqrt(Math.max(0, 1 - (1 - edge) ** 2));
    const swell = .7 + .36 * Math.sin((t + .08) * Math.PI * 1.3) ** 2;
    const depthSwell = .8 + .2 * Math.cos(t * Math.PI * 2 + .5);
    const twist = .4 * Math.sin(t * Math.PI * 2);
    for (let j = 0; j <= radialSegments; j++) {
      const angle = j / radialSegments * Math.PI * 2;
      const x = Math.cos(angle) * width * cap * swell;
      const y = Math.sin(angle) * depth * cap * depthSwell;
      const nx = x * Math.cos(twist) - y * Math.sin(twist);
      const by = x * Math.sin(twist) + y * Math.cos(twist);
      positions.push(center.x + n.x * nx + b.x * by, center.y + n.y * nx + b.y * by, center.z + n.z * nx + b.z * by);
      if (i < lengthSegments && j < radialSegments) {
        const a = i * (radialSegments + 1) + j, c = a + radialSegments + 1;
        indices.push(a, a + 1, c, c, a + 1, c + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Studio softboxes supply actual reflected blue/green light, without image
 * textures, logo textures, external HDR downloads or decorative objects. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#020607');
  const resources: { geometry: THREE.PlaneGeometry; material: THREE.MeshBasicMaterial }[] = [];
  function softbox(color: string, intensity: number, width: number, height: number, position: number[]) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false });
    const panel = new THREE.Mesh(geometry, material);
    panel.position.set(position[0], position[1], position[2]);
    panel.lookAt(0, 0, 0); studio.add(panel); resources.push({ geometry, material });
  }
  softbox('#efffff', 3.8, 2.8, 10, [-4, 3, 4]);
  softbox('#168bff', 3.8, 4, 12, [5, 0, 1]);
  softbox('#22e6b3', 3.1, 8, 3.2, [0, -5, 2]);
  softbox('#d5f5ff', 3.3, 9, 1.4, [0, 5, -3]);
  softbox('#e4fff8', 2.5, 1, 6, [-1, .7, -5]);
  softbox('#426bff', 2.2, 3, 5, [1, 1, 6]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .055, .1, 50);
  pmrem.dispose();
  resources.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); });
  studio.clear();
  return environment;
}

export default function Liquid() {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { el.classList.add('wave-fallback'); return; }
    let lightEffects = prefersLightHeroEffects();
    renderer.setPixelRatio(Math.min(devicePixelRatio, lightEffects ? 1 : 1.5));
    renderer.setClearColor('#020405', 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.appendChild(renderer.domElement);
    RectAreaLightUniformsLib.init();
    const scene = new THREE.Scene();
    // Reflected studio lighting supplies the liquid chrome finish without an
    // extra transmission render pass. The transparent canvas keeps the layers.
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 50);
    camera.position.set(0, 0, 11.5);
    const environment = studioEnvironment(renderer);
    scene.environment = environment.texture;
    const group = new THREE.Group(); scene.add(group);
    const time = { value: 0 };
    const shapes = [
      { points: [[-6, 1.5, -.9], [-3.1, 1.15, -.6], [-1.2, 1.86, -.2], [1.0, 2.26, -.45], [3.4, 1.6, -.7], [4.7, .3, -.8], [5.7, -.25, -.4], [7.2, .6, -.8]], width: .46, depth: .36 },
      { points: [[-6.2, -3.4, -.8], [-3.3, -2.6, -.2], [-1.5, -1.98, .45], [.4, -2.28, .4], [2.5, -1.8, .1], [5.8, -1.2, -.6]], width: .58, depth: .4 },
    ];
    const resources = shapes.map((shape, i) => {
      const geometry = glassVolume(shape.points, shape.width, shape.depth, lightEffects);
      const material = new THREE.MeshPhysicalMaterial({
        color: i === 0 ? '#b2e8ff' : '#b4f5e6',
        metalness: .94, roughness: .105, envMapIntensity: 1.45,
        clearcoat: 1, clearcoatRoughness: .09,
        side: THREE.FrontSide,
      });
      material.onBeforeCompile = shader => {
        shader.uniforms.uFlowTime = time;
        shader.vertexShader = `
          uniform float uFlowTime;
          vec3 liquidFlow(vec3 p) {
            return p + vec3(
              .055 * sin(p.y * .9 + uFlowTime * .19),
              .025 * sin(p.x * 1.1 + uFlowTime * .14),
              .065 * sin(p.y * .7 + p.x * .65 + uFlowTime * .17)
            );
          }
          mat3 liquidJacobian(vec3 p) {
            float dz = .065 * cos(p.y * .7 + p.x * .65 + uFlowTime * .17);
            return mat3(
              vec3(1., .0275 * cos(p.x * 1.1 + uFlowTime * .14), dz * .65),
              vec3(.0495 * cos(p.y * .9 + uFlowTime * .19), 1., dz * .7),
              vec3(0., 0., 1.)
            );
          }
        ` + shader.vertexShader;
        // Transform normals with the flow's inverse-transpose Jacobian, keeping
        // highlights attached to the deforming glass rather than a static tube.
        shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
          #include <beginnormal_vertex>
          mat3 flowJ = liquidJacobian(position);
          objectNormal = normalize(mat3(
            cross(flowJ[1], flowJ[2]), cross(flowJ[2], flowJ[0]), cross(flowJ[0], flowJ[1])
          ) * objectNormal);
        `).replace('#include <begin_vertex>', 'vec3 transformed = liquidFlow(position);');
      };
      const mesh = new THREE.Mesh(geometry, material);
      group.add(mesh);
      return { geometry, material, mesh };
    });
    const key = new THREE.RectAreaLight('#ecffff', 5, 3, 8);
    key.position.set(-3, 4, 5); key.lookAt(0, 0, 0); scene.add(key);
    const rim = new THREE.RectAreaLight('#2acfff', 3, 2, 7);
    rim.position.set(4, 0, 3); rim.lookAt(0, 0, 0); scene.add(rim);
    const low = new THREE.PointLight('#39e7b0', 7, 15);
    low.position.set(0, -4, 3); scene.add(low);
    const stageBlue = new THREE.Color('#3494ff');
    const stageCyan = new THREE.Color('#38dcf1');
    const stageGreen = new THREE.Color('#33d3ad');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const target = { x: 0, y: 0 };
    const hero = el.closest<HTMLElement>('.unda-hero')!;
    const pointer = (e: PointerEvent) => {
      if (reduced.matches || lightEffects || e.pointerType === 'touch') return;
      target.x = (e.clientX / innerWidth - .5) * .06;
      target.y = (e.clientY / innerHeight - .5) * .04;
    };
    const resetPointer = () => { target.x = 0; target.y = 0; };
    hero.addEventListener('pointermove', pointer, { passive: true });
    hero.addEventListener('pointerleave', resetPointer);
    let visible = true, frame: number | null = null, last = 0, elapsed = 0, needsRender = true;
    function schedule() {
      if (frame === null && visible && !document.hidden) frame = requestAnimationFrame(draw);
    }
    function stop() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null; last = 0;
    }
    const invalidate = () => { needsRender = true; schedule(); };
    const resize = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      lightEffects = prefersLightHeroEffects();
      if (lightEffects) resetPointer();
      renderer.setPixelRatio(Math.min(devicePixelRatio, lightEffects ? 1 : 1.5));
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); invalidate();
    });
    resize.observe(el);
    const visibility = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) invalidate(); else stop();
    });
    visibility.observe(el);
    const motionChange = () => { resetPointer(); elapsed = 0; last = 0; invalidate(); };
    reduced.addEventListener('change', motionChange);
    const tabVisibility = () => { if (document.hidden) stop(); else invalidate(); };
    document.addEventListener('visibilitychange', tabVisibility);
    function draw(now: number) {
      frame = null;
      if (!visible || document.hidden) return;
      if (last && now - last < 1000 / (lightEffects ? 24 : 30) - .8) { schedule(); return; }
      const delta = last ? Math.min((now - last) / 1000, .05) : 1 / 30;
      last = now;
      if (reduced.matches && !needsRender) return;
      if (!reduced.matches) elapsed += delta;
      time.value = elapsed;
      const ease = 1 - Math.exp(-delta * 1.8);
      const sway = reduced.matches ? 0 : Math.sin(elapsed * .09) * .009;
      group.rotation.y = reduced.matches ? 0 : group.rotation.y + (target.x + sway - group.rotation.y) * ease;
      group.rotation.x = reduced.matches ? 0 : group.rotation.x + (target.y - group.rotation.x) * ease;
      group.position.y = Math.sin(elapsed * .11) * .04;
      resources[1].mesh.rotation.z = Math.sin(elapsed * .1) * .01;
      scene.environmentRotation.y = Math.sin(elapsed * .075) * .035;
      // Recolor the existing lights; keep the reflected environment precomputed.
      const phase = reduced.matches || lightEffects ? 0 : (elapsed / 27) % 1;
      if (phase < 1 / 3) rim.color.copy(stageBlue).lerp(stageCyan, (1 - Math.cos(phase * 3 * Math.PI)) / 2);
      else if (phase < 2 / 3) rim.color.copy(stageCyan).lerp(stageGreen, (1 - Math.cos((phase * 3 - 1) * Math.PI)) / 2);
      else rim.color.copy(stageGreen).lerp(stageBlue, (1 - Math.cos((phase * 3 - 2) * Math.PI)) / 2);
      renderer.render(scene, camera); needsRender = false;
      if (!reduced.matches) schedule();
    }
    schedule();
    return () => {
      stop(); resize.disconnect(); visibility.disconnect();
      hero.removeEventListener('pointermove', pointer);
      hero.removeEventListener('pointerleave', resetPointer);
      document.removeEventListener('visibilitychange', tabVisibility);
      reduced.removeEventListener('change', motionChange);
      resources.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); });
      environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div className="liquid-canvas" ref={mount} />;
}
