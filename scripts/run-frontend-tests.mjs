import assert from 'node:assert/strict'

import {
  cloneInitialLayouts,
  sanitizeLayout,
  sanitizePlanElements,
  sanitizeRoomDimensions,
} from '../src/features/planner/plannerState.js'

function runTest(name, fn) {
  try {
    fn()
    console.log(`PASS ${name}`)
  } catch (error) {
    console.error(`FAIL ${name}`)
    console.error(error)
    process.exitCode = 1
  }
}

runTest('sanitizeRoomDimensions clamps room size into supported editor range', () => {
  const room = sanitizeRoomDimensions({ width: 12, depth: 1, height: 8 })
  assert.deepEqual(room, { width: 10, depth: 3, height: 5 })
})

runTest('sanitizePlanElements forces partition off and normalizes invalid sides', () => {
  const plan = sanitizePlanElements({
    partition: { enabled: true, orientation: 'horizontal', offset: 72 },
    door: { enabled: true, side: 'invalid', offset: 55 },
    window: { enabled: false, side: 'right', offset: 30 },
  })

  assert.equal(plan.partition.enabled, false)
  assert.equal(plan.partition.orientation, 'horizontal')
  assert.equal(plan.door.side, 'left')
  assert.equal(plan.window.side, 'right')
})

runTest('sanitizeLayout restores safe defaults for malformed saved state', () => {
  const layout = sanitizeLayout({
    placedFurniture: [{ id: 42, x: 120, y: -12, rotation: 90, scale: 4 }],
    selectedFurnitureId: 'missing',
    selectedFurnitureIds: ['missing'],
    roomDimensions: { width: 2, depth: 20, height: 1 },
    cameraMode: 'unexpected',
    editorViewMode: 'unknown',
  })

  assert.equal(layout.placedFurniture[0].id, '42')
  assert.equal(layout.placedFurniture[0].x, 95)
  assert.equal(layout.placedFurniture[0].y, 0)
  assert.equal(layout.placedFurniture[0].scale, 2)
  assert.equal(layout.selectedFurnitureId, '42')
  assert.deepEqual(layout.selectedFurnitureIds, [])
  assert.deepEqual(layout.roomDimensions, { width: 3, depth: 10, height: 2.2 })
  assert.equal(layout.cameraMode, 'orbit')
  assert.equal(layout.editorViewMode, '2D')
})

runTest('cloneInitialLayouts returns a deep copy', () => {
  const layouts = cloneInitialLayouts()
  layouts[1].placedFurniture[0].name = '변경됨'

  const nextLayouts = cloneInitialLayouts()
  assert.notEqual(nextLayouts[1].placedFurniture[0].name, '변경됨')
})

if (process.exitCode) {
  process.exit(process.exitCode)
}
