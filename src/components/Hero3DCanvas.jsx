import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Html } from '@react-three/drei';
import * as THREE from 'three';

// Procedural Metallic Futuristic Java Cup / OOP Core Object
function JavaCoreObject({ mousePosition }) {
  const groupRef = useRef();
  const cupRef = useRef();
  const ringRef1 = useRef();
  const ringRef2 = useRef();
  const steamParticlesRef = useRef();

  // Steam particle positions
  const { particlePositions, particleCount } = useMemo(() => {
    const count = 45;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 1] = 0.8 + Math.random() * 2.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
    }
    return { particlePositions: pos, particleCount: count };
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Gentle floating and rotation
    if (groupRef.current) {
      groupRef.current.rotation.y = time * 0.25;

      // Subtle reaction to mouse
      const targetX = (mousePosition.current.x * 0.35);
      const targetY = (-mousePosition.current.y * 0.25);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetY, 0.05);
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -targetX * 0.5, 0.05);
    }

    // Opposite spinning orbital rings
    if (ringRef1.current) ringRef1.current.rotation.z = -time * 0.4;
    if (ringRef2.current) {
      ringRef2.current.rotation.x = time * 0.3;
      ringRef2.current.rotation.y = time * 0.35;
    }

    // Animate steam particles upward
    if (steamParticlesRef.current) {
      const positions = steamParticlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += delta * 0.6;
        if (positions[i * 3 + 1] > 3.2) {
          positions[i * 3 + 1] = 0.8;
          positions[i * 3] = (Math.random() - 0.5) * 0.7;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 0.7;
        }
      }
      steamParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.2, 0]}>
      {/* Central Metallic Coffee Cup Body */}
      <group ref={cupRef}>
        {/* Tapered Main Cylinder */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.05, 0.85, 1.7, 48]} />
          <meshStandardMaterial
            color="#0f1422"
            metalness={0.92}
            roughness={0.18}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Cup Inner Liquid (Cyan Electric Java Energy) */}
        <mesh position={[0, 0.75, 0]}>
          <cylinderGeometry args={[0.98, 0.98, 0.1, 32]} />
          <meshStandardMaterial
            color="#0284c7"
            emissive="#0284c7"
            emissiveIntensity={1.2}
            roughness={0.1}
          />
        </mesh>

        {/* Cup Rim Chrome Band */}
        <mesh position={[0, 0.85, 0]}>
          <torusGeometry args={[1.04, 0.04, 16, 64]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.95} roughness={0.1} />
        </mesh>

        {/* Metallic Handle */}
        <mesh position={[1.1, -0.05, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <torusGeometry args={[0.55, 0.1, 16, 32, Math.PI * 0.95]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Base Plate / Saucer */}
        <mesh position={[0, -0.9, 0]}>
          <cylinderGeometry args={[1.5, 1.4, 0.12, 48]} />
          <meshStandardMaterial color="#111827" metalness={0.88} roughness={0.25} />
        </mesh>
      </group>

      {/* Floating Holographic Java Code Rings */}
      <mesh ref={ringRef1} position={[0, 0.1, 0]} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[2.2, 0.02, 16, 64]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} />
      </mesh>

      <mesh ref={ringRef2} position={[0, 0.1, 0]} rotation={[0, Math.PI / 4, Math.PI / 6]}>
        <torusGeometry args={[2.5, 0.015, 16, 64]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.4} />
      </mesh>

      {/* Electric Steam Particles */}
      <points ref={steamParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.07}
          color="#38bdf8"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// Floating 3D OOP Syntax & Geometric Badges
function FloatingSyntaxTokens() {
  const tokens = [
    { text: "public class JVM {}", pos: [-3.2, 1.8, -1.2], color: "#38bdf8", speed: 1.2 },
    { text: "extends Object", pos: [3.3, 1.4, -0.8], color: "#818cf8", speed: 1.4 },
    { text: "implements Interface", pos: [-3.0, -1.2, 0.5], color: "#a855f7", speed: 1.1 },
    { text: "new Polymorphism()", pos: [3.1, -1.5, -0.5], color: "#38bdf8", speed: 1.3 },
    { text: "{ ... }", pos: [0, 2.7, -1.8], color: "#94a3b8", speed: 1.0 },
    { text: "super.execute()", pos: [-2.4, 0.3, 1.2], color: "#c084fc", speed: 1.5 },
  ];

  return (
    <>
      {tokens.map((token, i) => (
        <Float key={i} speed={token.speed} rotationIntensity={0.5} floatIntensity={0.8}>
          <group position={token.pos}>
            <Html center transform distanceFactor={7}>
              <div
                style={{
                  color: token.color,
                  borderColor: `${token.color}33`,
                  backgroundColor: 'rgba(7, 8, 12, 0.75)'
                }}
                className="px-3 py-1 rounded-md text-xs font-mono tracking-wider backdrop-blur-md border shadow-lg whitespace-nowrap select-none pointer-events-none transition-all"
              >
                {token.text}
              </div>
            </Html>
          </group>
        </Float>
      ))}
    </>
  );
}

export default function Hero3DCanvas() {
  const mousePosition = useRef({ x: 0, y: 0 });

  const handlePointerMove = (e) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth) * 2 - 1;
    const y = -(clientY / window.innerHeight) * 2 + 1;
    mousePosition.current = { x, y };
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      className="absolute inset-0 pointer-events-auto w-full h-full"
      style={{ touchAction: 'none' }}
    >
      <Canvas
        camera={{ position: [0, 0, 6.2], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        {/* Cinematic Studio Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[6, 8, 5]} intensity={1.8} color="#f8fafc" />
        <pointLight position={[-6, -3, -4]} intensity={1.2} color="#8b5cf6" />
        <pointLight position={[4, 2, 3]} intensity={2.0} color="#38bdf8" />
        <spotLight
          position={[0, 6, 2]}
          angle={0.4}
          penumbra={0.9}
          intensity={2.5}
          color="#38bdf8"
        />

        {/* 3D Scene Elements */}
        <JavaCoreObject mousePosition={mousePosition} />
        <FloatingSyntaxTokens />
      </Canvas>
    </div>
  );
}
