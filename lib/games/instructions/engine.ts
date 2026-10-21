/**
 * The 3D toolkit seeded into every sandbox, described for the agent.
 *
 * Kept lean to preserve LLM context window. Detailed subsystem signatures
 * and options can be inspected dynamically on demand via `inspect_engine_api`.
 */
export const engine = `# The engine

engine/ is a high-performance 3D game toolkit, already on disk in the sandbox,
built on Three.js. It handles the canvas, pixel ratio, resize handlers, input
normalization, audio context, and a deterministic delta-timed loop.

Import everything from the barrel:

  import { createGame, models, lights, materials, math } from "./engine/index.js"

## The whole shape of a game

  import { createGame, models, lights, ease } from "./engine/index.js"

  const game = createGame({
    background: "#0b1020",
    cameraPosition: [0, 6, 12],
    actions: { dash: ["ShiftLeft"] },
  })

  lights.sunset(game.scene)
  game.add(models.ground(80))

  const player = models.character()
  game.add(player)

  game.onUpdate((dt, elapsed) => {
    player.position.x += game.input.move.x * 6 * dt
    if (game.input.pressed("jump")) game.audio.play("jump")
  })

## Core shape: createGame(options)
Returns: { engine, input, hud, audio, tweens, scene, camera, renderer, onUpdate, onFixedUpdate, onLateUpdate, onResize, add, remove }.
- Options: background, fog, fov, near, far, cameraPosition, lookAt, shadows, exposure, maxPixelRatio, antialias, alpha, actions.
- Loop: onUpdate(fn(dt, elapsed)), onFixedUpdate(fn(fixedDt, elapsed)) for physics, onLateUpdate(fn) for camera follow.
- Input: input.move (Vector2), input.down(action), input.pressed(action), input.released(action), input.pointer, input.look.

## Subsystem Modules Index
The engine provides modular subsystems re-exported on index.js:
- physics: rigidbodies, colliders (box, sphere, capsule), raycasting, world.step(dt).
- models: procedural geometry (character, ground, tree, rock, building, coin, weapon, sword).
- lights: environment lighting (sunset, neon, noon, dungeon, studio, flat).
- materials: shaders & textures (matte, metal, glow, toon, glass, gridTexture, checkerTexture, palette).
- sound: procedural Web Audio synthesizer (play, synth, tone, sfx, music).
- hud: screen overlay elements (score, healthBar, message, crosshair, button).
- controls: controllers (firstPerson, thirdPerson, platformer, followCamera, topDownCamera, orbitCamera).
- animation: tweening and easing (tween, spring, shake, ease).
- particles: visual effects (sparks, explosion, smoke, confetti, fire).
- postfx: post-processing shaders (bloom, vignette, chromatic, pixelate).
- state: reactive game store (createStore, subscribe).
- math: game math utilities (clamp, lerp, damp, moveTowards, randRange, randInt, pick).

When you need exact function signatures, parameter names, or usage examples for any
subsystem, call inspect_engine_api({ module: "<name>" }) to retrieve full module documentation.
`
