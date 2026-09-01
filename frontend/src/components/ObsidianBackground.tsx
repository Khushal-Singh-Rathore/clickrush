import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const ObsidianBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- THREE.JS SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020204);

    const camera = new THREE.PerspectiveCamera(
      38,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 19);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.45;

    // --- LUXURY PHYSICAL MATERIAL (Hyper-Polished Obsidian Glass & Satin Metals) ---
    const primaryShardMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x060609,
      metalness: 0.94,
      roughness: 0.16, // Crisper specular sheen
      clearcoat: 1.0,  // Deep luxury lacquer / diamond glass shine
      clearcoatRoughness: 0.08,
      reflectivity: 1.0,
      flatShading: true, // Razor-sharp crystal facets
    });

    const accentShardMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0a0b12,
      metalness: 0.98,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      reflectivity: 0.9,
      flatShading: true,
    });

    // --- GEOMETRY: MULTI-FACETED CRYSTAL SHARDS & BLADES ---
    const shardGroup = new THREE.Group();
    const shardCount = 48;
    const geometries: THREE.BufferGeometry[] = [];

    for (let i = 0; i < shardCount; i++) {
      let geom: THREE.BufferGeometry;
      const type = i % 4;

      if (type === 0) {
        // Elongated Triangular Prism / Shard
        const height = 11 + Math.random() * 9;
        const radius = 1.2 + Math.random() * 1.6;
        geom = new THREE.ConeGeometry(radius, height, 3);
      } else if (type === 1) {
        // Pentagonal / Hexagonal Needle Blade
        const height = 9 + Math.random() * 8;
        const radius = 1.0 + Math.random() * 1.4;
        geom = new THREE.ConeGeometry(radius, height, 5);
      } else if (type === 2) {
        // Bipyramidal Octahedron Crystal
        const radius = 1.8 + Math.random() * 2.2;
        geom = new THREE.OctahedronGeometry(radius, 0);
        geom.scale(1, 2.2, 0.9);
      } else {
        // Angular Tetrahedron Shard
        const radius = 2.0 + Math.random() * 2.0;
        geom = new THREE.TetrahedronGeometry(radius, 0);
        geom.scale(0.8, 2.5, 0.8);
      }

      geometries.push(geom);
      const mat = i % 3 === 0 ? accentShardMaterial : primaryShardMaterial;
      const mesh = new THREE.Mesh(geom, mat);

      // Spherical & Ring Cluster Placement
      const angle = (i / shardCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
      const spread = 2.5 + Math.random() * 7.0;

      mesh.position.set(
        Math.cos(angle) * spread,
        (Math.random() - 0.5) * 8.5,
        (Math.random() - 0.5) * 7.0
      );

      mesh.rotation.x = Math.PI * 0.16 + (Math.random() - 0.5) * 0.9;
      mesh.rotation.y = (Math.random() - 0.5) * 1.4;
      mesh.rotation.z = -Math.cos(angle) * 0.5 + (Math.random() - 0.5) * 0.5;

      mesh.userData = {
        baseRotX: mesh.rotation.x,
        baseRotY: mesh.rotation.y,
        baseRotZ: mesh.rotation.z,
        rotSpeedX: (Math.random() - 0.5) * 0.008,
        rotSpeedZ: (Math.random() - 0.5) * 0.008,
        floatSpeed: 0.4 + Math.random() * 0.6,
        floatOffset: Math.random() * Math.PI * 2,
      };

      shardGroup.add(mesh);
    }
    scene.add(shardGroup);

    // --- FLOATING MICRO DUST PARTICLES (Atmospheric Depth) ---
    const particleCount = 90;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 35;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 25;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 20;
      particleSpeeds[i] = 0.2 + Math.random() * 0.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    geometries.push(particleGeometry);

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xc8d6ea,
      size: 0.12,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // --- HIGH-END LIGHTING RIG ---
    // 1. Ambient low fill with deep space tint
    const ambientLight = new THREE.AmbientLight(0x0f121d, 1.4);
    scene.add(ambientLight);

    // 2. High-intensity Ice-Platinum Grazing Rim Lights
    const rimLight1 = new THREE.DirectionalLight(0xffffff, 6.2);
    rimLight1.position.set(-18, 22, 7);
    scene.add(rimLight1);

    const rimLight2 = new THREE.DirectionalLight(0xcad8f5, 4.8);
    rimLight2.position.set(20, -12, 9);
    scene.add(rimLight2);

    // 3. Subtle Underglow
    const underGlow = new THREE.DirectionalLight(0x404860, 2.0);
    underGlow.position.set(0, -15, -5);
    scene.add(underGlow);

    // 4. Interactive Specular Cursor Light (Decay 0 for sharp specular reflections)
    const mouseLight = new THREE.PointLight(0xffffff, 4.2, 60, 0);
    mouseLight.position.set(0, 0, 12);
    scene.add(mouseLight);

    // --- INTERACTIVITY & ANIMATION ---
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };

    const handlePointerMove = (e: PointerEvent | MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.ty = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const handleResize = () => {
      if (!canvas) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', handleResize);

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsed = clock.getElapsedTime();

      // Smooth mouse interpolation with spring-like feel
      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;

      // Dynamic cursor point light
      mouseLight.position.x = mouse.x * 14;
      mouseLight.position.y = mouse.y * 11;

      // Group breathing & parallax tilt
      shardGroup.rotation.y = mouse.x * 0.22;
      shardGroup.rotation.x = -mouse.y * 0.16;

      // Subtle camera sway
      camera.position.x = mouse.x * 0.8;
      camera.position.y = mouse.y * 0.6;
      camera.lookAt(0, 0, 0);

      // Organic shard breathing and floating rotation
      shardGroup.children.forEach((child, index) => {
        const mesh = child as THREE.Mesh;
        const u = mesh.userData;
        const offset = index * 0.18;
        mesh.rotation.x = u.baseRotX + Math.sin(elapsed * u.floatSpeed + offset) * 0.06;
        mesh.rotation.z = u.baseRotZ + Math.cos(elapsed * u.floatSpeed * 0.9 + offset) * 0.05;
        mesh.rotation.y = u.baseRotY + Math.sin(elapsed * 0.3 + offset) * 0.04;
      });

      // Drift floating micro-particles
      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += Math.sin(elapsed + i) * 0.003;
        positions[i * 3] += Math.cos(elapsed * 0.5 + i) * 0.002;
      }
      particleGeometry.attributes.position.needsUpdate = true;
      particles.rotation.y = elapsed * 0.01 + mouse.x * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      geometries.forEach((g) => g.dispose());
      primaryShardMaterial.dispose();
      accentShardMaterial.dispose();
      particleMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />
      {/* High-End Micro Film Grain */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{
          zIndex: 1,
          opacity: 0.038,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Cinematic Radial Depth & Vignette */}
      <div
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{
          zIndex: 2,
          background:
            'radial-gradient(ellipse at center, transparent 30%, rgba(2, 2, 4, 0.85) 100%)',
        }}
      />
    </>
  );
};
