import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// Open flowing sheets extend the blue/green lines of the supplied identity.
export default function Liquid() {
  const mount = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = mount.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
    catch { el.classList.add('wave-fallback'); return; }
    const mobile = matchMedia('(max-width: 700px)').matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.6));
    renderer.setClearColor(0, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 50);
    camera.position.set(0, 0, 9.4);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    pmrem.dispose(); room.dispose();
    const group = new THREE.Group();
    group.rotation.set(-.25, -.4, -.48); scene.add(group);
    const time = { value: 0 };
    const resources: { geometry: THREE.PlaneGeometry; material: THREE.MeshPhysicalMaterial }[] = [];
    const palette = ['#057fcb', '#14b987', '#63dfd0', '#0b466c'];
    for (let i = 0; i < 4; i++) {
      const geometry = new THREE.PlaneGeometry(2, 2, mobile ? 80 : 130, 22);
      const material = new THREE.MeshPhysicalMaterial({
        color: palette[i], metalness: .42, roughness: .2,
        clearcoat: 1, clearcoatRoughness: .13,
        transmission: mobile ? 0 : .3, thickness: .55, ior: 1.4,
        side: THREE.DoubleSide, envMapIntensity: 1.7,
      });
      material.onBeforeCompile = shader => {
        shader.uniforms.uTime = time;
        shader.uniforms.uPhase = { value: i * .75 };
        shader.vertexShader = `uniform float uTime; uniform float uPhase;
          vec3 wavePoint(vec2 p) {
            float u = p.x; float v = p.y;
            float phase = u * 2.15 + uTime * .38 + uPhase;
            float twist = sin(u * 1.7 + uPhase + uTime * .16) * 1.35;
            float width = .55 + .18 * cos(u * 2.5 + uPhase);
            return vec3(u * 4.8, sin(phase) * .7 + v * width * cos(twist),
              cos(phase * .85) * .65 + v * width * sin(twist));
          }
          ${shader.vertexShader}`;
        shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `
          vec3 tangentU = wavePoint(position.xy + vec2(.002, 0.)) - wavePoint(position.xy - vec2(.002, 0.));
          vec3 tangentV = wavePoint(position.xy + vec2(0., .002)) - wavePoint(position.xy - vec2(0., .002));
          vec3 objectNormal = normalize(cross(tangentU, tangentV));
          #ifdef USE_TANGENT
            vec3 objectTangent = normalize(tangentU);
          #endif
        `).replace('#include <begin_vertex>', 'vec3 transformed = wavePoint(position.xy);');
      };
      const ribbon = new THREE.Mesh(geometry, material);
      ribbon.frustumCulled = false;
      ribbon.position.set(0, (i - 1.5) * .64, (i - 1.5) * -.2);
      group.add(ribbon); resources.push({ geometry, material });
    }
    const key = new THREE.RectAreaLight('#c1f8ff', 10, 7, 3);
    key.position.set(0, 4, 4); key.lookAt(0, 0, 0); scene.add(key);
    const blue = new THREE.PointLight('#006aff', 38, 16);
    blue.position.set(-3, 1, 3); scene.add(blue);
    const green = new THREE.PointLight('#3fffc4', 32, 16);
    green.position.set(3, -1, 3); scene.add(green);
    const target = { x: 0, y: 0 };
    const pointer = (e: PointerEvent) => {
      target.x = (e.clientX / innerWidth - .5) * .22;
      target.y = (e.clientY / innerHeight - .5) * .16;
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
    function draw(now: number) {
      frame = requestAnimationFrame(draw);
      const delta = Math.min((now - last) / 1000, .05);
      if (now - last < 1000 / 30) return;
      last = now;
      if (!visible || document.hidden || (reduced.matches && !needsRender)) return;
      if (!reduced.matches) elapsed += delta;
      time.value = elapsed;
      group.rotation.y += (-.4 + target.x - group.rotation.y) * .035;
      group.rotation.x += (-.25 + target.y - group.rotation.x) * .035;
      group.position.y = Math.sin(elapsed * .23) * .12;
      renderer.render(scene, camera); needsRender = false;
    }
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame); resize.disconnect(); visibility.disconnect();
      window.removeEventListener('pointermove', pointer);
      resources.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose(); });
      environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);
  return <div className="liquid-canvas" ref={mount} />;
}
