import { MathUtils } from 'three'
import { getFurniturePlacement3D } from './furniture.js'

export function getCameraPresetConfig(cameraPreset, roomDimensions, placedFurniture) {
  const sofaItem = placedFurniture.find((item) => item.type === 'sofa')
  const bedItem = placedFurniture.find((item) => item.type === 'bed')
  const sofaPlacement = sofaItem ? getFurniturePlacement3D(sofaItem, roomDimensions) : null
  const bedPlacement = bedItem ? getFurniturePlacement3D(bedItem, roomDimensions) : null

  if (cameraPreset === 'living' && sofaPlacement) {
    return {
      key: 'living',
      position: [
        sofaPlacement.x + roomDimensions.width * 0.44,
        roomDimensions.height * 0.44,
        sofaPlacement.z + roomDimensions.depth * 0.96,
      ],
      target: [sofaPlacement.x, roomDimensions.height * 0.34, sofaPlacement.z - roomDimensions.depth * 0.02],
      fov: 24,
    }
  }
  if (cameraPreset === 'bedroom' && bedPlacement) {
    return {
      key: 'bedroom',
      position: [
        bedPlacement.x + roomDimensions.width * 0.34,
        roomDimensions.height * 0.42,
        bedPlacement.z + roomDimensions.depth * 1.02,
      ],
      target: [bedPlacement.x, roomDimensions.height * 0.32, bedPlacement.z - bedPlacement.depth * 0.12],
      fov: 24,
    }
  }
  return {
    key: 'editorial',
    position: [roomDimensions.width * 1.02, roomDimensions.height * 0.46, roomDimensions.depth * 1.36],
    target: [roomDimensions.width * 0.02, roomDimensions.height * 0.34, -roomDimensions.depth * 0.06],
    fov: 23,
  }
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getTourInsets(roomDimensions) {
  const inset = Math.max(Math.min(Math.min(roomDimensions.width, roomDimensions.depth) * 0.18, 1.08), 0.88)
  return {
    xMin: -roomDimensions.width / 2 + inset,
    xMax: roomDimensions.width / 2 - inset,
    zMin: -roomDimensions.depth / 2 + inset,
    zMax: roomDimensions.depth / 2 - inset,
  }
}

function createTourPose(key, position, lookAt, roomDimensions) {
  const dx = lookAt[0] - position[0]
  const dz = lookAt[2] - position[2]
  const dy = lookAt[1] - position[1]
  const distance = Math.max(Math.hypot(dx, dz), 0.001)
  const insets = getTourInsets(roomDimensions)

  return {
    key,
    position: [
      clamp(position[0], insets.xMin, insets.xMax),
      clamp(position[1], 1.42, Math.max(1.58, roomDimensions.height - 0.52)),
      clamp(position[2], insets.zMin, insets.zMax),
    ],
    yaw: Math.atan2(dx, dz),
    pitch: MathUtils.radToDeg(Math.atan2(dy, distance)),
  }
}

export function getTourStopConfig(stopId, roomDimensions, placedFurniture) {
  const eyeHeight = clamp(roomDimensions.height * 0.55, 1.48, 1.64)
  const insets = getTourInsets(roomDimensions)
  const sofaItem = placedFurniture.find((item) => item.type === 'sofa')
  const bedItem = placedFurniture.find((item) => item.type === 'bed')
  const tableItem = placedFurniture.find((item) => item.type === 'table')

  const sofaPlacement = sofaItem ? getFurniturePlacement3D(sofaItem, roomDimensions) : null
  const bedPlacement = bedItem ? getFurniturePlacement3D(bedItem, roomDimensions) : null
  const tablePlacement = tableItem ? getFurniturePlacement3D(tableItem, roomDimensions) : null
  const mainFocus = sofaPlacement ?? bedPlacement ?? tablePlacement ?? { x: 0, z: -roomDimensions.depth * 0.12, width: 1.2, depth: 1.2 }

  const entryPose = createTourPose(
    'entry',
    [0, eyeHeight, insets.zMax],
    [mainFocus.x * 0.4, eyeHeight - 0.04, Math.min(mainFocus.z, -roomDimensions.depth * 0.06)],
    roomDimensions,
  )

  if (stopId === 'window') {
    return createTourPose(
      'window',
      [clamp(-roomDimensions.width * 0.18, insets.xMin, insets.xMax), eyeHeight, clamp(roomDimensions.depth * 0.02, insets.zMin, insets.zMax)],
      [clamp(mainFocus.x * 0.3, -roomDimensions.width * 0.18, roomDimensions.width * 0.18), eyeHeight - 0.04, Math.min(mainFocus.z, -roomDimensions.depth * 0.14)],
      roomDimensions,
    )
  }

  if (stopId === 'bed' && bedPlacement) {
    return createTourPose(
      'bed',
      [
        clamp(bedPlacement.x, insets.xMin, insets.xMax),
        eyeHeight,
        clamp(bedPlacement.z + Math.max(bedPlacement.depth * 1.18, 1.18), insets.zMin, insets.zMax),
      ],
      [bedPlacement.x, eyeHeight - 0.06, bedPlacement.z],
      roomDimensions,
    )
  }

  if (stopId === 'detail') {
    const focus = bedPlacement ?? sofaPlacement ?? tablePlacement
    if (focus) {
      return createTourPose(
        'detail',
        [
          clamp(focus.x + Math.max(focus.width * 0.96, 1.12), insets.xMin, insets.xMax),
          eyeHeight,
          clamp(focus.z + Math.max(focus.depth * 0.9, 0.92), insets.zMin, insets.zMax),
        ],
        [focus.x, eyeHeight - 0.04, focus.z],
        roomDimensions,
      )
    }
  }

  return entryPose
}
