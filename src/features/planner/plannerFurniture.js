import { WALL_SNAP_PCT } from './plannerConfig.js'
import { getScaledBounds } from '../../data/furniture.js'

export function snapPosition({
  rawX,
  rawY,
  bounds,
  movingId = null,
  snapEnabled,
  gridStepWidth,
  gridStepHeight,
  placedFurniture,
  roomDimensions,
}) {
  if (!snapEnabled) return { x: rawX, y: rawY, guides: { vertical: null, horizontal: null } }

  let x = Math.round(rawX / gridStepWidth) * gridStepWidth
  let y = Math.round(rawY / gridStepHeight) * gridStepHeight
  let verticalGuide = null
  let horizontalGuide = null
  const snapThreshold = 2.4

  if (rawX < WALL_SNAP_PCT) x = 0
  if (rawY < WALL_SNAP_PCT) y = 0
  if (rawX + bounds.w > 100 - WALL_SNAP_PCT) x = 100 - bounds.w
  if (rawY + bounds.h > 100 - WALL_SNAP_PCT) y = 100 - bounds.h

  const movingXCandidates = [
    { point: x, apply: (target) => target },
    { point: x + bounds.w / 2, apply: (target) => target - bounds.w / 2 },
    { point: x + bounds.w, apply: (target) => target - bounds.w },
  ]
  const movingYCandidates = [
    { point: y, apply: (target) => target },
    { point: y + bounds.h / 2, apply: (target) => target - bounds.h / 2 },
    { point: y + bounds.h, apply: (target) => target - bounds.h },
  ]

  let bestX = { distance: Infinity, next: x, guide: null }
  let bestY = { distance: Infinity, next: y, guide: null }

  placedFurniture
    .filter((item) => item.id !== movingId)
    .forEach((item) => {
      const otherBounds = getScaledBounds(item.type, item.scale ?? 1, roomDimensions)
      const otherX = item.x ?? 18
      const otherY = item.y ?? 24
      const targetXs = [otherX, otherX + otherBounds.w / 2, otherX + otherBounds.w]
      const targetYs = [otherY, otherY + otherBounds.h / 2, otherY + otherBounds.h]

      movingXCandidates.forEach((candidate) => {
        targetXs.forEach((target) => {
          const distance = Math.abs(candidate.point - target)
          if (distance < snapThreshold && distance < bestX.distance) {
            bestX = { distance, next: candidate.apply(target), guide: target }
          }
        })
      })

      movingYCandidates.forEach((candidate) => {
        targetYs.forEach((target) => {
          const distance = Math.abs(candidate.point - target)
          if (distance < snapThreshold && distance < bestY.distance) {
            bestY = { distance, next: candidate.apply(target), guide: target }
          }
        })
      })
    })

  if (bestX.guide !== null) {
    x = Math.min(Math.max(bestX.next, 0), 100 - bounds.w)
    verticalGuide = bestX.guide
  }
  if (bestY.guide !== null) {
    y = Math.min(Math.max(bestY.next, 0), 100 - bounds.h)
    horizontalGuide = bestY.guide
  }

  return { x, y, guides: { vertical: verticalGuide, horizontal: horizontalGuide } }
}

export function getCanvasFootprint(type, scale, roomDimensions) {
  const bounds = getScaledBounds(type, scale, roomDimensions)
  return { width: `${bounds.w}%`, height: `${bounds.h}%` }
}

export function getSmartPlacement(type, placementMode, placedFurniture, roomDimensions) {
  const autoPlacement = {
    sofa: { x: 22, y: 58, rotation: 0 },
    bed: { x: 58, y: 18, rotation: 0 },
    table: { x: 38, y: 38, rotation: 0 },
    desk: { x: 54, y: 56, rotation: 0 },
    chair: { x: 30, y: 34, rotation: 0 },
    computer: { x: 58, y: 58, rotation: 0 },
    rug: { x: 28, y: 52, rotation: 0 },
    tv: { x: 18, y: 14, rotation: 0 },
    lamp: { x: 72, y: 20, rotation: 0 },
    vanity: { x: 70, y: 30, rotation: 0 },
    wardrobe: { x: 76, y: 18, rotation: 0 },
    bookcase: { x: 78, y: 22, rotation: 0 },
    dresser: { x: 74, y: 54, rotation: 0 },
    fridge: { x: 82, y: 12, rotation: 0 },
    microwave: { x: 80, y: 24, rotation: 0 },
    hanger: { x: 12, y: 18, rotation: 0 },
    mirror: { x: 12, y: 44, rotation: 0 },
    shelf: { x: 78, y: 34, rotation: 0 },
    sideTable: { x: 66, y: 18, rotation: 0 },
    stool: { x: 44, y: 44, rotation: 0 },
    curtain: { x: 56, y: 8, rotation: 0 },
    blind: { x: 56, y: 8, rotation: 0 },
    washer: { x: 84, y: 38, rotation: 0 },
    microwaveStand: { x: 80, y: 20, rotation: 0 },
    monitorArm: { x: 58, y: 56, rotation: 0 },
    laptop: { x: 58, y: 56, rotation: 0 },
    tableLamp: { x: 66, y: 18, rotation: 0 },
    beanbag: { x: 24, y: 24, rotation: 0 },
    openShelf: { x: 82, y: 50, rotation: 0 },
    laundryBasket: { x: 86, y: 58, rotation: 0 },
    shoeCabinet: { x: 10, y: 8, rotation: 0 },
    wallShelf: { x: 70, y: 14, rotation: 0 },
    trolley: { x: 72, y: 42, rotation: 0 },
    airPurifier: { x: 18, y: 26, rotation: 0 },
    plant: { x: 84, y: 64, rotation: 0 },
    cushion: { x: 24, y: 58, rotation: 0 },
    poster: { x: 44, y: 10, rotation: 0 },
    wallClock: { x: 34, y: 10, rotation: 0 },
    miniBookcase: { x: 74, y: 40, rotation: 0 },
    makeupOrganizer: { x: 70, y: 30, rotation: 0 },
    trashCan: { x: 60, y: 60, rotation: 0 },
    vacuumDock: { x: 14, y: 60, rotation: 0 },
    portableAc: { x: 84, y: 28, rotation: 0 },
    wallMountedAc: { x: 50, y: 4, rotation: 0 },
    fan: { x: 24, y: 32, rotation: 0 },
    circulator: { x: 26, y: 26, rotation: 0 },
    freezer: { x: 84, y: 48, rotation: 0 },
    riceCooker: { x: 80, y: 24, rotation: 0 },
    coffeeMachine: { x: 80, y: 22, rotation: 0 },
    speaker: { x: 58, y: 56, rotation: 0 },
  }

  if (placementMode === 'center') return { x: 42, y: 40, rotation: 0 }
  if (placementMode === 'wall') return { x: 12, y: 24, rotation: 0 }
  if (placementMode === 'window') return { x: 62, y: 14, rotation: 0 }

  if (type === 'computer') {
    const latestDesk = [...placedFurniture].reverse().find((item) => item.type === 'desk')
    if (latestDesk) {
      const deskBounds = getScaledBounds('desk', latestDesk.scale ?? 1, roomDimensions)
      const computerBounds = getScaledBounds('computer', 1, roomDimensions)
      return {
        x: latestDesk.x + Math.max(0, (deskBounds.w - computerBounds.w) / 2),
        y: latestDesk.y + Math.max(0, (deskBounds.h - computerBounds.h) / 2),
        rotation: latestDesk.rotation ?? 0,
      }
    }
  }

  if (['monitorArm', 'laptop', 'speaker'].includes(type)) {
    const latestDesk = [...placedFurniture].reverse().find((item) => item.type === 'desk')
    if (latestDesk) {
      const deskBounds = getScaledBounds('desk', latestDesk.scale ?? 1, roomDimensions)
      const itemBounds = getScaledBounds(type, 1, roomDimensions)
      return {
        x: latestDesk.x + Math.max(0, (deskBounds.w - itemBounds.w) / 2),
        y: latestDesk.y + Math.max(0, (deskBounds.h - itemBounds.h) / 2),
        rotation: latestDesk.rotation ?? 0,
      }
    }
  }

  if (['microwave', 'riceCooker', 'coffeeMachine', 'makeupOrganizer'].includes(type)) {
    const latestSupport = [...placedFurniture].reverse().find((item) => ['microwaveStand', 'dresser', 'trolley', 'table'].includes(item.type))
    if (latestSupport) {
      const supportBounds = getScaledBounds(latestSupport.type, latestSupport.scale ?? 1, roomDimensions)
      const itemBounds = getScaledBounds(type, 1, roomDimensions)
      return {
        x: latestSupport.x + Math.max(0, (supportBounds.w - itemBounds.w) / 2),
        y: latestSupport.y + Math.max(0, (supportBounds.h - itemBounds.h) / 2),
        rotation: latestSupport.rotation ?? 0,
      }
    }
  }

  return autoPlacement[type] ?? { x: 22, y: 24, rotation: 0 }
}
