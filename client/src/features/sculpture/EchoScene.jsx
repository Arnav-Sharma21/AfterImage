import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { BufferGeometry, Float32BufferAttribute, DoubleSide } from 'three';
import { TracePrint } from '../../components/TracePrint.jsx';

// A twisted closed band with a rippled cross-section: original parametric geometry.
function ribbonGeometry(segments) {
  const vertices = [], indices = [];
  const widthSegments = 12;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments * Math.PI * 2;
    for (let j = 0; j <= widthSegments; j++) {
      const w = (j / widthSegments - .5) * .72;
      const radius = 1.35 + .27 * Math.cos(3 * t) + w * Math.cos(t * 2);
      vertices.push(radius * Math.cos(t), radius * Math.sin(t) * .82, .38 * Math.sin(3 * t) + w * Math.sin(t * 2));
      if (i < segments && j < widthSegments) { const a = i * (widthSegments + 1) + j, b = a + widthSegments + 1; indices.push(a, b, a + 1, b, b + 1, a + 1); }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

function Ribbon({ phase, reduced, accent }) {
  const ref = useRef(null);
  const invalidate = useThree(state => state.invalidate);
  const pointer = useThree(state => state.pointer);
  const small = useThree(state => state.size.width < 500);
  const geometry = useMemo(() => ribbonGeometry(small ? 96 : 180), [small]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const color = phase === 0 && accent ? accent : ['#ff5c8a', '#bb2865', '#ffd2e4'][phase];
  return <><ambientLight intensity={.4} /><group ref={ref} rotation={[.35, -.4 + phase * .32, -.3]} onPointerMove={() => { if (reduced) return; ref.current.rotation.y = -.4 + phase * .32 + pointer.x * .22; ref.current.rotation.x = .35 + pointer.y * .15; invalidate(); }} onPointerLeave={() => { if (reduced) return; ref.current.rotation.set(.35, -.4 + phase * .32, -.3); invalidate(); }}>
    <mesh geometry={geometry}><meshPhysicalMaterial color="#c3bdcb" metalness={1} roughness={.17} clearcoat={1} side={DoubleSide} /></mesh>
    <mesh geometry={geometry} scale={.72} rotation={[.4, -.2, Math.PI / 2]}><meshPhysicalMaterial color={color} metalness={.95} roughness={.22} side={DoubleSide} /></mesh>
  </group><Environment resolution={small ? 128 : 256} frames={1} key={`${phase}:${color}`}><Lightformer intensity={.8} position={[0, 0, 5]} scale={[8, 8, 1]} /><Lightformer intensity={4} position={[0, 3, 2]} scale={[6, 1, 1]} /><Lightformer color={color} intensity={5} position={[-3, 0, 2]} rotation={[0, Math.PI / 3, 0]} scale={[2, 5, 1]} /><Lightformer color="#ff7fa7" intensity={3} position={[3, 1, -2]} rotation={[0, -Math.PI / 2, 0]} scale={[3, 5, 1]} /></Environment></>;
}

export default function EchoScene({ phase, reduced, onUnavailable, accent }) {
  const cleanup = useRef(null);
  useEffect(() => () => cleanup.current?.(), []);
  return <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 0, 5], fov: 43 }} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }} fallback={<TracePrint seed="echo" />} onCreated={({ gl }) => { const canvas = gl.domElement; const lose = event => { event.preventDefault(); onUnavailable(); }; canvas.addEventListener('webglcontextlost', lose); cleanup.current = () => canvas.removeEventListener('webglcontextlost', lose); }}><Ribbon accent={accent} phase={phase} reduced={reduced} /></Canvas>;
}
