import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export default function Liquid(){const mount=useRef<HTMLDivElement>(null);useEffect(()=>{
 const el=mount.current!;let renderer:THREE.WebGLRenderer;try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:devicePixelRatio<2,powerPreference:'low-power'})}catch{return}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setClearColor(0,0);el.appendChild(renderer.domElement);const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.z=8.6;
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.04);scene.environment=environment.texture;room.dispose();pmrem.dispose();
 const geometry=new THREE.TorusKnotGeometry(1.4,.43,200,28,2,3);const original=geometry.attributes.position.array.slice();
 const material=new THREE.MeshPhysicalMaterial({color:'#a8a8ad',metalness:1,roughness:.15,clearcoat:1,envMapIntensity:2});const mesh=new THREE.Mesh(geometry,material);mesh.rotation.set(.4,-.3,.2);scene.add(mesh);
 const red=new THREE.PointLight('#ff160a',85,15);red.position.set(-3,-2,3);scene.add(red);const blue=new THREE.PointLight('#3c65ff',70,15);blue.position.set(3,2,2);scene.add(blue);const white=new THREE.RectAreaLight('#ffffff',9,5,3);white.position.set(0,3,4);white.lookAt(0,0,0);scene.add(white);
 const mouse={x:0,y:0};const pointer=(e:PointerEvent)=>{mouse.x=(e.clientX/innerWidth-.5)*.6;mouse.y=(e.clientY/innerHeight-.5)*.5};window.addEventListener('pointermove',pointer,{passive:true});
 const resize=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()});resize.observe(el);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let visible=true,frame=0;const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting});observer.observe(el);const start=performance.now();let last=0;
 function draw(now:number){frame=requestAnimationFrame(draw);if(!visible||document.hidden||now-last<32)return;last=now;const t=(now-start)*.0003;if(!reduced){mesh.rotation.y+=(mouse.x-mesh.rotation.y)*.016;mesh.rotation.x+=(.35+mouse.y-mesh.rotation.x)*.018;mesh.rotation.z=.2+Math.sin(t)*.18;mesh.position.y=Math.sin(t*1.5)*.1;const position=geometry.attributes.position;for(let i=0;i<position.count;i++){const x=original[i*3],y=original[i*3+1],z=original[i*3+2];const d=1+Math.sin(y*2.2+t*2+z)*.035;position.setXYZ(i,x*d,y*d,z*d)}position.needsUpdate=true;geometry.computeVertexNormals()}renderer.render(scene,camera)}frame=requestAnimationFrame(draw);
 return()=>{cancelAnimationFrame(frame);window.removeEventListener('pointermove',pointer);resize.disconnect();observer.disconnect();geometry.dispose();material.dispose();environment.dispose();renderer.dispose();renderer.domElement.remove()}
 },[]);return <div className="liquid-canvas" ref={mount}/>}
