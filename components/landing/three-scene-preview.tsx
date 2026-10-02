"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export type ScenePreset = "cyberpunk" | "voxel" | "space"
export type CameraView = "chase" | "cockpit" | "topdown"

export function ThreeScenePreview({
  preset = "cyberpunk",
  cameraView = "chase",
  wireframe = false,
  boost = false,
  onResetCamera,
}: {
  preset: ScenePreset
  cameraView: CameraView
  wireframe: boolean
  boost: boolean
  onResetCamera?: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const previousMousePositionRef = useRef({ x: 0, y: 0 })
  const rotationOffsetRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.035)

    const width = container.clientWidth || 600
    const height = container.clientHeight || 450

    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
    scene.add(ambientLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
    dirLight.position.set(10, 20, 10)
    scene.add(dirLight)

    // Disposables tracking
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []

    function trackGeo<T extends THREE.BufferGeometry>(geo: T): T {
      geometries.push(geo)
      return geo
    }
    function trackMat<T extends THREE.Material>(mat: T): T {
      materials.push(mat)
      return mat
    }

    // Dynamic scene elements
    const sceneGroup = new THREE.Group()
    scene.add(sceneGroup)

    let updateFrame = (time: number, speedMultiplier: number) => {}

    if (preset === "cyberpunk") {
      // Background / Grid
      const gridHelper = new THREE.GridHelper(80, 50, 0x06b6d4, 0x1e293b)
      gridHelper.position.y = -1
      sceneGroup.add(gridHelper)

      // Hovercraft Vehicle Group
      const craftGroup = new THREE.Group()
      craftGroup.position.set(0, 0, 0)
      sceneGroup.add(craftGroup)

      // Main fuselage
      const bodyGeo = trackGeo(new THREE.ConeGeometry(0.7, 2.2, 5))
      const bodyMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          roughness: 0.2,
          metalness: 0.8,
          wireframe,
        })
      )
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
      bodyMesh.rotation.x = Math.PI / 2
      craftGroup.add(bodyMesh)

      // Neon wings
      const wingGeo = trackGeo(new THREE.BoxGeometry(2.4, 0.08, 0.8))
      const wingMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.6,
          roughness: 0.3,
          wireframe,
        })
      )
      const wings = new THREE.Mesh(wingGeo, wingMat)
      wings.position.set(0, 0, 0.2)
      craftGroup.add(wings)

      // Cockpit canopy
      const cockpitGeo = trackGeo(new THREE.SphereGeometry(0.35, 16, 12))
      cockpitGeo.scale(1, 0.6, 1.8)
      const cockpitMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xec4899,
          emissive: 0xbe185d,
          emissiveIntensity: 0.8,
          roughness: 0.1,
          wireframe,
        })
      )
      const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat)
      cockpit.position.set(0, 0.25, 0.1)
      craftGroup.add(cockpit)

      // Thruster glow point light
      const thrusterLight = new THREE.PointLight(0x06b6d4, 3, 8)
      thrusterLight.position.set(0, 0, 1.2)
      craftGroup.add(thrusterLight)

      // Procedural buildings passing by
      const buildings: THREE.Mesh[] = []
      const bldgGeo = trackGeo(new THREE.BoxGeometry(3, 14, 3))
      for (let i = 0; i < 18; i++) {
        const bldgMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x111827,
            roughness: 0.4,
            wireframe,
          })
        )
        const bldg = new THREE.Mesh(bldgGeo, bldgMat)
        const side = i % 2 === 0 ? -1 : 1
        bldg.position.set(side * (7 + Math.random() * 8), 5, -50 + i * 8)
        sceneGroup.add(bldg)
        buildings.push(bldg)
      }

      // Speed pads on the ground
      const pads: THREE.Mesh[] = []
      const padGeo = trackGeo(new THREE.PlaneGeometry(1.4, 3))
      const padMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xec4899,
          emissive: 0xec4899,
          emissiveIntensity: 1.2,
          side: THREE.DoubleSide,
        })
      )
      for (let i = 0; i < 5; i++) {
        const pad = new THREE.Mesh(padGeo, padMat)
        pad.rotation.x = -Math.PI / 2
        pad.position.set(0, -0.98, -40 + i * 20)
        sceneGroup.add(pad)
        pads.push(pad)
      }

      updateFrame = (time: number, speedMultiplier: number) => {
        // Floating hover physics
        craftGroup.position.y = Math.sin(time * 3) * 0.12 + 0.1
        craftGroup.rotation.z = Math.sin(time * 2) * 0.05
        craftGroup.rotation.x = Math.sin(time * 1.5) * 0.03

        // Move grid
        const scrollSpeed = 0.4 * speedMultiplier
        gridHelper.position.z = (gridHelper.position.z + scrollSpeed) % 2

        // Move buildings
        for (const bldg of buildings) {
          bldg.position.z += scrollSpeed * 1.4
          if (bldg.position.z > 20) {
            bldg.position.z = -60
          }
        }

        // Move pads
        for (const pad of pads) {
          pad.position.z += scrollSpeed * 1.8
          if (pad.position.z > 15) {
            pad.position.z = -60
          }
        }
      }
    } else if (preset === "voxel") {
      // Floating Voxel Island
      const islandGroup = new THREE.Group()
      sceneGroup.add(islandGroup)

      const boxGeo = trackGeo(new THREE.BoxGeometry(0.8, 0.8, 0.8))
      const grassMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x10b981,
          roughness: 0.6,
          wireframe,
        })
      )
      const dirtMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x78350f,
          roughness: 0.9,
          wireframe,
        })
      )
      const stoneMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x475569,
          roughness: 0.8,
          wireframe,
        })
      )

      // Build layered voxel terrain
      for (let x = -3; x <= 3; x++) {
        for (let z = -3; z <= 3; z++) {
          const dist = Math.sqrt(x * x + z * z)
          if (dist <= 3.2) {
            // Grass block
            const grass = new THREE.Mesh(boxGeo, grassMat)
            grass.position.set(x * 0.85, 0, z * 0.85)
            islandGroup.add(grass)

            // Dirt block below
            const dirt = new THREE.Mesh(boxGeo, dirtMat)
            dirt.position.set(x * 0.85, -0.85, z * 0.85)
            islandGroup.add(dirt)

            if (dist <= 2) {
              const stone = new THREE.Mesh(boxGeo, stoneMat)
              stone.position.set(x * 0.85, -1.7, z * 0.85)
              islandGroup.add(stone)
            }
          }
        }
      }

      // Stylized pine tree
      const trunkMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8, wireframe })
      )
      const trunk = new THREE.Mesh(trackGeo(new THREE.CylinderGeometry(0.12, 0.15, 1.2, 6)), trunkMat)
      trunk.position.set(-1.2, 0.9, -0.8)
      islandGroup.add(trunk)

      const foliageMat = trackMat(
        new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.5, wireframe })
      )
      const foliage1 = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.8, 1.1, 6)), foliageMat)
      foliage1.position.set(-1.2, 1.6, -0.8)
      islandGroup.add(foliage1)

      const foliage2 = new THREE.Mesh(trackGeo(new THREE.ConeGeometry(0.55, 0.9, 6)), foliageMat)
      foliage2.position.set(-1.2, 2.1, -0.8)
      islandGroup.add(foliage2)

      // Floating power crystal in the center
      const crystalGeo = trackGeo(new THREE.OctahedronGeometry(0.65, 0))
      const crystalMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xa855f7,
          emissive: 0x7e22ce,
          emissiveIntensity: 0.8,
          roughness: 0.1,
          metalness: 0.3,
          wireframe,
        })
      )
      const crystal = new THREE.Mesh(crystalGeo, crystalMat)
      crystal.position.set(0.6, 1.4, 0.6)
      islandGroup.add(crystal)

      const crystalLight = new THREE.PointLight(0xa855f7, 2.5, 6)
      crystalLight.position.set(0.6, 1.4, 0.6)
      islandGroup.add(crystalLight)

      updateFrame = (time: number, speedMultiplier: number) => {
        islandGroup.rotation.y = time * 0.3 * speedMultiplier
        islandGroup.position.y = Math.sin(time * 1.5) * 0.15
        crystal.rotation.y = time * 1.2
        crystal.position.y = 1.4 + Math.sin(time * 2.5) * 0.18
      }
    } else {
      // Space Defense Arena
      const spaceGroup = new THREE.Group()
      sceneGroup.add(spaceGroup)

      // Fighter Ship
      const fighterGroup = new THREE.Group()
      spaceGroup.add(fighterGroup)

      const shipBody = new THREE.Mesh(
        trackGeo(new THREE.ConeGeometry(0.6, 2, 4)),
        trackMat(new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3, metalness: 0.7, wireframe }))
      )
      shipBody.rotation.x = Math.PI / 2
      fighterGroup.add(shipBody)

      const shipWings = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(2.2, 0.05, 0.6)),
        trackMat(new THREE.MeshStandardMaterial({ color: 0x60a5fa, wireframe }))
      )
      shipWings.position.set(0, 0, 0.2)
      fighterGroup.add(shipWings)

      // Orbiting asteroids
      const asteroids: THREE.Mesh[] = []
      const astGeo = trackGeo(new THREE.DodecahedronGeometry(0.8, 0))
      for (let i = 0; i < 9; i++) {
        const astMat = trackMat(
          new THREE.MeshStandardMaterial({
            color: 0x64748b,
            roughness: 0.9,
            wireframe,
          })
        )
        const ast = new THREE.Mesh(astGeo, astMat)
        const angle = (i / 9) * Math.PI * 2
        const radius = 6 + (i % 3) * 2.5
        ast.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 3, Math.sin(angle) * radius)
        spaceGroup.add(ast)
        asteroids.push(ast)
      }

      // Crosshair ring
      const ringGeo = trackGeo(new THREE.RingGeometry(0.8, 0.85, 32))
      const ringMat = trackMat(
        new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
      )
      const crosshair = new THREE.Mesh(ringGeo, ringMat)
      crosshair.position.set(0, 0, -8)
      fighterGroup.add(crosshair)

      updateFrame = (time: number, speedMultiplier: number) => {
        fighterGroup.position.x = Math.sin(time * 1.5) * 0.4
        fighterGroup.position.y = Math.cos(time * 1.2) * 0.3
        fighterGroup.rotation.z = Math.sin(time * 1.5) * -0.15

        asteroids.forEach((ast, idx) => {
          ast.rotation.x += 0.01 * (idx % 2 === 0 ? 1 : -1)
          ast.rotation.y += 0.015
        })

        crosshair.rotation.z += 0.02
      }
    }

    // Set camera position based on selected cameraView
    function applyCameraPosition() {
      const rx = rotationOffsetRef.current.x
      const ry = rotationOffsetRef.current.y

      if (cameraView === "cockpit") {
        camera.position.set(0 + rx, 0.35 + ry, 0.2)
        camera.lookAt(0, 0.35, -20)
      } else if (cameraView === "topdown") {
        camera.position.set(0 + rx * 2, 10 + ry * 2, 2)
        camera.lookAt(0, 0, -2)
      } else {
        // Chase view (default)
        camera.position.set(0 + rx, 2.2 + ry, 5.5)
        camera.lookAt(0, 0.4, -6)
      }
    }

    applyCameraPosition()

    // Mouse drag interaction to rotate/pan camera
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const deltaX = e.clientX - previousMousePositionRef.current.x
      const deltaY = e.clientY - previousMousePositionRef.current.y

      rotationOffsetRef.current.x -= deltaX * 0.015
      rotationOffsetRef.current.y += deltaY * 0.015
      rotationOffsetRef.current.y = Math.max(-2, Math.min(3, rotationOffsetRef.current.y))

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY }
      applyCameraPosition()
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
    }

    const domElement = renderer.domElement
    domElement.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    // Touch support for mobile interaction
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true
        previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return
      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y

      rotationOffsetRef.current.x -= deltaX * 0.015
      rotationOffsetRef.current.y += deltaY * 0.015
      rotationOffsetRef.current.y = Math.max(-2, Math.min(3, rotationOffsetRef.current.y))

      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      applyCameraPosition()
    }

    const handleTouchEnd = () => {
      isDraggingRef.current = false
    }

    domElement.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd)

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        const newHeight = entry.contentRect.height
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight
          camera.updateProjectionMatrix()
          renderer.setSize(newWidth, newHeight)
        }
      }
    })
    resizeObserver.observe(container)

    // Animation loop
    let animationFrameId: number
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate)
      const elapsedTime = (currentTime - startTime) * 0.001
      const speedMultiplier = boost ? 2.2 : 1.0

      updateFrame(elapsedTime, speedMultiplier)
      renderer.render(scene, camera)
    }

    animationFrameId = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      domElement.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
      domElement.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)

      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      renderer.dispose()

      if (container.contains(domElement)) {
        container.removeChild(domElement)
      }
    }
  }, [preset, cameraView, wireframe, boost])

  return (
    <div
      ref={containerRef}
      className="relative size-full min-h-[380px] sm:min-h-[460px] cursor-grab active:cursor-grabbing select-none overflow-hidden"
    />
  )
}
