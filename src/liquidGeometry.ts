import * as THREE from 'three';
import contours from './logoContours.json';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

// Each station describes position, width, depth and roll. Dimensions follow
// the supplied 1238 × 694 art direction, in a 17.84 × 10 world-space stage.
type Station = [number, number, number, number, number, number];
export const sculptureProfiles: Station[][] = [
  [
    [1.13, .20, -2.7, .5, .38, -.8],
    [.99, .18, -2.5, .47, .38, -.45],
    [.88, .25, -2.2, .40, .31, -.25],
    [.75, .38, -2, .31, .27, .2],
    [.59, .42, -1.9, .13, .16, .8],
    [.57, .39, -1.5, .20, .24, 1.7],
    [.68, .34, -1.2, .67, .52, .15],
    [.76, .24, -.8, 1.04, .66, .6],
    [.80, .10, -.45, .98, .72, 1.2],
    [.89, -.07, -.8, 1.15, .65, 1.7],
    [1.10, -.15, -1.4, .85, .45, 2.3],
  ],
  [
    [-.08, .49, -2.7, .10, .10, -.7],
    [.04, .72, -2.4, .20, .15, -.4],
    [.18, .78, -2.2, .30, .20, -.2],
    [.33, .57, -2, .48, .35, .25],
    [.48, .64, -1.4, .58, .48, .8],
    [.62, .77, -.3, .74, .65, 1.1],
    [.73, .82, .15, 1.08, .76, .2],
    [.87, .70, -.3, .86, .59, -.65],
    [1.04, .65, -.8, .53, .48, -1.3],
    [1.15, .71, -1.2, .22, .23, -1.7],
  ],
];

export function sculptureGeometry(stations: Station[], rows: number, sides: number) {
  const curve = new THREE.CatmullRomCurve3(stations.map(([x, y, z]) => new THREE.Vector3((x - .5) * 17.84, (.5 - y) * 10, z)), false, 'centripetal');
  const profile = new THREE.CatmullRomCurve3(stations.map(p => new THREE.Vector3(p[3], p[4], p[5])), false, 'catmullrom', .35);
  const positions = [], indices = [];
  const normal = new THREE.Vector3(), binormal = new THREE.Vector3();
  for (let i = 0; i <= rows; i++) {
    const t = i / rows;
    const center = curve.getPoint(t), tangent = curve.getTangent(t);
    normal.set(-tangent.y, tangent.x, 0).normalize();
    binormal.crossVectors(tangent, normal).normalize();
    const section = profile.getPoint(t);
    const end = Math.min(1, t / .025, (1 - t) / .025);
    const cap = Math.sqrt(Math.max(0, 1 - (1 - end) ** 2));
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2;
      const fold = 1 + .12 * Math.sin(3 * angle + t * 9) + .035 * Math.cos(5 * angle - t * 12);
      const u = Math.cos(angle) * section.x * fold * cap;
      // A curved mid-surface gives each section a concave face and a swollen
      // reverse side. It is a folded solid, not an oval hose or a flat strip.
      const cup = .65 * section.x * (Math.cos(angle) ** 2 - .45) * Math.sin(t * 8 + .5);
      const v = (Math.sin(angle) * section.y * fold + cup) * cap;
      const a = u * Math.cos(section.z) - v * Math.sin(section.z);
      const b = u * Math.sin(section.z) + v * Math.cos(section.z);
      positions.push(center.x + normal.x * a + binormal.x * b, center.y + normal.y * a + binormal.y * b, center.z + normal.z * a + binormal.z * b);
      if (i < rows && j < sides) {
        const p = i * (sides + 1) + j, q = p + sides + 1;
        indices.push(p, p + 1, q, q, p + 1, q + 1);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal');
  for (let i = 0; i <= rows; i++) {
    const a = i * (sides + 1), b = a + sides;
    normal.set(normals.getX(a) + normals.getX(b), normals.getY(a) + normals.getY(b), normals.getZ(a) + normals.getZ(b)).normalize();
    normals.setXYZ(a, normal.x, normal.y, normal.z);
    normals.setXYZ(b, normal.x, normal.y, normal.z);
  }
  geometry.computeBoundingSphere();
  geometry.boundingSphere!.radius += .15; // Include the shader's animated displacement.
  return geometry;
}

export function brandGeometry() {
  const scale = 8 / 1280;
  const path = (points: number[][], hole: boolean) => {
    const shape = hole ? new THREE.Path() : new THREE.Shape();
    const p = points.map(([x, y]) => new THREE.Vector2((x - 785) * scale, (450 - y) * scale));
    // Midpoint quadratic interpolation removes raster stair steps while retaining
    // the exact letter contours and the two original counters.
    const midpoint = (a: THREE.Vector2, b: THREE.Vector2) => a.clone().add(b).multiplyScalar(.5);
    const start = midpoint(p[p.length - 1], p[0]);
    shape.moveTo(start.x, start.y);
    p.forEach((point, i) => {
      const end = midpoint(point, p[(i + 1) % p.length]);
      shape.quadraticCurveTo(point.x, point.y, end.x, end.y);
    });
    shape.closePath();
    return shape;
  };
  const outline = contours.find(c => c.area > 0)!;
  const shape = path(outline.points, false) as THREE.Shape;
  // Other dark islands in the supplied raster are reflections, not letter holes.
  for (const c of contours.filter(c => c.area < 0)) {
    const x = c.points.reduce((sum, p) => sum + p[0], 0) / c.points.length;
    const y = c.points.reduce((sum, p) => sum + p[1], 0) / c.points.length;
    if ((x > 950 && x < 1000 && y > 470 && y < 520) || (x > 1240 && x < 1290 && y > 530 && y < 570)) shape.holes.push(path(c.points, true));
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .32, bevelEnabled: true, bevelThickness: .028, bevelSize: .02, bevelSegments: 4, curveSegments: 3, steps: 1 });
  const positions = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
  for (let i = 0; i < positions.count; i++) {
    uv.setXY(i, (positions.getX(i) / scale + 785) / 1672, 1 - (450 - positions.getY(i) / scale) / 941);
  }
  geometry.computeBoundingSphere();
  // Index only identical position/normal/UV tuples; preserve every triangle,
  // bevel, material group and letter contour at every quality tier.
  const indexed = mergeVertices(geometry, 1e-6);
  geometry.dispose();
  return indexed;
}
