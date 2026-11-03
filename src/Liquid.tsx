import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

/** A closed, oval section swept along a smooth curve: real volume, no planes,
 * no tapering ribbon edges. Rounded caps remain outside the hero framing. */
function glassVolume(points: number[][], width: number, depth: number, mobile: boolean) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
  const lengthSegments = mobile ? 120 : 200;
  const radialSegments = mobile ? 24 : 40;
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
    const twist = .34 * Math.sin(t * Math.PI * 2);
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
  softbox('#efffff', 4.6, 2.1, 10, [-4, 3, 4]);
  softbox('#119cf5', 2.8, 1.7, 12, [5, 0, 1]);
  softbox('#46edc1', 2.2, 8, 2.3, [0, -5, 2]);
  softbox('#b9efff', 4, 9, .8, [0, 5, -3]);
  softbox('#e4fff8', 1.4, .45, 6, [-1, .7, -5]);
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
    try { renderer = new THREE.WebGLRenderer({ alpha: false, antialias: true, powerPreference: 'low-power' }); }
    catch { el.classList.add('wave-fallback'); return; }
    const mobile = matchMedia('(max-width: 700px)').matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.15 : 1.5));
    renderer.transmissionResolutionScale = mobile ? .55 : .8;
    renderer.setClearColor('#020405', 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    el.appendChild(renderer.domElement);
    RectAreaLightUniformsLib.init();
    const scene = new THREE.Scene();
    // Transmission must refract an opaque black stage. A zero-alpha backdrop
    // unpremultiplies the glass highlights into a milky surface in the browser.
    scene.background = new THREE.Color('#020405');
    const camera = new THREE.PerspectiveCamera(36, 1, .1, 50);
    camera.position.set(0, 0, 10.5);
    const environment = studioEnvironment(renderer);
    scene.environment = environment.texture;
    const group = new THREE.Group(); scene.add(group);
    const time = { value: 0 };
    const shapes = [
      { points: [[3.0, 5.8, -.4], [1.7, 3.7, -.2], [-.65, 2.0, .2], [-1.0, .5, .65], [1.2, -.2, .2], [2.05, -1.55, -.25], [3.0, -4.9, -.6]], width: .53, depth: .27 },
      { points: [[-5.3, -1.1, -.7], [-2.6, -1.85, -.1], [-.15, -2.2, .6], [1.9, -1.6, .2], [4.7, -1.1, -.4]], width: .62, depth: .25 },
    ];
    const resources = shapes.map((shape, i) => {
      const geometry = glassVolume(shape.points, shape.width, shape.depth, mobile);
      const material = new THREE.MeshPhysicalMaterial({
        color: i === 0 ? '#e0f6ff' : '#dcfff2',
        metalness: 0, roughness: .06, transmission: .97,
        thickness: .68, ior: 1.45, dispersion: mobile ? 0 : .018,
        attenuationColor: new THREE.Color(i === 0 ? '#72d9e9' : '#65d9b1'),
        attenuationDistance: 4.2, envMapIntensity: 1.8,
        clearcoat: 1, clearcoatRoughness: .07,
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
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const target = { x: 0, y: 0 };
    const pointer = (e: PointerEvent) => {
      if (reduced.matches || e.pointerType === 'touch') return;
      target.x = (e.clientX / innerWidth - .5) * .08;
      target.y = (e.clientY / innerHeight - .5) * .06;
    };
    const resetPointer = () => { target.x = 0; target.y = 0; };
    if (!mobile) {
      window.addEventListener('pointermove', pointer, { passive: true });
      document.documentElement.addEventListener('pointerleave', resetPointer);
    }
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
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); invalidate();
    });
    resize.observe(el);
    const visibility = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) invalidate(); else stop();
    });
    visibility.observe(el);
    reduced.addEventListener('change', invalidate);
    const tabVisibility = () => { if (document.hidden) stop(); else invalidate(); };
    document.addEventListener('visibilitychange', tabVisibility);
    function draw(now: number) {
      frame = null;
      if (!visible || document.hidden) return;
      if (last && now - last < 1000 / 30 - .8) { schedule(); return; }
      const delta = last ? Math.min((now - last) / 1000, .05) : 1 / 30;
      last = now;
      if (reduced.matches && !needsRender) return;
      if (!reduced.matches) elapsed += delta;
      time.value = elapsed;
      const ease = 1 - Math.exp(-delta * 1.8);
      const sway = reduced.matches ? 0 : Math.sin(elapsed * .11) * .012;
      group.rotation.y += (target.x + sway - group.rotation.y) * ease;
      group.rotation.x += (target.y - group.rotation.x) * ease;
      group.position.y = Math.sin(elapsed * .14) * .055;
      resources[1].mesh.rotation.z = Math.sin(elapsed * .12) * .015;
      renderer.render(scene, camera); needsRender = false;
      if (!reduced.matches) schedule();
    }
    schedule();
    return () => {
      stop(); resize.disconnect(); visibility.disconnect();
      window.removeEventListener('pointermove', pointer);
      document.documentElement.removeEventListener('pointerleave', resetPointer);
      document.removeEventListener('visibilitychange', tabVisibility);
      reduced.removeEventListener('change', invalidate);
      resources.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); });
      environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div className="liquid-canvas" ref={mount} />;
}
