"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Play, Pause, RefreshCw, Box, Eye, Sparkles, Orbit, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Interactive3DSceneProps {
  interactive?: boolean;
  showControls?: boolean;
  className?: string;
  preset?: "cyberpunk" | "neon" | "synthwave" | "minimal";
}

export function Interactive3DScene({
  interactive = true,
  showControls = true,
  className = "",
  preset = "cyberpunk",
}: Interactive3DSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [wireframe, setWireframe] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [themeMode, setThemeMode] = useState<"cyberpunk" | "neon" | "synthwave">(
    preset === "minimal" ? "neon" : preset
  );
  const [entityCount, setEntityCount] = useState(6);

  // References for three.js manipulation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const materialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const entitiesGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 400;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 7, 13);
    camera.lookAt(0, 0, 0);

    // 2. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    dirLight.position.set(10, 15, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x10b981, 2.5, 30);
    pointLight.position.set(-5, 4, -3);
    scene.add(pointLight);

    // 4. Ground Grid & Cyber Platform
    const gridHelper = new THREE.GridHelper(24, 24, 0x10b981, 0x1e293b);
    gridHelper.position.y = -0.01;
    scene.add(gridHelper);

    // Glowing main platform
    const platformGeo = new THREE.CylinderGeometry(5.5, 6, 0.4, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x090d16,
      roughness: 0.2,
      metalness: 0.8,
    });
    materialsRef.current.push(platformMat);
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.y = -0.2;
    platform.receiveShadow = true;
    scene.add(platform);

    // Glowing ring edge
    const ringGeo = new THREE.TorusGeometry(5.6, 0.08, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.01;
    scene.add(ring);

    // 5. Hero Character / Hover Vehicle
    const heroGroup = new THREE.Group();
    scene.add(heroGroup);

    // Core chassis
    const bodyGeo = new THREE.BoxGeometry(1.6, 0.4, 2.4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.1,
      metalness: 0.9,
    });
    materialsRef.current.push(bodyMat);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    heroGroup.add(body);

    // Cockpit / energy crystal
    const crystalGeo = new THREE.OctahedronGeometry(0.5, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.5,
    });
    materialsRef.current.push(crystalMat);
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.set(0, 0.6, 0.2);
    heroGroup.add(crystal);

    // Wings / Thruster fins
    const wingGeo = new THREE.BoxGeometry(3.2, 0.08, 1);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.3,
      metalness: 0.7,
    });
    materialsRef.current.push(wingMat);
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(0, 0.1, -0.4);
    heroGroup.add(wing);

    // Dual thrusters glow
    const thrusterGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.6, 16);
    const thrusterMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    leftThruster.rotation.x = Math.PI / 2;
    leftThruster.position.set(-0.7, 0.05, -1.3);
    heroGroup.add(leftThruster);

    const rightThruster = leftThruster.clone();
    rightThruster.position.x = 0.7;
    heroGroup.add(rightThruster);

    heroGroup.position.set(0, 1.4, 0);

    // 6. Floating Game Entities Group
    const entitiesGroup = new THREE.Group();
    entitiesGroupRef.current = entitiesGroup;
    scene.add(entitiesGroup);

    const colors = [0x10b981, 0x38bdf8, 0xa855f7, 0xf59e0b];
    const items: THREE.Mesh[] = [];

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 3.6;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      let geo: THREE.BufferGeometry;
      if (i % 3 === 0) {
        geo = new THREE.IcosahedronGeometry(0.4, 0);
      } else if (i % 3 === 1) {
        geo = new THREE.BoxGeometry(0.6, 0.6, 0.6);
      } else {
        geo = new THREE.ConeGeometry(0.35, 0.7, 6);
      }

      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        roughness: 0.3,
        metalness: 0.6,
      });
      materialsRef.current.push(mat);

      const item = new THREE.Mesh(geo, mat);
      item.position.set(x, 1 + Math.sin(i) * 0.4, z);
      item.castShadow = true;
      entitiesGroup.add(item);
      items.push(item);
    }

    // 7. Ambient Particle Field
    const particleCount = 70;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 16;
      particlePositions[i + 1] = Math.random() * 8;
      particlePositions[i + 2] = (Math.random() - 0.5) * 16;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 8. Mouse Orbit & Interaction Controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let spherical = { radius: 14, theta: 0.4, phi: 1.1 };

    const updateCameraPosition = () => {
      spherical.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, spherical.phi));
      camera.position.x = spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = spherical.radius * Math.cos(spherical.phi);
      camera.position.z = spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(0, 0.8, 0);
    };
    updateCameraPosition();

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!interactive || !isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      spherical.theta -= deltaX * 0.008;
      spherical.phi -= deltaY * 0.008;
      updateCameraPosition();

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      if (!interactive) return;
      e.preventDefault();
      spherical.radius = Math.max(6, Math.min(26, spherical.radius + e.deltaY * 0.015));
      updateCameraPosition();
    };

    const domElem = renderer.domElement;
    domElem.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    domElem.addEventListener("wheel", onWheel, { passive: false });

    // Touch controls for mobile
    let touchStart = { x: 0, y: 0 };
    const onTouchStart = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!interactive || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - touchStart.x;
      const deltaY = e.touches[0].clientY - touchStart.y;
      spherical.theta -= deltaX * 0.01;
      spherical.phi -= deltaY * 0.01;
      updateCameraPosition();
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    domElem.addEventListener("touchstart", onTouchStart);
    domElem.addEventListener("touchmove", onTouchMove);

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(newWidth, newHeight);
        }
      }
    });
    resizeObserver.observe(container);

    // 10. Animation Loop
    const startTime = performance.now();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      const elapsedTime = (performance.now() - startTime) / 1000;

      // Vehicle hover motion
      heroGroup.position.y = 1.4 + Math.sin(elapsedTime * 2.5) * 0.15;
      heroGroup.rotation.z = Math.sin(elapsedTime * 1.5) * 0.04;
      crystal.rotation.y = elapsedTime * 2;

      // Rotate entities
      entitiesGroup.rotation.y = elapsedTime * 0.3;
      items.forEach((item, idx) => {
        item.rotation.x = elapsedTime * 1.2 + idx;
        item.rotation.y = elapsedTime * 1.5;
        item.position.y = 1 + Math.sin(elapsedTime * 2 + idx) * 0.3;
      });

      // Subtle particle float
      particles.rotation.y = elapsedTime * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      domElem.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      domElem.removeEventListener("wheel", onWheel);
      domElem.removeEventListener("touchstart", onTouchStart);
      domElem.removeEventListener("touchmove", onTouchMove);
      if (container.contains(domElem)) {
        container.removeChild(domElem);
      }
      renderer.dispose();
    };
  }, [interactive]);

  // Handle Wireframe toggling
  useEffect(() => {
    materialsRef.current.forEach((mat) => {
      mat.wireframe = wireframe;
    });
  }, [wireframe]);

  // Handle Theme switching
  useEffect(() => {
    if (!sceneRef.current) return;
    if (themeMode === "cyberpunk") {
      materialsRef.current.forEach((m, idx) => {
        if (idx % 2 === 0) m.color.setHex(0x10b981);
        else m.color.setHex(0x0284c7);
      });
    } else if (themeMode === "synthwave") {
      materialsRef.current.forEach((m, idx) => {
        if (idx % 2 === 0) m.color.setHex(0xd946ef);
        else m.color.setHex(0x8b5cf6);
      });
    } else {
      materialsRef.current.forEach((m, idx) => {
        if (idx % 2 === 0) m.color.setHex(0x06b6d4);
        else m.color.setHex(0x3b82f6);
      });
    }
  }, [themeMode]);

  const spawnEntity = () => {
    if (!entitiesGroupRef.current || !sceneRef.current) return;
    const geometry = new THREE.DodecahedronGeometry(0.5);
    const material = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      wireframe,
      roughness: 0.2,
      metalness: 0.8,
    });
    materialsRef.current.push(material);

    const mesh = new THREE.Mesh(geometry, material);
    const angle = Math.random() * Math.PI * 2;
    const dist = 2 + Math.random() * 2.5;
    mesh.position.set(Math.cos(angle) * dist, 1.5, Math.sin(angle) * dist);
    mesh.castShadow = true;
    entitiesGroupRef.current.add(mesh);
    setEntityCount((prev) => prev + 1);
  };

  return (
    <div className={`relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden bg-[#070b13] border border-border/40 ${className}`}>
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Floating HUD Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-slate-800 text-[11px] text-slate-300">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-emerald-400 font-semibold">Three.js WebGL</span>
        <span className="text-slate-500">•</span>
        <span>60 FPS</span>
      </div>

      {/* Interactive Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 p-1.5 px-2 bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 rounded-xl shadow-2xl">
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant={wireframe ? "default" : "outline"}
              onClick={() => setWireframe(!wireframe)}
              className={`h-7 px-2.5 text-[11px] font-medium transition-all ${
                wireframe ? "bg-emerald-500 text-black font-semibold" : "border-slate-800 text-slate-300 hover:bg-slate-900"
              }`}
            >
              <Layers className="w-3 h-3 mr-1" />
              Wireframe
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={spawnEntity}
              className="h-7 px-2.5 text-[11px] border-slate-800 text-slate-300 hover:bg-slate-900"
            >
              <Box className="w-3 h-3 mr-1 text-emerald-400" />
              + Spawn Voxel
            </Button>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex items-center bg-slate-900/90 rounded-lg p-0.5 border border-slate-800 text-[10px]">
              <button
                onClick={() => setThemeMode("cyberpunk")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  themeMode === "cyberpunk" ? "bg-emerald-500/20 text-emerald-300 font-medium" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Emerald
              </button>
              <button
                onClick={() => setThemeMode("neon")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  themeMode === "neon" ? "bg-cyan-500/20 text-cyan-300 font-medium" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Cyan
              </button>
              <button
                onClick={() => setThemeMode("synthwave")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  themeMode === "synthwave" ? "bg-purple-500/20 text-purple-300 font-medium" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Purple
              </button>
            </div>

            <div className="hidden sm:flex items-center text-[10px] text-muted-foreground font-mono pl-1">
              <Orbit className="w-3 h-3 mr-1 text-slate-400" />
              Drag to Orbit
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
