import * as THREE from "three"

/**
 * Things to look at while building, and to take out before shipping.
 *
 * Worth having because the alternative is `console.log` in a render loop, which
 * floods the console and drops the framerate enough to hide the problem being
 * investigated.
 */

/** A framerate and draw-call readout in the corner. */
export function showStats(engine, options = {}) {
  const { at = "top-right" } = options
  const element = document.createElement("div")
  element.style.cssText = `
    position: absolute; ${at.includes("top") ? "top" : "bottom"}: 8px;
    ${at.includes("right") ? "right" : "left"}: 8px;
    z-index: 50; pointer-events: none;
    font: 11px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace;
    color: #a1a1a1; background: rgba(10,10,10,0.6);
    padding: 6px 9px; border-radius: 8px; white-space: pre;
  `
  engine.container.appendChild(element)

  let accumulated = 0
  engine.onLateUpdate((dt) => {
    accumulated += dt
    // Four times a second: any faster and the numbers are unreadable, and the
    // DOM write itself starts showing up in the measurement.
    if (accumulated < 0.25) return
    accumulated = 0
    const info = engine.renderer.info
    element.textContent = [
      `${engine.fps.toFixed(0)} fps`,
      `${info.render.calls} draws`,
      `${(info.render.triangles / 1000).toFixed(1)}k tris`,
      `${info.memory.geometries} geo  ${info.memory.textures} tex`,
    ].join("\n")
  })

  return { element, remove: () => element.remove() }
}

/** Grid, axes, and the shadow camera's frustum — where things actually are. */
export function showHelpers(engine, options = {}) {
  const { grid = 40, axes = 5, light = null } = options
  const added = []

  if (grid) {
    const helper = new THREE.GridHelper(grid, grid, 0x444444, 0x222222)
    engine.scene.add(helper)
    added.push(helper)
  }
  if (axes) {
    const helper = new THREE.AxesHelper(axes)
    engine.scene.add(helper)
    added.push(helper)
  }
  if (light?.shadow) {
    // The single most useful debug view in three.js: shadows that vanish at the
    // edge of the level are always this box being too small.
    const helper = new THREE.CameraHelper(light.shadow.camera)
    engine.scene.add(helper)
    added.push(helper)
  }

  return {
    helpers: added,
    remove() {
      for (const helper of added) {
        helper.dispose?.()
        engine.scene.remove(helper)
      }
    },
  }
}

/** Draws a physics world's colliders, so mismatches with the art are visible. */
export function showColliders(engine, physics, options = {}) {
  const { color = "#22c55e" } = options
  const group = new THREE.Group()
  const material = new THREE.MeshBasicMaterial({ color, wireframe: true })
  engine.scene.add(group)

  for (const collider of physics.statics) {
    if (collider.type !== "box") continue
    const size = collider.box.getSize(new THREE.Vector3())
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(size.x, size.y, size.z),
      material
    )
    mesh.position.copy(collider.box.getCenter(new THREE.Vector3()))
    group.add(mesh)
  }

  const bodyMeshes = physics.bodies.map((body) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(body.radius, 12, 8),
      new THREE.MeshBasicMaterial({ color: "#f97316", wireframe: true })
    )
    group.add(mesh)
    return { body, mesh }
  })

  engine.onLateUpdate(() => {
    for (const { body, mesh } of bodyMeshes) mesh.position.copy(body.position)
  })

  return { group, remove: () => engine.scene.remove(group) }
}

/**
 * A throttled logger for values that change every frame.
 *
 * `log("speed", velocity.length())` in an update loop prints a few times a
 * second instead of ten thousand.
 */
const lastLogged = new Map()
export function log(label, value, everySeconds = 0.5) {
  const now = performance.now() / 1000
  if (now - (lastLogged.get(label) ?? -Infinity) < everySeconds) return
  lastLogged.set(label, now)
  console.log(`${label}:`, value)
}

/**
 * Global Canvas Error Trap:
 * Intercepts unhandled errors inside requestAnimationFrame, animation loops,
 * and custom game callbacks, packaging structured stack/line telemetry and
 * immediately posting it to the parent window for autonomous self-healing.
 */
export function trapCanvasErrors(engine) {
  if (typeof window === "undefined") return

  const STATUS = "game-status"

  function dispatchError(err) {
    if (engine && typeof engine.stop === "function") {
      try {
        engine.stop()
      } catch (_) {}
    }

    if (typeof window.__reportGameError === "function") {
      window.__reportGameError(err)
    } else {
      try {
        const errorData = {
          message: err?.message || String(err),
          source: err?.fileName || err?.source || "",
          line: typeof err?.lineNumber === "number" ? err.lineNumber : typeof err?.line === "number" ? err.line : null,
          column: typeof err?.columnNumber === "number" ? err.columnNumber : typeof err?.column === "number" ? err.column : null,
          stack: err?.stack ? String(err.stack).slice(0, 2000) : "",
        }
        window.parent?.postMessage({ type: STATUS, error: errorData }, "*")
      } catch (_) {}
    }
  }

  // Wrap window.requestAnimationFrame
  if (typeof window.requestAnimationFrame === "function") {
    const originalRAF = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = function (callback) {
      return originalRAF((timestamp) => {
        try {
          callback(timestamp)
        } catch (err) {
          dispatchError(err)
          throw err
        }
      })
    }
  }

  // Intercept WebGL context loss to prevent silent black screen
  if (engine?.renderer?.domElement) {
    engine.renderer.domElement.addEventListener("webglcontextlost", (event) => {
      event.preventDefault()
      dispatchError(new Error("WebGL Context Lost: GPU crashed or canvas buffer exceeded."))
    })
  }

  return {
    dispatchError,
  }
}
