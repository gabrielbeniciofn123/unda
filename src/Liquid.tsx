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
  softbox('#efffff', 5, 2.5, 10, [-4, 3, 4]);
  softbox('#058fff', 3, 1.4, 12, [5, 0, 1]);
  softbox('#3df4c2', 2.4, 8, 2, [0, -5, 2]);
  softbox('#b9efff', 4, 9, .8, [0, 5, -3]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .04, .1, 50);
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
        metalness: 0, roughness: .065, transmission: .96,
        thickness: .75, ior: 1.46, dispersion: .025,
        attenuationColor: new THREE.Color(i === 0 ? '#72d9e9' : '#65d9b1'),
        attenuationDistance: 3.5, envMapIntensity: 1.9,
        clearcoat: 1, clearcoatRoughness: .06,
        side: THREE.FrontSide,
      });
      material.onBeforeCompile = shader => {
        shader.uniforms.uFlowTime = time;
        shader.vertexShader = 'uniform float uFlowTime;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `
          vec3 transformed = position + normal * (
            sin(position.y * 1.2 + uFlowTime * .22) * .022 +
            cos(position.x * 1.4 + uFlowTime * .17) * .016
          );
        `);
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
    const target = { x: 0, y: 0 };
    const pointer = (e: PointerEvent) => {
      target.x = (e.clientX / innerWidth - .5) * .08;
      target.y = (e.clientY / innerHeight - .5) * .06;
    };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (!reduced.matches && !mobile) window.addEventListener('pointermove', pointer, { passive: true });
    let visible = true, frame = 0, last = 0, elapsed = 0, needsRender = true;
    const resize = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); needsRender = true;
    });
    resize.observe(el);
    const visibility = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; });
    visibility.observe(el);
    const invalidate = () => { needsRender = true; };
    reduced.addEventListener('change', invalidate);
    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      const delta = Math.min((now - last) / 1000, .05);
      if (now - last < 1000 / 30) return;
      last = now;
      if (!visible || document.hidden || (reduced.matches && !needsRender)) return;
      if (!reduced.matches) elapsed += delta;
      time.value = elapsed;
      group.rotation.y += (target.x - group.rotation.y) * .035;
      group.rotation.x += (target.y - group.rotation.x) * .035;
      group.position.y = Math.sin(elapsed * .16) * .065;
      resources[1].mesh.rotation.z = Math.sin(elapsed * .12) * .015;
      renderer.render(scene, camera); needsRender = false;
    }
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); visibility.disconnect();
      window.removeEventListener('pointermove', pointer);
      reduced.removeEventListener('change', invalidate);
      resources.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); });
      environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div className="liquid-canvas" ref={mount} />;
}
