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
    camera.position.set(0, 0, 12.4);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, .04);
    scene.environment = environment.texture;
    pmrem.dispose(); room.dispose();
    const group = new THREE.Group();
    group.rotation.set(-.15, -.2, -.25); scene.add(group);
    const time = { value: 0 };
    const resources: { geometry: THREE.PlaneGeometry; material: THREE.MeshPhysicalMaterial }[] = [];
    const palette = ['#83b3c0', '#7dada1'];
    for (let i = 0; i < 2; i++) {
      const geometry = new THREE.PlaneGeometry(2, 2, mobile ? 80 : 130, 22);
      const material = new THREE.MeshPhysicalMaterial({
        color: palette[i], metalness: .88, roughness: .075,
        clearcoat: 1, clearcoatRoughness: .13,
        transmission: mobile ? 0 : .35, thickness: .3, ior: 1.35,
        side: THREE.DoubleSide, envMapIntensity: 2.2,
      });
      material.onBeforeCompile = shader => {
        shader.uniforms.uTime = time;
        shader.uniforms.uPhase = { value: i * .75 };
        shader.vertexShader = `uniform float uTime; uniform float uPhase;
          vec3 wavePoint(vec2 p) {
            float u = p.x; float v = p.y;
            float phase = u * 2.4 + uTime * .12 + uPhase;
            float twist = sin(u * 2.2 + uPhase + uTime * .1) * 1.6 + sin(u * 5.5 + uTime * .12) * .35;
            float taper = pow(max(0., 1. - u * u), .65);
            float width = (.16 + .22 * cos(u * 2. + uPhase)) * taper;
            if (uPhase > .5) return vec3(u * 3.4, -.7 + cos(u * 2.) * .65 + v * width * cos(twist), sin(phase) * .45 + v * width * sin(twist));
            return vec3(.7 + sin(phase) * 1.65 + v * width * cos(twist),
              u * 3.3 + v * width * sin(twist), cos(phase * .85) * .7);
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
      ribbon.position.set(i === 0 ? .5 : -.2, i === 0 ? .5 : -1.5, -.4 * i);
      ribbon.rotation.z = i === 0 ? -.18 : -.08;
      group.add(ribbon); resources.push({ geometry, material });
    }
    const key = new THREE.RectAreaLight('#c1f8ff', 10, 7, 3);
    key.position.set(0, 4, 4); key.lookAt(0, 0, 0); scene.add(key);
    const blue = new THREE.PointLight('#006aff', 12, 16);
    blue.position.set(-3, 1, 3); scene.add(blue);
    const green = new THREE.PointLight('#3fffc4', 9, 16);
    green.position.set(3, -1, 3); scene.add(green);
    const target = { x: 0, y: 0 };
    const pointer = (e: PointerEvent) => {
      target.x = (e.clientX / innerWidth - .5) * .1;
      target.y = (e.clientY / innerHeight - .5) * .08;
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
      group.rotation.y += (-.2 + target.x - group.rotation.y) * .035;
      group.rotation.x += (-.15 + target.y - group.rotation.x) * .035;
      group.position.y = Math.sin(elapsed * .18) * .06;
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
