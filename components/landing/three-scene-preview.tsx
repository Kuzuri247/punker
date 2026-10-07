"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export type CameraView = "chase" | "cockpit" | "topdown"

export interface ThreeScenePreviewProps {
  wireframe?: boolean
  boost?: boolean
  steerDirection?: number // -1 (left), 0 (none), 1 (right)
  isSoundEnabled?: boolean
  cameraView?: CameraView
  onTelemetryUpdate?: (telemetry: {
    speedKmh: number
    score: number
    isBoosting: boolean
    fps: number
  }) => void
  onScoreIncrease?: (amount: number) => void
}

// Procedural skyscraper texture generator with illuminated cyberpunk windows
function createBuildingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext("2d")!

  // Deep obsidian facade
  ctx.fillStyle = "#0c0e14"
  ctx.fillRect(0, 0, 256, 512)

  // Windows grid
  const cols = 8
  const rows = 32
  const padX = 8
  const padY = 6
  const w = (256 - padX * (cols + 1)) / cols
  const h = (512 - padY * (rows + 1)) / rows

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const rand = Math.random()
      if (rand > 0.48) {
        if (rand > 0.9) {
          ctx.fillStyle = "#06b6d4" // Cyan
        } else if (rand > 0.78) {
          ctx.fillStyle = "#818cf8" // Indigo
        } else if (rand > 0.68) {
          ctx.fillStyle = "#f59e0b" // Amber
        } else {
          ctx.fillStyle = "#e0e7ff" // Warm white
        }
        ctx.fillRect(padX + c * (w + padX), padY + r * (h + padY), w, h)
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export function ThreeScenePreview({
  wireframe = false,
  boost: externalBoost = false,
  steerDirection = 0,
  isSoundEnabled = false,
  onTelemetryUpdate,
  onScoreIncrease,
}: ThreeScenePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Game control state refs
  const keyStateRef = useRef<{
    left: boolean
    right: boolean
    boost: boolean
    brake: boolean
  }>({
    left: false,
    right: false,
    boost: false,
    brake: false,
  })

  const targetCraftXRef = useRef(0)
  const currentCraftXRef = useRef(0)
  const currentSpeedRef = useRef(340)
  const scoreRef = useRef(0)
  const isDraggingRef = useRef(false)
  const dragStartPosRef = useRef({ x: 0, craftX: 0 })

  // Audio Context Ref
  const audioContextRef = useRef<{
    ctx: AudioContext
    engineGain: GainNode
    engineOsc: OscillatorNode
    boostGain: GainNode
    boostOsc: OscillatorNode
  } | null>(null)

  // Sound initialization & control
  useEffect(() => {
    if (!isSoundEnabled) {
      if (audioContextRef.current) {
        try {
          audioContextRef.current.engineGain.gain.setValueAtTime(
            0,
            audioContextRef.current.ctx.currentTime
          )
          audioContextRef.current.boostGain.gain.setValueAtTime(
            0,
            audioContextRef.current.ctx.currentTime
          )
        } catch (_) {}
      }
      return
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return

      let audio = audioContextRef.current
      if (!audio) {
        const ctx = new AudioCtx()

        // Engine low rumble
        const engineOsc = ctx.createOscillator()
        engineOsc.type = "sawtooth"
        engineOsc.frequency.value = 85

        const engineFilter = ctx.createBiquadFilter()
        engineFilter.type = "lowpass"
        engineFilter.frequency.value = 220

        const engineGain = ctx.createGain()
        engineGain.gain.value = 0.04

        engineOsc.connect(engineFilter)
        engineFilter.connect(engineGain)
        engineGain.connect(ctx.destination)
        engineOsc.start()

        // Boost high turbine whoosh
        const boostOsc = ctx.createOscillator()
        boostOsc.type = "sine"
        boostOsc.frequency.value = 320

        const boostFilter = ctx.createBiquadFilter()
        boostFilter.type = "bandpass"
        boostFilter.frequency.value = 440

        const boostGain = ctx.createGain()
        boostGain.gain.value = 0

        boostOsc.connect(boostFilter)
        boostFilter.connect(boostGain)
        boostGain.connect(ctx.destination)
        boostOsc.start()

        audio = { ctx, engineGain, engineOsc, boostGain, boostOsc }
        audioContextRef.current = audio
      }

      if (audio.ctx.state === "suspended") {
        audio.ctx.resume().catch(() => {})
      }

      audio.engineGain.gain.setValueAtTime(0.04, audio.ctx.currentTime)
    } catch (_) {}

    return () => {
      // mute on unmount
      if (audioContextRef.current) {
        try {
          audioContextRef.current.engineGain.gain.setValueAtTime(
            0,
            audioContextRef.current.ctx.currentTime
          )
          audioContextRef.current.boostGain.gain.setValueAtTime(
            0,
            audioContextRef.current.ctx.currentTime
          )
        } catch (_) {}
      }
    }
  }, [isSoundEnabled])

  // Play pickup chime effect
  function playPickupChime() {
    if (!isSoundEnabled || !audioContextRef.current) return
    try {
      const ctx = audioContextRef.current.ctx
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "triangle"
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12) // A5

      gain.gain.setValueAtTime(0.08, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } catch (_) {}
  }

  // Keyboard controls listener
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (["ArrowLeft", "KeyA", "a", "A"].includes(e.code) || e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keyStateRef.current.left = true
      }
      if (["ArrowRight", "KeyD", "d", "D"].includes(e.code) || e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keyStateRef.current.right = true
      }
      if (["ArrowUp", "KeyW", "w", "W", "Space"].includes(e.code) || e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        // Prevent scrolling page when pressing space inside sandbox
        if (e.code === "Space" || e.key === " ") {
          e.preventDefault()
        }
        keyStateRef.current.boost = true
      }
      if (["ArrowDown", "KeyS", "s", "S"].includes(e.code) || e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        keyStateRef.current.brake = true
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (["ArrowLeft", "KeyA", "a", "A"].includes(e.code) || e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        keyStateRef.current.left = false
      }
      if (["ArrowRight", "KeyD", "d", "D"].includes(e.code) || e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        keyStateRef.current.right = false
      }
      if (["ArrowUp", "KeyW", "w", "W", "Space"].includes(e.code) || e.key === "ArrowUp" || e.key === "w" || e.key === "W" || e.key === " ") {
        keyStateRef.current.boost = false
      }
      if (["ArrowDown", "KeyS", "s", "S"].includes(e.code) || e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        keyStateRef.current.brake = false
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene & Deep Atmospheric Cyber Fog
    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2(0x08090c, 0.02)

    const width = container.clientWidth || 800
    const height = container.clientHeight || 550

    const camera = new THREE.PerspectiveCamera(56, width / height, 0.1, 1000)
    camera.position.set(0, 2.5, 6.4)
    camera.lookAt(0, 0.6, -10)

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    })
    renderer.setClearColor(0x08090c, 1)
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.35
    container.appendChild(renderer.domElement)

    // Resource tracking for disposal
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []
    const textures: THREE.Texture[] = []

    function trackGeo<T extends THREE.BufferGeometry>(geo: T): T {
      geometries.push(geo)
      return geo
    }
    function trackMat<T extends THREE.Material>(mat: T): T {
      materials.push(mat)
      return mat
    }
    function trackTex<T extends THREE.Texture>(tex: T): T {
      textures.push(tex)
      return tex
    }

    // --- Lighting Rig ---
    const ambientLight = new THREE.AmbientLight(0x1e1b4b, 1.5)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0x06b6d4, 2.4)
    keyLight.position.set(20, 35, 15)
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight(0x818cf8, 2.0)
    rimLight.position.set(-20, 25, -25)
    scene.add(rimLight)

    // --- World & Highway Environment ---
    const worldGroup = new THREE.Group()
    scene.add(worldGroup)

    const highwayWidth = 24
    const maxLaneX = highwayWidth / 2 - 2.5 // Max horizontal player boundary

    // Highway Asphalt
    const highwayGeo = trackGeo(new THREE.PlaneGeometry(highwayWidth, 220, 1, 1))
    const highwayMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x090b10,
        roughness: 0.35,
        metalness: 0.7,
        wireframe,
      })
    )
    const highwayMesh = new THREE.Mesh(highwayGeo, highwayMat)
    highwayMesh.rotation.x = -Math.PI / 2
    highwayMesh.position.set(0, -1.02, -40)
    worldGroup.add(highwayMesh)

    // Neon Cyber Grid Layer
    const gridHelper = new THREE.GridHelper(220, 75, 0x06b6d4, 0x1e1b4b)
    gridHelper.position.y = -1.0
    worldGroup.add(gridHelper)

    // Highway Guardrails
    const guardrailGeo = trackGeo(new THREE.BoxGeometry(0.35, 0.6, 220))
    const guardrailMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 1.2,
        wireframe,
      })
    )
    const leftGuard = new THREE.Mesh(guardrailGeo, guardrailMat)
    leftGuard.position.set(-highwayWidth / 2, -0.7, -40)
    worldGroup.add(leftGuard)

    const rightGuard = new THREE.Mesh(guardrailGeo, guardrailMat)
    rightGuard.position.set(highwayWidth / 2, -0.7, -40)
    worldGroup.add(rightGuard)

    // Procedural Skyscrapers
    const bldgTexture = trackTex(createBuildingTexture())
    bldgTexture.repeat.set(1, 4)

    const buildings: Array<{ mesh: THREE.Mesh; initialZ: number }> = []
    const bldgMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x11131a,
        map: bldgTexture,
        roughness: 0.3,
        metalness: 0.8,
        wireframe,
      })
    )

    const numBldgs = 26
    for (let i = 0; i < numBldgs; i++) {
      const bldgW = 8 + (i % 3) * 4
      const bldgH = 32 + (i % 5) * 16
      const bldgD = 10 + (i % 2) * 6
      const bGeo = trackGeo(new THREE.BoxGeometry(bldgW, bldgH, bldgD))
      const bldg = new THREE.Mesh(bGeo, bldgMat)

      const side = i % 2 === 0 ? -1 : 1
      const posX = side * (highwayWidth / 2 + 10 + (i % 3) * 6)
      const posZ = -150 + i * 14
      bldg.position.set(posX, bldgH / 2 - 1, posZ)

      // Rooftop antenna tower
      const antennaGeo = trackGeo(new THREE.CylinderGeometry(0.08, 0.15, 6, 4))
      const antennaMat = trackMat(new THREE.MeshBasicMaterial({ color: 0x64748b }))
      const antenna = new THREE.Mesh(antennaGeo, antennaMat)
      antenna.position.set(0, bldgH / 2 + 3, 0)
      bldg.add(antenna)

      const beaconGeo = trackGeo(new THREE.SphereGeometry(0.25, 8, 8))
      const beaconMat = trackMat(
        new THREE.MeshBasicMaterial({
          color: i % 2 === 0 ? 0xef4444 : 0x06b6d4,
        })
      )
      const beacon = new THREE.Mesh(beaconGeo, beaconMat)
      beacon.position.set(0, 3, 0)
      antenna.add(beacon)

      worldGroup.add(bldg)
      buildings.push({ mesh: bldg, initialZ: posZ })
    }

    // Overhead Checkpoint Arches
    const arches: THREE.Group[] = []
    for (let a = 0; a < 4; a++) {
      const archGroup = new THREE.Group()
      const archFrameGeo = trackGeo(new THREE.BoxGeometry(highwayWidth + 6, 1.2, 1.8))
      const archFrameMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          metalness: 0.9,
          roughness: 0.2,
          wireframe,
        })
      )
      const archBeam = new THREE.Mesh(archFrameGeo, archFrameMat)
      archBeam.position.y = 8
      archGroup.add(archBeam)

      const pillarGeo = trackGeo(new THREE.BoxGeometry(1.2, 9, 1.8))
      const leftPillar = new THREE.Mesh(pillarGeo, archFrameMat)
      leftPillar.position.set(-(highwayWidth + 5) / 2, 4.5, 0)
      archGroup.add(leftPillar)

      const rightPillar = new THREE.Mesh(pillarGeo, archFrameMat)
      rightPillar.position.set((highwayWidth + 5) / 2, 4.5, 0)
      archGroup.add(rightPillar)

      const ringGeo = trackGeo(new THREE.TorusGeometry(3.5, 0.12, 12, 32))
      const ringMat = trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x06b6d4,
          emissiveIntensity: 1.8,
        })
      )
      const ring = new THREE.Mesh(ringGeo, ringMat)
      ring.position.y = 8
      archGroup.add(ring)

      archGroup.position.set(0, 0, -120 + a * 55)
      worldGroup.add(archGroup)
      arches.push(archGroup)
    }

    // Interactive Boost Pads on Track
    const boostPads: THREE.Mesh[] = []
    const padGeo = trackGeo(new THREE.PlaneGeometry(3.5, 5))
    const padMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf43f5e,
        emissive: 0xf43f5e,
        emissiveIntensity: 1.8,
        side: THREE.DoubleSide,
      })
    )
    for (let p = 0; p < 4; p++) {
      const pad = new THREE.Mesh(padGeo, padMat)
      pad.rotation.x = -Math.PI / 2
      pad.position.set(((p % 3) - 1) * 6, -0.98, -130 + p * 45)
      worldGroup.add(pad)
      boostPads.push(pad)
    }

    // --- Interactive Collectible Energy Rings / Power Cores ---
    const collectibleRings: Array<{
      mesh: THREE.Group
      initialZ: number
      laneX: number
      active: boolean
    }> = []

    const ringOuterGeo = trackGeo(new THREE.TorusGeometry(0.85, 0.1, 12, 24))
    const ringInnerGeo = trackGeo(new THREE.SphereGeometry(0.3, 12, 12))
    const ringMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x06b6d4,
        emissiveIntensity: 2.5,
        wireframe,
      })
    )
    const ringCoreMat = trackMat(
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
      })
    )

    const lanes = [-7, -3.5, 0, 3.5, 7]
    for (let c = 0; c < 6; c++) {
      const coreGroup = new THREE.Group()
      const outerRing = new THREE.Mesh(ringOuterGeo, ringMat)
      const innerCore = new THREE.Mesh(ringInnerGeo, ringCoreMat)
      coreGroup.add(outerRing)
      coreGroup.add(innerCore)

      const laneX = lanes[c % lanes.length]
      const posZ = -30 - c * 25
      coreGroup.position.set(laneX, 0.4, posZ)
      worldGroup.add(coreGroup)
      collectibleRings.push({ mesh: coreGroup, initialZ: posZ, laneX, active: true })
    }

    // Particle Burst Pool for Ring Collection
    const burstCount = 60
    const burstGeo = trackGeo(new THREE.BufferGeometry())
    const burstPositions = new Float32Array(burstCount * 3)
    const burstVelocities = new Float32Array(burstCount * 3)
    let burstActive = false
    let burstLife = 0

    burstGeo.setAttribute("position", new THREE.BufferAttribute(burstPositions, 3))
    const burstMat = trackMat(
      new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.35,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
      })
    )
    const burstPoints = new THREE.Points(burstGeo, burstMat)
    scene.add(burstPoints)

    function triggerCollectionBurst(x: number, y: number, z: number) {
      burstActive = true
      burstLife = 1.0
      burstMat.opacity = 1.0
      for (let i = 0; i < burstCount; i++) {
        burstPositions[i * 3] = x
        burstPositions[i * 3 + 1] = y
        burstPositions[i * 3 + 2] = z

        const theta = Math.random() * Math.PI * 2
        const speed = 2 + Math.random() * 4
        burstVelocities[i * 3] = Math.cos(theta) * speed
        burstVelocities[i * 3 + 1] = (Math.random() - 0.2) * speed
        burstVelocities[i * 3 + 2] = Math.sin(theta) * speed
      }
      burstGeo.attributes.position.needsUpdate = true
    }

    // --- Hero Craft: Apex Hyper-Glide ---
    const craftGroup = new THREE.Group()
    scene.add(craftGroup)

    // Fuselage
    const fuselageGeo = trackGeo(new THREE.ConeGeometry(0.85, 3.4, 6))
    const fuselageMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0a0f1d,
        metalness: 0.9,
        roughness: 0.15,
        wireframe,
      })
    )
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat)
    fuselage.rotation.x = Math.PI / 2
    craftGroup.add(fuselage)

    // Delta Wings
    const wingGeo = trackGeo(new THREE.BoxGeometry(3.6, 0.08, 1.2))
    const wingMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.85,
        roughness: 0.25,
        wireframe,
      })
    )
    const wings = new THREE.Mesh(wingGeo, wingMat)
    wings.position.set(0, 0.02, 0.4)
    craftGroup.add(wings)

    // Neon Wingtip Edge Lights
    const wingEdgeGeo = trackGeo(new THREE.BoxGeometry(3.68, 0.1, 0.12))
    const wingEdgeMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 2.2,
      })
    )
    const wingEdge = new THREE.Mesh(wingEdgeGeo, wingEdgeMat)
    wingEdge.position.set(0, 0.02, -0.18)
    craftGroup.add(wingEdge)

    // Outrigger Stabilizer Fins
    const finGeo = trackGeo(new THREE.BoxGeometry(0.08, 0.8, 0.7))
    const leftFin = new THREE.Mesh(finGeo, fuselageMat)
    leftFin.position.set(-1.8, 0.35, 0.5)
    leftFin.rotation.z = -0.3
    craftGroup.add(leftFin)

    const rightFin = new THREE.Mesh(finGeo, fuselageMat)
    rightFin.position.set(1.8, 0.35, 0.5)
    rightFin.rotation.z = 0.3
    craftGroup.add(rightFin)

    // Cockpit Canopy
    const canopyGeo = trackGeo(new THREE.SphereGeometry(0.45, 20, 16))
    canopyGeo.scale(0.85, 0.55, 1.9)
    const canopyMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0369a1,
        emissiveIntensity: 0.7,
        roughness: 0.05,
        metalness: 0.95,
        wireframe,
      })
    )
    const canopy = new THREE.Mesh(canopyGeo, canopyMat)
    canopy.position.set(0, 0.32, 0.2)
    craftGroup.add(canopy)

    // Dual Engine Nacelles
    const engineGeo = trackGeo(new THREE.CylinderGeometry(0.3, 0.35, 1.2, 16))
    const engineMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.9,
        roughness: 0.2,
        wireframe,
      })
    )
    const leftEngine = new THREE.Mesh(engineGeo, engineMat)
    leftEngine.rotation.x = Math.PI / 2
    leftEngine.position.set(-0.75, 0.05, 1.3)
    craftGroup.add(leftEngine)

    const rightEngine = new THREE.Mesh(engineGeo, engineMat)
    rightEngine.rotation.x = Math.PI / 2
    rightEngine.position.set(0.75, 0.05, 1.3)
    craftGroup.add(rightEngine)

    // Thruster Plasma Exhaust Cones
    const thrusterGeo = trackGeo(new THREE.ConeGeometry(0.24, 1.2, 16))
    const thrusterMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x06b6d4,
        emissiveIntensity: 2.8,
        transparent: true,
        opacity: 0.85,
      })
    )
    const leftThruster = new THREE.Mesh(thrusterGeo, thrusterMat)
    leftThruster.rotation.x = -Math.PI / 2
    leftThruster.position.set(-0.75, 0.05, 2.3)
    craftGroup.add(leftThruster)

    const rightThruster = new THREE.Mesh(thrusterGeo, thrusterMat)
    rightThruster.rotation.x = -Math.PI / 2
    rightThruster.position.set(0.75, 0.05, 2.3)
    craftGroup.add(rightThruster)

    // Thruster Dynamic Point Lights
    const thrusterLightL = new THREE.PointLight(0x06b6d4, 4, 10)
    thrusterLightL.position.set(-0.75, 0.05, 2.0)
    craftGroup.add(thrusterLightL)

    const thrusterLightR = new THREE.PointLight(0x06b6d4, 4, 10)
    thrusterLightR.position.set(0.75, 0.05, 2.0)
    craftGroup.add(thrusterLightR)

    // Front Headlights
    const headlightL = new THREE.SpotLight(0xe0f2fe, 3.5, 45, 0.45, 0.6)
    headlightL.position.set(-0.5, 0.1, -1.4)
    headlightL.target.position.set(-0.5, -0.8, -25)
    craftGroup.add(headlightL)
    craftGroup.add(headlightL.target)

    const headlightR = new THREE.SpotLight(0xe0f2fe, 3.5, 45, 0.45, 0.6)
    headlightR.position.set(0.5, 0.1, -1.4)
    headlightR.target.position.set(0.5, -0.8, -25)
    craftGroup.add(headlightR)
    craftGroup.add(headlightR.target)

    // Particle Warp Trails
    const particleCount = 750
    const particleGeo = trackGeo(new THREE.BufferGeometry())
    const particlePositions = new Float32Array(particleCount * 3)
    const particleSpeeds = new Float32Array(particleCount)

    for (let p = 0; p < particleCount; p++) {
      particlePositions[p * 3] = (Math.random() - 0.5) * 45
      particlePositions[p * 3 + 1] = Math.random() * 25 - 1
      particlePositions[p * 3 + 2] = -120 + Math.random() * 140
      particleSpeeds[p] = 0.8 + Math.random() * 1.5
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3))
    const particleMat = trackMat(
      new THREE.PointsMaterial({
        color: 0x38bdf8,
        size: 0.18,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      })
    )
    const particleSystem = new THREE.Points(particleGeo, particleMat)
    scene.add(particleSystem)

    // --- Interactive Mouse / Touch Drag Steering ---
    const domElement = renderer.domElement

    function handlePointerDown(e: MouseEvent) {
      isDraggingRef.current = true
      dragStartPosRef.current = {
        x: e.clientX,
        craftX: targetCraftXRef.current,
      }
    }

    function handlePointerMove(e: MouseEvent) {
      if (!isDraggingRef.current) return
      const rect = domElement.getBoundingClientRect()
      // Map pointer directly to highway lane
      const normalizedX = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      targetCraftXRef.current = THREE.MathUtils.clamp(
        normalizedX * maxLaneX * 1.1,
        -maxLaneX,
        maxLaneX
      )
    }

    function handlePointerUp() {
      isDraggingRef.current = false
    }

    // Touch Support
    function handleTouchStart(e: TouchEvent) {
      if (e.touches.length === 1) {
        isDraggingRef.current = true
        const touch = e.touches[0]
        const rect = domElement.getBoundingClientRect()
        const normalizedX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2
        targetCraftXRef.current = THREE.MathUtils.clamp(
          normalizedX * maxLaneX * 1.1,
          -maxLaneX,
          maxLaneX
        )
      }
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isDraggingRef.current || e.touches.length !== 1) return
      const touch = e.touches[0]
      const rect = domElement.getBoundingClientRect()
      const normalizedX = ((touch.clientX - rect.left) / rect.width - 0.5) * 2
      targetCraftXRef.current = THREE.MathUtils.clamp(
        normalizedX * maxLaneX * 1.1,
        -maxLaneX,
        maxLaneX
      )
    }

    function handleTouchEnd() {
      isDraggingRef.current = false
    }

    domElement.addEventListener("mousedown", handlePointerDown)
    window.addEventListener("mousemove", handlePointerMove)
    window.addEventListener("mouseup", handlePointerUp)
    domElement.addEventListener("touchstart", handleTouchStart, { passive: true })
    window.addEventListener("touchmove", handleTouchMove, { passive: true })
    window.addEventListener("touchend", handleTouchEnd)

    // Resize Observer
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

    // Telemetry throttle ticker
    let lastTelemetryEmit = performance.now()
    let frameCounter = 0
    let lastFpsTime = performance.now()
    let currentFps = 60

    // Animation & Physics Loop
    let animationFrameId: number
    const startTime = performance.now()
    let prevCraftX = 0

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate)
      const time = (currentTime - startTime) * 0.001
      const delta = 0.016

      // FPS measure
      frameCounter++
      if (currentTime - lastFpsTime >= 500) {
        currentFps = Math.round((frameCounter * 1000) / (currentTime - lastFpsTime))
        frameCounter = 0
        lastFpsTime = currentTime
      }

      // --- Interactive Steering Input Processing ---
      const keys = keyStateRef.current
      const steerSpeed = 16 * delta

      if (keys.left || steerDirection < 0) {
        targetCraftXRef.current = Math.max(-maxLaneX, targetCraftXRef.current - steerSpeed)
      }
      if (keys.right || steerDirection > 0) {
        targetCraftXRef.current = Math.min(maxLaneX, targetCraftXRef.current + steerSpeed)
      }

      // Smooth craft X damping
      currentCraftXRef.current = THREE.MathUtils.damp(
        currentCraftXRef.current,
        targetCraftXRef.current,
        10,
        delta
      )
      const craftX = currentCraftXRef.current
      const steerVelocity = (craftX - prevCraftX) / delta
      prevCraftX = craftX

      // --- Speed & Boost Physics ---
      const isBoosting = keys.boost || externalBoost
      const isBraking = keys.brake

      const targetSpeed = isBoosting ? 740 : isBraking ? 180 : 360
      currentSpeedRef.current = THREE.MathUtils.damp(
        currentSpeedRef.current,
        targetSpeed,
        5,
        delta
      )
      const speedKmh = Math.round(currentSpeedRef.current)
      const speedMultiplier = currentSpeedRef.current / 360

      // Emit telemetry to parent
      if (currentTime - lastTelemetryEmit > 100) {
        lastTelemetryEmit = currentTime
        onTelemetryUpdate?.({
          speedKmh,
          score: scoreRef.current,
          isBoosting,
          fps: Math.min(60, currentFps),
        })

        // Update Web Audio engine frequency
        if (audioContextRef.current && isSoundEnabled) {
          const audio = audioContextRef.current
          try {
            const freq = 85 + (speedKmh - 180) * 0.22
            audio.engineOsc.frequency.setValueAtTime(freq, audio.ctx.currentTime)
            const boostVol = isBoosting ? 0.08 : 0.0
            audio.boostGain.gain.setValueAtTime(boostVol, audio.ctx.currentTime)
          } catch (_) {}
        }
      }

      // Dynamic FOV Warp in Boost
      const targetFov = isBoosting ? 72 : 56
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, 0.08)
      camera.updateProjectionMatrix()

      // Hovercraft Floating & Banking Physics
      const hoverBob = Math.sin(time * 3.4) * 0.12 + 0.15
      craftGroup.position.y = hoverBob
      craftGroup.position.x = craftX

      // Aerodynamic roll into corners
      const rollAngle = -steerVelocity * 0.045
      craftGroup.rotation.z = THREE.MathUtils.clamp(rollAngle, -0.42, 0.42)

      // Slight yaw steering heading
      const yawAngle = -steerVelocity * 0.015
      craftGroup.rotation.y = THREE.MathUtils.clamp(yawAngle, -0.22, 0.22)

      // Pitch: nose down when accelerating, nose up when braking
      craftGroup.rotation.x = isBoosting ? 0.08 : isBraking ? -0.04 : 0.02

      // Dynamic Chase Camera following craft
      camera.position.x = craftX * 0.55
      camera.position.y = 2.4 + (isBoosting ? 0.2 : 0)
      camera.position.z = 6.2 + (isBoosting ? 0.7 : 0)
      camera.lookAt(craftX * 0.2, 0.5, -12)

      // Thruster Flare & Color
      const flarePulse = 1.0 + Math.sin(time * 26) * 0.25
      const thrusterScaleZ = (isBoosting ? 2.8 : 1.35) * flarePulse
      leftThruster.scale.set(isBoosting ? 1.4 : 1.0, thrusterScaleZ, isBoosting ? 1.4 : 1.0)
      rightThruster.scale.set(isBoosting ? 1.4 : 1.0, thrusterScaleZ, isBoosting ? 1.4 : 1.0)

      if (isBoosting) {
        thrusterMat.color.setHex(0xf59e0b) // Amber plasma
        thrusterMat.emissive.setHex(0xf59e0b)
        thrusterLightL.color.setHex(0xf59e0b)
        thrusterLightR.color.setHex(0xf59e0b)
        thrusterLightL.intensity = 7 * flarePulse
        thrusterLightR.intensity = 7 * flarePulse
      } else {
        thrusterMat.color.setHex(0x06b6d4) // Cyan ion
        thrusterMat.emissive.setHex(0x06b6d4)
        thrusterLightL.color.setHex(0x06b6d4)
        thrusterLightR.color.setHex(0x06b6d4)
        thrusterLightL.intensity = 4 * flarePulse
        thrusterLightR.intensity = 4 * flarePulse
      }

      // World Movement along Z axis
      const scrollSpeed = 0.82 * speedMultiplier
      gridHelper.position.z = (gridHelper.position.z + scrollSpeed) % 2.93

      // Move Buildings
      for (const bldg of buildings) {
        bldg.mesh.position.z += scrollSpeed * 1.5
        if (bldg.mesh.position.z > 25) {
          bldg.mesh.position.z = -150
        }
      }

      // Move Arches
      for (const arch of arches) {
        arch.position.z += scrollSpeed * 1.6
        if (arch.position.z > 20) {
          arch.position.z = -140
        }
      }

      // Move Boost Pads
      for (const pad of boostPads) {
        pad.position.z += scrollSpeed * 2.0
        if (pad.position.z > 15) {
          pad.position.z = -140
        }
      }

      // --- Collectible Energy Rings Animation & Collision ---
      for (const ring of collectibleRings) {
        ring.mesh.position.z += scrollSpeed * 1.8
        ring.mesh.rotation.z += 0.03
        ring.mesh.rotation.y += 0.02

        // Check collection collision with craft
        if (
          ring.active &&
          Math.abs(ring.mesh.position.z - craftGroup.position.z) < 2.2 &&
          Math.abs(ring.mesh.position.x - craftX) < 2.0
        ) {
          // Collected!
          ring.active = false
          ring.mesh.visible = false
          scoreRef.current += 100
          onScoreIncrease?.(100)
          triggerCollectionBurst(ring.mesh.position.x, ring.mesh.position.y, ring.mesh.position.z)
          playPickupChime()
        }

        // Respawn past camera
        if (ring.mesh.position.z > 15) {
          ring.mesh.position.z = -150
          const randomLane = lanes[Math.floor(Math.random() * lanes.length)]
          ring.mesh.position.x = randomLane
          ring.active = true
          ring.mesh.visible = true
        }
      }

      // Update Particle Collection Burst
      if (burstActive) {
        burstLife -= delta * 2.2
        if (burstLife <= 0) {
          burstActive = false
          burstMat.opacity = 0
        } else {
          burstMat.opacity = burstLife
          for (let i = 0; i < burstCount; i++) {
            burstPositions[i * 3] += burstVelocities[i * 3] * delta
            burstPositions[i * 3 + 1] += burstVelocities[i * 3 + 1] * delta
            burstPositions[i * 3 + 2] += burstVelocities[i * 3 + 2] * delta
          }
          burstGeo.attributes.position.needsUpdate = true
        }
      }

      // Stream High-Speed Warp Particles
      const positions = particleGeo.attributes.position.array as Float32Array
      for (let p = 0; p < particleCount; p++) {
        positions[p * 3 + 2] += particleSpeeds[p] * scrollSpeed * 2.6
        if (positions[p * 3 + 2] > 10) {
          positions[p * 3 + 2] = -120
          positions[p * 3] = (Math.random() - 0.5) * 45
          positions[p * 3 + 1] = Math.random() * 25 - 1
        }
      }
      particleGeo.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
    }

    animationFrameId = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      domElement.removeEventListener("mousedown", handlePointerDown)
      window.removeEventListener("mousemove", handlePointerMove)
      window.removeEventListener("mouseup", handlePointerUp)
      domElement.removeEventListener("touchstart", handleTouchStart)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleTouchEnd)

      geometries.forEach((g) => g.dispose())
      materials.forEach((m) => m.dispose())
      textures.forEach((t) => t.dispose())
      renderer.dispose()

      if (container.contains(domElement)) {
        container.removeChild(domElement)
      }
    }
  }, [wireframe, externalBoost, isSoundEnabled])

  return (
    <div
      ref={containerRef}
      className="relative size-full min-h-[380px] sm:min-h-[520px] cursor-ew-resize select-none overflow-hidden"
    />
  )
}
