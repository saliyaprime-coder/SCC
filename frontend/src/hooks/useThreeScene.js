import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Chromatic aberration (very subtle)
const aberrationShader = {
  uniforms: { tDiffuse: { value: null }, amount: { value: 0.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float amount; varying vec2 vUv;
    void main(){
      vec2 o=amount*vec2(0.008,0.0);
      gl_FragColor=vec4(texture2D(tDiffuse,vUv+o).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-o).b,1.0);
    }`,
};

// Create a single tree (brighter materials)
function createTree(x, z, scale = 1) {
  const group = new THREE.Group();
  
  // Trunk
  const trunkGeo = new THREE.CylinderGeometry(0.2 * scale, 0.3 * scale, 1.5 * scale, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x9c6b4a, emissive: 0x4a2e1a, emissiveIntensity: 0.4 });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = 0.75 * scale;
  group.add(trunk);

  // Foliage (main cone)
  const foliageGeo = new THREE.ConeGeometry(0.8 * scale, 1.8 * scale, 8);
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x5a9e4a, emissive: 0x1e4a1e, emissiveIntensity: 0.5 });
  const foliage = new THREE.Mesh(foliageGeo, foliageMat);
  foliage.position.y = 1.8 * scale;
  group.add(foliage);

  // Extra fluffy spheres
  for (let i = 0; i < 3; i++) {
    const sphereGeo = new THREE.SphereGeometry(0.3 * scale, 5);
    const sphereMat = new THREE.MeshStandardMaterial({ color: 0x6ab04c, emissive: 0x2a5a2a, emissiveIntensity: 0.4 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(
      (Math.random() - 0.5) * 0.5 * scale,
      2.0 * scale + (Math.random() - 0.5) * 0.3 * scale,
      (Math.random() - 0.5) * 0.5 * scale
    );
    group.add(sphere);
  }

  group.position.set(x, 0, z);
  return group;
}

// Ground plane
function createGround() {
  const geo = new THREE.CircleGeometry(200, 64);
  const mat = new THREE.MeshStandardMaterial({ color: 0x3d6b3d, emissive: 0x1a3a1a, emissiveIntensity: 0.2, roughness: 0.8 });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 0;
  return ground;
}

// Particles (fireflies)
function createParticles() {
  const count = 800;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i*3] = (Math.random() - 0.5) * 100;
    pos[i*3+1] = Math.random() * 15 + 2;
    pos[i*3+2] = (Math.random() - 0.5) * 120 + 20;
    const color = new THREE.Color().setHSL(0.25 + Math.random()*0.15, 0.9, 0.6);
    colors[i*3] = color.r;
    colors[i*3+1] = color.g;
    colors[i*3+2] = color.b;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({ size: 0.2, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.8, depthWrite: false });
  return new THREE.Points(geo, mat);
}

// Crystal (central object) – brighter
function createCrystal() {
  const geo = new THREE.OctahedronGeometry(1.5);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xaaffaa,
    emissive: 0x44aa44,
    emissiveIntensity: 1.8,
    roughness: 0.2,
    metalness: 0.3,
    transparent: true,
    opacity: 0.95,
  });
  const crystal = new THREE.Mesh(geo, mat);
  return crystal;
}

export const useThreeScene = (canvasRef) => {
  const groupRef = useRef(new THREE.Group());
  const centralMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;

    // Track our own ScrollTrigger instances for scoped cleanup
    const ownTriggers = [];

    // ----- Scene -----
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f2a0f);
    scene.fog = new THREE.Fog(0x0f2a0f, 25, 90);

    // Camera rig
    const cameraRig = new THREE.Group();
    cameraRig.position.set(0, 5, -5);
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 0, 0);
    cameraRig.add(camera);
    scene.add(cameraRig);
    cameraRef.current = camera;

    const lookTarget = new THREE.Vector3(0, 5, 15);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.2;
    canvasRef.current.appendChild(renderer.domElement);

    // Post-processing
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.4, 0.3, 0.6);
    bloomPass.threshold = 0.1;
    bloomPass.strength = 0.7;
    bloomPass.radius = 0.4;
    const aberrationPass = new ShaderPass(aberrationShader);
    const composer = new EffectComposer(renderer);
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(aberrationPass);

    // ----- Lighting -----
    const ambient = new THREE.AmbientLight(0x406040, 1.2);
    scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xffeedd, 1.5);
    sunLight.position.set(10, 20, 10);
    scene.add(sunLight);

    const fillLight1 = new THREE.PointLight(0xaaccaa, 0.9);
    fillLight1.position.set(-10, 5, 20);
    scene.add(fillLight1);
    const fillLight2 = new THREE.PointLight(0xaaccaa, 0.9);
    fillLight2.position.set(10, 3, 30);
    scene.add(fillLight2);

    const backLight = new THREE.PointLight(0xaaffaa, 1.0);
    backLight.position.set(0, 5, 60);
    scene.add(backLight);

    // ----- Ground -----
    scene.add(createGround());

    // ----- Trees -----
    const treeGroup = new THREE.Group();
    for (let z = -15; z < 100; z += 5) {
      const offset = Math.sin(z * 0.3) * 4;
      for (let side = -1; side <= 1; side += 2) {
        const x = side * (4 + Math.random() * 3) + offset * side;
        if (Math.abs(x) < 3) continue;
        treeGroup.add(createTree(x, z, 0.8 + Math.random() * 0.4));
      }
    }
    for (let i = 0; i < 250; i++) {
      const x = (Math.random() - 0.5) * 60;
      const z = Math.random() * 100 - 10;
      if (Math.abs(x) < 3 && z > 0 && z < 80) continue;
      treeGroup.add(createTree(x, z, 0.7 + Math.random() * 0.5));
    }
    scene.add(treeGroup);

    // ----- Particles (fireflies) -----
    const particles = createParticles();
    scene.add(particles);
    groupRef.current.add(particles);

    // ----- Crystal -----
    const crystal = createCrystal();
    crystal.position.set(0, 5, 80);
    scene.add(crystal);
    centralMeshRef.current = crystal;

    // ----- Glowing path markers -----
    const markerGroup = new THREE.Group();
    for (let z = 10; z < 90; z += 8) {
      const x = Math.sin(z * 0.2) * 2;
      const marker = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 8),
        new THREE.MeshStandardMaterial({ color: 0xffaa88, emissive: 0x884422, emissiveIntensity: 0.8 })
      );
      marker.position.set(x, 0.3, z);
      markerGroup.add(marker);
    }
    scene.add(markerGroup);

    // ----- Mouse interaction -----
    const onMouseMove = (e) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    // ----- Scroll-driven camera movement (cinematic) -----
    // Use a single master timeline mapped to the full page scroll for smooth,
    // conflict-free camera movement instead of 5 independent competing timelines.
    const masterTL = gsap.timeline({
      scrollTrigger: {
        trigger: '.ai-showcase',
        endTrigger: '.cta-block',
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: 1.5,
        invalidateOnRefresh: true,
      },
    });
    ownTriggers.push(masterTL.scrollTrigger);

    // Segment 1: Hero → AI Showcase  (0% – 20%)
    masterTL.to(cameraRig.position, { z: 15, y: 5.5, ease: 'power1.inOut', duration: 20 }, 0)
            .to(lookTarget,          { z: 25, y: 5,   ease: 'power1.inOut', duration: 20 }, 0);

    // Segment 2: AI Showcase → Features  (20% – 40%)
    masterTL.to(cameraRig.position, { z: 35, y: 6,   ease: 'power1.inOut', duration: 20 }, 20)
            .to(lookTarget,          { z: 45, y: 5.5, ease: 'power1.inOut', duration: 20 }, 20);

    // Segment 3: Features → Intelligence  (40% – 60%)
    masterTL.to(cameraRig.position, { z: 55, y: 6.5, ease: 'power1.inOut', duration: 20 }, 40)
            .to(lookTarget,          { z: 65, y: 6,   ease: 'power1.inOut', duration: 20 }, 40)
            .to(bloomPass,           { strength: 0.9, ease: 'none', duration: 20 }, 40);

    // Segment 4: Intelligence → Steps  (60% – 80%)
    masterTL.to(cameraRig.position, { z: 75, y: 7,   ease: 'power1.inOut', duration: 20 }, 60)
            .to(lookTarget,          { z: 85, y: 6.5, ease: 'power1.inOut', duration: 20 }, 60)
            .to(crystal.scale,       { x: 1.3, y: 1.3, z: 1.3, ease: 'power1.inOut', duration: 20 }, 60);

    // Segment 5: Steps → CTA  (80% – 100%)
    masterTL.to(cameraRig.position,  { z: 85, y: 7.5, ease: 'power1.inOut', duration: 20 }, 80)
            .to(lookTarget,           { z: 90, y: 7,   ease: 'power1.inOut', duration: 20 }, 80)
            .to(bloomPass,            { strength: 1.3, ease: 'none', duration: 20 }, 80)
            .to(crystal.material,     { emissiveIntensity: 2.5, ease: 'none', duration: 20 }, 80);

    // Crystal pulse on CTA enter
    const ctaPulse = ScrollTrigger.create({
      trigger: '.cta-block',
      start: 'top 80%',
      onEnter: () => {
        gsap.to(crystal.scale, { x: 1.8, y: 1.8, z: 1.8, duration: 0.8, yoyo: true, repeat: 1, ease: 'power1.inOut' });
      },
    });
    ownTriggers.push(ctaPulse);

    // Ensure ScrollTrigger recalculates positions after layout settles (and after Lenis init)
    const refreshTimer = setTimeout(() => ScrollTrigger.refresh(), 200);

    // ----- Animation loop -----
    let rafId;
    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Mouse parallax (subtle)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      camera.position.x += (mouseRef.current.x * 1.0 - camera.position.x) * 0.03;
      camera.position.y += (mouseRef.current.y * 0.4 - camera.position.y) * 0.03;

      // Tree sway
      const time = Date.now() * 0.001;
      treeGroup.children.forEach((tree, i) => {
        if (i % 3 === 0) tree.rotation.y = Math.sin(time + i) * 0.02;
      });

      // Firefly movement
      particles.rotation.y += 0.0002;

      camera.lookAt(lookTarget);

      // Chromatic aberration based on mouse speed
      const dx = mouseRef.current.targetX - mouseRef.current.x;
      const dy = mouseRef.current.targetY - mouseRef.current.y;
      const spd = Math.sqrt(dx*dx + dy*dy) * 8;
      aberrationPass.uniforms.amount.value += (Math.min(spd, 0.015) - aberrationPass.uniforms.amount.value) * 0.1;

      composer.render();
    };
    animate();

    return () => {
      clearTimeout(refreshTimer);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafId);
      renderer.dispose();
      composer.dispose();
      if (canvasRef.current?.contains(renderer.domElement)) {
        canvasRef.current.removeChild(renderer.domElement);
      }
      // Only kill our own ScrollTrigger instances, not all of them globally
      ownTriggers.forEach(t => t.kill());
      masterTL.kill();
    };
  }, [canvasRef]);

  return { groupRef, centralMeshRef };
};