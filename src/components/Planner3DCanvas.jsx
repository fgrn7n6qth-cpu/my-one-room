import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, lazy } from 'react'
import {
  ACESFilmicToneMapping,
  BackSide,
  CanvasTexture,
  ClampToEdgeWrapping,
  MathUtils,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { getCameraPresetConfig } from '../data/style3d.js'
import { getFurniturePlacement3D } from '../data/furniture.js'

const FurniturePreview3D = lazy(() => import('./FurniturePreview3D.jsx'))

// ??? Procedural Textures ????????????????????????????????????????????????????

function createWoodFloorTexture() {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Base smoked walnut tone
  ctx.fillStyle = '#776d62'
  ctx.fillRect(0, 0, 1024, 1024)

  // Plank bands ??6 planks
  const plankW = 1024 / 6
  const plankColors = ['#6f655b', '#7a7066', '#655c53', '#80756b', '#5f574f', '#74695f']
  plankColors.forEach((col, i) => {
    ctx.fillStyle = col
    ctx.fillRect(i * plankW, 0, plankW - 1, 1024)
  })

  // Subtle plank bands instead of visible repeat seams
  const bandCount = 5
  for (let p = 0; p < bandCount; p++) {
    const bandX = p * (1024 / bandCount) + (Math.random() * 24 - 12)
    ctx.fillStyle = 'rgba(32,28,24,0.08)'
    ctx.fillRect(bandX, 0, 140 + Math.random() * 32, 1024)
  }

  // Gentle grain across the whole surface
  for (let i = 0; i < 160; i++) {
    const y = Math.random() * 1024
    const alpha = 0.02 + Math.random() * 0.04
    ctx.strokeStyle = `rgba(38,30,22,${alpha})`
    ctx.lineWidth = 0.6 + Math.random() * 0.8
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(
      256 + (Math.random() - 0.5) * 40,
      y + (Math.random() - 0.5) * 16,
      640 + (Math.random() - 0.5) * 40,
      y + (Math.random() - 0.5) * 16,
      1024,
      y + (Math.random() - 0.5) * 6
    )
    ctx.stroke()
  }

  // Subtle knots
  for (let k = 0; k < 4; k++) {
    const kx = Math.random() * 1024
    const ky = Math.random() * 1024
    const r = 6 + Math.random() * 10
    const grad = ctx.createRadialGradient(kx, ky, 0, kx, ky, r)
    grad.addColorStop(0, 'rgba(36,24,16,0.18)')
    grad.addColorStop(1, 'rgba(36,24,16,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(kx, ky, r, r * 0.6, Math.random() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }

  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = ClampToEdgeWrapping
  tex.repeat.set(1, 1)
  tex.anisotropy = 16
  tex.colorSpace = SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function createWallTexture() {
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = '#f1ebe3'
  ctx.fillRect(0, 0, 512, 512)
  for (let i = 0; i < 1200; i++) {
    const alpha = 0.012 + Math.random() * 0.02
    ctx.fillStyle = `rgba(90,78,64,${alpha})`
    ctx.beginPath()
    ctx.arc(Math.random() * 512, Math.random() * 512, 0.8 + Math.random() * 2, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new CanvasTexture(canvas)
  tex.wrapS = tex.wrapT = ClampToEdgeWrapping
  tex.repeat.set(1, 1)
  tex.needsUpdate = true
  return tex
}

function WallVisibilityController({ backWallRef, leftWallRef, rightWallRef, frontWallRef, cutawayTarget, isTourMode, roomDimensions }) {
  const { camera } = useThree()
  useFrame(() => {
    if (isTourMode) {
      if (backWallRef.current) backWallRef.current.visible = true
      if (leftWallRef.current) leftWallRef.current.visible = true
      if (rightWallRef.current) rightWallRef.current.visible = true
      if (frontWallRef.current) frontWallRef.current.visible = true
      return
    }

    const target = cutawayTarget ?? [0, roomDimensions.height * 0.36, 0]
    const offsetX = camera.position.x - target[0]
    const offsetZ = camera.position.z - target[2]
    const deadZoneX = Math.max(roomDimensions.width * 0.08, 0.28)
    const deadZoneZ = Math.max(roomDimensions.depth * 0.08, 0.28)

    if (backWallRef.current) backWallRef.current.visible = offsetZ >= -deadZoneZ
    if (leftWallRef.current) leftWallRef.current.visible = offsetX >= -deadZoneX
    if (rightWallRef.current) rightWallRef.current.visible = offsetX <= deadZoneX
    if (frontWallRef.current) frontWallRef.current.visible = false
  })
  return null
}

function TourCameraRig({ tourPose }) {
  const cameraRef = useRef(null)
  const previousCameraRef = useRef(null)
  const setThreeState = useThree((state) => state.set)
  const currentCamera = useThree((state) => state.camera)

  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.rotation.order = 'YXZ'
      previousCameraRef.current = currentCamera
      setThreeState({ camera: cameraRef.current })
    }

    return () => {
      if (previousCameraRef.current) {
        setThreeState({ camera: previousCameraRef.current })
      }
    }
  }, [currentCamera, setThreeState])

  useFrame(() => {
    if (!tourPose || !cameraRef.current) return
    const targetPosition = new Vector3(tourPose.x, tourPose.y, tourPose.z)
    const targetPitch = MathUtils.degToRad(tourPose.pitch ?? -3)
    const camera = cameraRef.current

    camera.position.lerp(targetPosition, 0.2)
    camera.rotation.x = MathUtils.lerp(camera.rotation.x, targetPitch, 0.18)
    camera.rotation.y = MathUtils.lerp(camera.rotation.y, tourPose.yaw ?? 0, 0.18)
    camera.rotation.z = 0
  })

  return <perspectiveCamera ref={cameraRef} position={[tourPose?.x ?? 0, tourPose?.y ?? 1.55, tourPose?.z ?? 0]} fov={56} near={0.08} />
}

function TourPointerControls({ enabled, onLook }) {
  const { gl } = useThree()
  const stateRef = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
  })

  useEffect(() => {
    if (!enabled || !onLook) return undefined
    const element = gl.domElement
    const state = stateRef.current

    const handlePointerDown = (event) => {
      if (event.button !== 0) return
      state.dragging = true
      state.lastX = event.clientX
      state.lastY = event.clientY
      element.setPointerCapture?.(event.pointerId)
    }

    const handlePointerMove = (event) => {
      if (!state.dragging) return
      const deltaX = event.clientX - state.lastX
      const deltaY = event.clientY - state.lastY
      state.lastX = event.clientX
      state.lastY = event.clientY
      onLook(-deltaX * 0.0032, -deltaY * 0.05)
    }

    const stopDrag = (event) => {
      state.dragging = false
      if (event?.pointerId !== undefined) element.releasePointerCapture?.(event.pointerId)
    }

    element.addEventListener('pointerdown', handlePointerDown)
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerup', stopDrag)
    element.addEventListener('pointercancel', stopDrag)
    element.addEventListener('pointerleave', stopDrag)

    return () => {
      state.dragging = false
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', stopDrag)
      element.removeEventListener('pointercancel', stopDrag)
      element.removeEventListener('pointerleave', stopDrag)
    }
  }, [enabled, gl, onLook])

  return null
}

// ??? Component ???????????????????????????????????????????????????????????????

function EditorOrbitControls({
  enabled,
  target,
  minDistance,
  maxDistance,
  minPolarAngle,
  maxPolarAngle,
}) {
  const stateRef = useRef({
    dragging: false,
    lastX: 0,
    lastY: 0,
    theta: 0,
    phi: 1,
    distance: 8,
    targetTheta: 0,
    targetPhi: 1,
    targetDistance: 8,
  })
  const { camera, gl } = useThree()

  useEffect(() => {
    const element = gl.domElement
    const state = stateRef.current

    const handlePointerDown = (event) => {
      if (!enabled) return
      state.dragging = true
      state.lastX = event.clientX
      state.lastY = event.clientY
      element.setPointerCapture?.(event.pointerId)
    }

    const handlePointerMove = (event) => {
      if (!state.dragging || !enabled) return
      const deltaX = event.clientX - state.lastX
      const deltaY = event.clientY - state.lastY
      state.lastX = event.clientX
      state.lastY = event.clientY
      state.targetTheta -= deltaX * 0.006
      state.targetPhi = Math.min(maxPolarAngle, Math.max(minPolarAngle, state.targetPhi + deltaY * 0.004))
    }

    const stopDrag = (event) => {
      state.dragging = false
      if (event?.pointerId !== undefined) element.releasePointerCapture?.(event.pointerId)
    }

    const handleWheel = (event) => {
      if (!enabled) return
      event.preventDefault()
      state.targetDistance = Math.min(maxDistance, Math.max(minDistance, state.targetDistance + event.deltaY * 0.01))
    }

    element.addEventListener('pointerdown', handlePointerDown)
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerup', stopDrag)
    element.addEventListener('pointercancel', stopDrag)
    element.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', stopDrag)
      element.removeEventListener('pointercancel', stopDrag)
      element.removeEventListener('wheel', handleWheel)
    }
  }, [enabled, gl, maxDistance, maxPolarAngle, minDistance, minPolarAngle])

  useEffect(() => {
    const state = stateRef.current
    const offsetX = camera.position.x - target.x
    const offsetY = camera.position.y - target.y
    const offsetZ = camera.position.z - target.z
    const distance = Math.min(maxDistance, Math.max(minDistance, Math.hypot(offsetX, offsetY, offsetZ)))
    const phi = Math.min(maxPolarAngle, Math.max(minPolarAngle, Math.acos(offsetY / Math.max(distance, 0.0001))))
    const theta = Math.atan2(offsetX, offsetZ)

    state.theta = theta
    state.phi = phi
    state.distance = distance
    state.targetTheta = theta
    state.targetPhi = phi
    state.targetDistance = distance
  }, [
    camera.position.x,
    camera.position.y,
    camera.position.z,
    maxDistance,
    maxPolarAngle,
    minDistance,
    minPolarAngle,
    target,
  ])

  useFrame(() => {
    if (!enabled) return
    const state = stateRef.current
    state.theta += (state.targetTheta - state.theta) * 0.14
    state.phi += (state.targetPhi - state.phi) * 0.14
    state.distance += (state.targetDistance - state.distance) * 0.14

    const sinPhi = Math.sin(state.phi)
    camera.position.set(
      target.x + state.distance * sinPhi * Math.sin(state.theta),
      target.y + state.distance * Math.cos(state.phi),
      target.z + state.distance * sinPhi * Math.cos(state.theta),
    )
    camera.lookAt(target)
  })

  return null
}

export default function Planner3DCanvas({
  roomDimensions,
  placedFurniture,
  selectedFurnitureId,
  furnitureCollisions,
  planElements,
  cameraPreset,
  cameraResetKey = 0,
  cameraMode = 'orbit',
  tourPose = null,
  onSelectFurniture,
  onMoveFurniture,
  onRotateFurniture,
  onLookTour,
  onStartDraggingFurniture,
  onEndDraggingFurniture,
  draggingFurnitureId,
  onCanvasReady,
}) {
  const interactionRef = useRef(null)
  const floorTexture = useMemo(() => createWoodFloorTexture(), [])
  const wallTexture = useMemo(() => createWallTexture(), [])
  const backWallRef = useRef(null)
  const leftWallRef = useRef(null)
  const rightWallRef = useRef(null)
  const frontWallRef = useRef(null)
  const furniturePlacements = useMemo(
    () => placedFurniture.map((item) => ({ item, placement: getFurniturePlacement3D(item, roomDimensions) })),
    [placedFurniture, roomDimensions],
  )

  const windowEnabled = planElements?.window?.enabled ?? true
  const windowSide = planElements?.window?.side ?? 'top'
  const windowOffset = planElements?.window?.offset ?? 58
  const doorEnabled = planElements?.door?.enabled ?? true
  const doorSide = planElements?.door?.side ?? 'left'
  const doorOffset = planElements?.door?.offset ?? 18
  const windowMesh = !windowEnabled ? null
    : windowSide === 'top' ? { position: [-roomDimensions.width / 2 + (windowOffset / 100) * roomDimensions.width, roomDimensions.height * 0.56, -roomDimensions.depth / 2 + 0.052], args: [roomDimensions.width * 0.28, roomDimensions.height * 0.3, 0.026] }
    : windowSide === 'bottom' ? { position: [-roomDimensions.width / 2 + (windowOffset / 100) * roomDimensions.width, roomDimensions.height * 0.56, roomDimensions.depth / 2 - 0.052], args: [roomDimensions.width * 0.28, roomDimensions.height * 0.3, 0.026] }
    : windowSide === 'left' ? { position: [-roomDimensions.width / 2 + 0.052, roomDimensions.height * 0.56, -roomDimensions.depth / 2 + (windowOffset / 100) * roomDimensions.depth], args: [0.026, roomDimensions.height * 0.3, roomDimensions.depth * 0.28] }
    : { position: [roomDimensions.width / 2 - 0.052, roomDimensions.height * 0.56, -roomDimensions.depth / 2 + (windowOffset / 100) * roomDimensions.depth], args: [0.026, roomDimensions.height * 0.3, roomDimensions.depth * 0.28] }

  const doorHeight = roomDimensions.height * 0.82
  const doorWidthHorizontal = roomDimensions.width * 0.11
  const doorWidthVertical = roomDimensions.depth * 0.11
  const doorMesh = !doorEnabled ? null
    : doorSide === 'top' ? { position: [-roomDimensions.width / 2 + (doorOffset / 100) * roomDimensions.width, doorHeight / 2, -roomDimensions.depth / 2 + 0.07], args: [doorWidthHorizontal, doorHeight, 0.04] }
    : doorSide === 'bottom' ? { position: [-roomDimensions.width / 2 + (doorOffset / 100) * roomDimensions.width, doorHeight / 2, roomDimensions.depth / 2 - 0.07], args: [doorWidthHorizontal, doorHeight, 0.04] }
    : doorSide === 'left' ? { position: [-roomDimensions.width / 2 + 0.07, doorHeight / 2, -roomDimensions.depth / 2 + (doorOffset / 100) * roomDimensions.depth], args: [0.04, doorHeight, doorWidthVertical] }
    : { position: [roomDimensions.width / 2 - 0.07, doorHeight / 2, -roomDimensions.depth / 2 + (doorOffset / 100) * roomDimensions.depth], args: [0.04, doorHeight, doorWidthVertical] }

  const windowFrameParts = windowMesh
    ? windowMesh.args[0] > windowMesh.args[2]
      ? [
          { position: [windowMesh.position[0], windowMesh.position[1] + windowMesh.args[1] / 2 + 0.04, windowMesh.position[2]], args: [windowMesh.args[0] + 0.08, 0.04, 0.06] },
          { position: [windowMesh.position[0], windowMesh.position[1] - windowMesh.args[1] / 2 - 0.04, windowMesh.position[2]], args: [windowMesh.args[0] + 0.08, 0.04, 0.06] },
          { position: [windowMesh.position[0] - windowMesh.args[0] / 2 - 0.03, windowMesh.position[1], windowMesh.position[2]], args: [0.04, windowMesh.args[1] + 0.12, 0.06] },
          { position: [windowMesh.position[0] + windowMesh.args[0] / 2 + 0.03, windowMesh.position[1], windowMesh.position[2]], args: [0.04, windowMesh.args[1] + 0.12, 0.06] },
        ]
      : [
          { position: [windowMesh.position[0], windowMesh.position[1] + windowMesh.args[1] / 2 + 0.04, windowMesh.position[2]], args: [0.06, 0.04, windowMesh.args[2] + 0.08] },
          { position: [windowMesh.position[0], windowMesh.position[1] - windowMesh.args[1] / 2 - 0.04, windowMesh.position[2]], args: [0.06, 0.04, windowMesh.args[2] + 0.08] },
          { position: [windowMesh.position[0], windowMesh.position[1], windowMesh.position[2] - windowMesh.args[2] / 2 - 0.03], args: [0.06, windowMesh.args[1] + 0.12, 0.04] },
          { position: [windowMesh.position[0], windowMesh.position[1], windowMesh.position[2] + windowMesh.args[2] / 2 + 0.03], args: [0.06, windowMesh.args[1] + 0.12, 0.04] },
        ]
    : []

  const doorFrameParts = doorMesh
    ? doorMesh.args[0] > doorMesh.args[2]
      ? [
          { position: [doorMesh.position[0], doorHeight + 0.03, doorMesh.position[2]], args: [doorMesh.args[0] + 0.08, 0.05, 0.05] },
          { position: [doorMesh.position[0] - doorMesh.args[0] / 2 - 0.026, doorHeight / 2, doorMesh.position[2]], args: [0.05, doorHeight + 0.06, 0.05] },
          { position: [doorMesh.position[0] + doorMesh.args[0] / 2 + 0.026, doorHeight / 2, doorMesh.position[2]], args: [0.05, doorHeight + 0.06, 0.05] },
        ]
      : [
          { position: [doorMesh.position[0], doorHeight + 0.03, doorMesh.position[2]], args: [0.05, 0.05, doorMesh.args[2] + 0.08] },
          { position: [doorMesh.position[0], doorHeight / 2, doorMesh.position[2] - doorMesh.args[2] / 2 - 0.026], args: [0.05, doorHeight + 0.06, 0.05] },
          { position: [doorMesh.position[0], doorHeight / 2, doorMesh.position[2] + doorMesh.args[2] / 2 + 0.026], args: [0.05, doorHeight + 0.06, 0.05] },
        ]
    : []

  const windowLight = windowMesh
    ? {
        position: windowMesh.args[0] > windowMesh.args[2]
          ? [windowMesh.position[0], windowMesh.position[1], windowSide === 'top' ? windowMesh.position[2] + 0.18 : windowMesh.position[2] - 0.18]
          : [windowSide === 'left' ? windowMesh.position[0] + 0.18 : windowMesh.position[0] - 0.18, windowMesh.position[1], windowMesh.position[2]],
        rotation: windowMesh.args[0] > windowMesh.args[2]
          ? [0, windowSide === 'top' ? 0 : Math.PI, 0]
          : [0, windowSide === 'left' ? Math.PI / 2 : -Math.PI / 2, 0],
        width: windowMesh.args[0] > windowMesh.args[2] ? windowMesh.args[0] * 0.9 : windowMesh.args[2] * 0.9,
        height: windowMesh.args[1] * 0.82,
      }
    : null

  const buildWallSegmentsWithOpening = (side) => {
    if (!windowEnabled || !windowMesh || windowSide !== side) return null

    if (side === 'top') {
      const leftEdge = windowMesh.position[0] - windowMesh.args[0] / 2
      const rightEdge = windowMesh.position[0] + windowMesh.args[0] / 2
      const bottomEdge = windowMesh.position[1] - windowMesh.args[1] / 2
      const topEdge = windowMesh.position[1] + windowMesh.args[1] / 2
      const wallLeft = -roomDimensions.width / 2
      const wallRight = roomDimensions.width / 2

      return [
        {
          key: 'top-wall-left',
          position: [(wallLeft + leftEdge) / 2, roomDimensions.height / 2, -roomDimensions.depth / 2 + 0.04],
          args: [Math.max(0.08, leftEdge - wallLeft), roomDimensions.height, 0.08],
        },
        {
          key: 'top-wall-right',
          position: [(rightEdge + wallRight) / 2, roomDimensions.height / 2, -roomDimensions.depth / 2 + 0.04],
          args: [Math.max(0.08, wallRight - rightEdge), roomDimensions.height, 0.08],
        },
        {
          key: 'top-wall-bottom',
          position: [windowMesh.position[0], bottomEdge / 2, -roomDimensions.depth / 2 + 0.04],
          args: [windowMesh.args[0], Math.max(0.08, bottomEdge), 0.08],
        },
        {
          key: 'top-wall-top',
          position: [windowMesh.position[0], topEdge + Math.max(0.08, (roomDimensions.height - topEdge) / 2), -roomDimensions.depth / 2 + 0.04],
          args: [windowMesh.args[0], Math.max(0.08, roomDimensions.height - topEdge), 0.08],
        },
      ]
    }

    const nearEdge = windowMesh.position[2] - windowMesh.args[2] / 2
    const farEdge = windowMesh.position[2] + windowMesh.args[2] / 2
    const bottomEdge = windowMesh.position[1] - windowMesh.args[1] / 2
    const topEdge = windowMesh.position[1] + windowMesh.args[1] / 2
    const wallNear = -roomDimensions.depth / 2
    const wallFar = roomDimensions.depth / 2
    const wallX = side === 'left' ? -roomDimensions.width / 2 + 0.04 : roomDimensions.width / 2 - 0.04

    return [
      {
        key: `${side}-wall-near`,
        position: [wallX, roomDimensions.height / 2, (wallNear + nearEdge) / 2],
        args: [0.08, roomDimensions.height, Math.max(0.08, nearEdge - wallNear)],
      },
      {
        key: `${side}-wall-far`,
        position: [wallX, roomDimensions.height / 2, (farEdge + wallFar) / 2],
        args: [0.08, roomDimensions.height, Math.max(0.08, wallFar - farEdge)],
      },
      {
        key: `${side}-wall-bottom`,
        position: [wallX, bottomEdge / 2, windowMesh.position[2]],
        args: [0.08, Math.max(0.08, bottomEdge), windowMesh.args[2]],
      },
      {
        key: `${side}-wall-top`,
        position: [wallX, topEdge + Math.max(0.08, (roomDimensions.height - topEdge) / 2), windowMesh.position[2]],
        args: [0.08, Math.max(0.08, roomDimensions.height - topEdge), windowMesh.args[2]],
      },
    ]
  }

  const backWallSegments = buildWallSegmentsWithOpening('top')
  const leftWallSegments = buildWallSegmentsWithOpening('left')
  const rightWallSegments = buildWallSegmentsWithOpening('right')

  const selectedFurniture3D = placedFurniture.find((item) => item.id === selectedFurnitureId) ?? null
  const cameraConfig = getCameraPresetConfig(cameraPreset, roomDimensions, placedFurniture)
  const isTourMode = cameraMode === 'tour'
  const orbitTarget = useMemo(() => new Vector3(...cameraConfig.target), [cameraConfig])
  const minPolar = 0.78
  const safeMinDist = Math.max(3.5, (Math.max(roomDimensions.width, roomDimensions.depth) / 2 / Math.sin(minPolar)) * 1.12)
  const selectedPlacement = selectedFurniture3D ? getFurniturePlacement3D(selectedFurniture3D, roomDimensions) : null
  const selectedCenter = selectedFurniture3D && selectedPlacement
    ? { ...selectedPlacement, radius: Math.max(selectedPlacement.width, selectedPlacement.depth) * 0.72, angle: -((selectedFurniture3D.rotation ?? 0) * Math.PI) / 180 }
    : null

  const handleFurniturePointerDown = (event, payload) => {
    onSelectFurniture(payload.id, payload.name)
    onStartDraggingFurniture(payload.id)
    interactionRef.current = {
      mode: 'move',
      id: payload.id,
      name: payload.name,
      offsetX: payload.x - event.point.x,
      offsetZ: payload.z - event.point.z,
      width: payload.width,
      depth: payload.depth,
      type: payload.type,
    }
  }

  const handleRotationPointerDown = (event) => {
    if (!selectedFurniture3D || !selectedCenter) return
    event.stopPropagation()
    onSelectFurniture(selectedFurniture3D.id, selectedFurniture3D.name)
    onStartDraggingFurniture(selectedFurniture3D.id)
    interactionRef.current = {
      mode: 'rotate',
      id: selectedFurniture3D.id,
      name: selectedFurniture3D.name,
      centerX: selectedCenter.x,
      centerZ: selectedCenter.z,
      startAngle: Math.atan2(event.point.z - selectedCenter.z, event.point.x - selectedCenter.x),
      startRotation: selectedFurniture3D.rotation ?? 0,
    }
  }

  const handleDragMove = (event) => {
    if (!interactionRef.current) return
    event.stopPropagation()
    if (interactionRef.current.mode === 'move') {
      if (interactionRef.current.type === 'wallMountedAc') {
        const nextCenterX = event.point.x + interactionRef.current.offsetX
        const nextX = ((nextCenterX - interactionRef.current.width / 2 + roomDimensions.width / 2) / roomDimensions.width) * 100
        onMoveFurniture(interactionRef.current.id, nextX, null)
        return
      }
      const nextCenterX = event.point.x + interactionRef.current.offsetX
      const nextCenterZ = event.point.z + interactionRef.current.offsetZ
      const nextX = ((nextCenterX - interactionRef.current.width / 2 + roomDimensions.width / 2) / roomDimensions.width) * 100
      const nextY = ((nextCenterZ - interactionRef.current.depth / 2 + roomDimensions.depth / 2) / roomDimensions.depth) * 100
      onMoveFurniture(interactionRef.current.id, nextX, nextY)
      return
    }
    const currentAngle = Math.atan2(event.point.z - interactionRef.current.centerZ, event.point.x - interactionRef.current.centerX)
    const deltaDeg = -((currentAngle - interactionRef.current.startAngle) * 180) / Math.PI
    const nextRot = (((interactionRef.current.startRotation + deltaDeg) % 360) + 360) % 360
    onRotateFurniture(interactionRef.current.id, nextRot)
  }

  const handleDragEnd = () => {
    if (!interactionRef.current) return
    onEndDraggingFurniture(interactionRef.current.id, interactionRef.current.name, interactionRef.current.mode === 'rotate' ? '회전' : '이동')
    interactionRef.current = null
  }

  return (
    <Canvas
      key={isTourMode ? 'tour' : `${cameraConfig.key}-${cameraResetKey}`}
      shadows
      dpr={[1, 1.5]}
      gl={{ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance', toneMapping: ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      style={{ width: '100%', height: '100%', display: 'block' }}
      camera={{ position: isTourMode && tourPose ? [tourPose.x, tourPose.y, tourPose.z] : cameraConfig.position, fov: isTourMode ? 56 : cameraConfig.fov }}
      onCreated={({ gl }) => {
        gl.setClearColor('#d9e5f2')
        onCanvasReady?.(gl)
      }}
    >
      {isTourMode ? <TourCameraRig tourPose={tourPose} /> : null}
      {isTourMode ? <TourPointerControls enabled={isTourMode} onLook={onLookTour} /> : null}
      <WallVisibilityController
        roomDimensions={roomDimensions}
        backWallRef={backWallRef}
        leftWallRef={leftWallRef}
        rightWallRef={rightWallRef}
        frontWallRef={frontWallRef}
        cutawayTarget={cameraConfig.target}
        isTourMode={isTourMode}
      />
      {!isTourMode ? <fog attach="fog" args={['#161b20', 10, 30]} /> : null}
      <hemisphereLight skyColor="#edf1f5" groundColor="#262320" intensity={0.28} />

      <ambientLight intensity={0.36} color="#f2f3f2" />
      {/* Primary directional light to create deeper volume */}
      <directionalLight
        position={[6, 12, 8]}
        intensity={1.15}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0004}
        color="#f3f2ef"
      />
      {/* Side fill light to keep the room grounded without going blue */}
      <directionalLight position={[-4, 4, -2]} intensity={0.18} color="#eceae5" />
      {/* Overhead neutral fill */}
      <pointLight position={[0, roomDimensions.height + 1.1, 0]} intensity={0.32} color="#f1f2f4" distance={12} decay={2} />
      {/* Window bounce tied to the actual window, not a fixed wall patch */}
      {windowLight ? (
        <rectAreaLight
          position={windowLight.position}
          width={windowLight.width}
          height={windowLight.height}
          intensity={0.88}
          color="#eef3f8"
          rotation={windowLight.rotation}
        />
      ) : null}
      {/* Focused detail light to highlight 모델 아웃라인 */}
      <spotLight
        position={[roomDimensions.width * 0.55, roomDimensions.height * 1.2, roomDimensions.depth * 0.45]}
        angle={0.42}
        penumbra={0.38}
        intensity={0.48}
        distance={20}
        decay={2}
        color="#e4e2dd"
      />

      <group>
        {/* Invisible drag plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]} onPointerMove={handleDragMove} onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd} onPointerLeave={handleDragEnd}>
          <planeGeometry args={[roomDimensions.width * 1.8, roomDimensions.depth * 1.8]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>

        {/* Floor area outside room - deep slate finish */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
          <planeGeometry args={[roomDimensions.width * 2.8, roomDimensions.depth * 2.8]} />
          <meshStandardMaterial color="#5c605f" roughness={0.96} metalness={0.02} envMapIntensity={0.08} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>

        {/* Floor - warm smoked wood */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[roomDimensions.width, roomDimensions.depth]} />
          <meshStandardMaterial
            color="#8a8178"
            map={floorTexture}
            roughness={0.72}
            metalness={0.05}
            envMapIntensity={0.32}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>

        {/* Walls - neutral warm plaster with darker accent side */}
        <group ref={leftWallRef}>
          {(leftWallSegments ?? [{
            key: 'left-wall-full',
            position: [-roomDimensions.width / 2 + 0.04, roomDimensions.height / 2, 0],
            args: [0.08, roomDimensions.height, roomDimensions.depth],
          }]).map((segment) => (
            <mesh key={segment.key} position={segment.position} receiveShadow castShadow>
              <boxGeometry args={segment.args} />
              <meshStandardMaterial color="#f1ebe3" map={wallTexture} roughness={0.98} envMapIntensity={0.06} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
            </mesh>
          ))}
        </group>
        <group ref={rightWallRef}>
          {(rightWallSegments ?? [{
            key: 'right-wall-full',
            position: [roomDimensions.width / 2 - 0.04, roomDimensions.height / 2, 0],
            args: [0.08, roomDimensions.height, roomDimensions.depth],
          }]).map((segment) => (
            <mesh key={segment.key} position={segment.position} receiveShadow castShadow>
              <boxGeometry args={segment.args} />
              <meshStandardMaterial color="#f1ebe3" map={wallTexture} roughness={0.98} envMapIntensity={0.06} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
            </mesh>
          ))}
        </group>
        <group ref={backWallRef}>
          {(backWallSegments ?? [{
            key: 'back-wall-full',
            position: [0, roomDimensions.height / 2, -roomDimensions.depth / 2 + 0.04],
            args: [roomDimensions.width, roomDimensions.height, 0.08],
          }]).map((segment) => (
            <mesh key={segment.key} position={segment.position} receiveShadow castShadow>
              <boxGeometry args={segment.args} />
              <meshStandardMaterial color="#f1ebe3" map={wallTexture} roughness={0.98} envMapIntensity={0.06} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
            </mesh>
          ))}
        </group>
        <group ref={frontWallRef}>
          {isTourMode ? (
            <mesh position={[0, roomDimensions.height / 2, roomDimensions.depth / 2 - 0.04]} receiveShadow castShadow>
              <boxGeometry args={[roomDimensions.width, roomDimensions.height, 0.08]} />
              <meshStandardMaterial color="#f1ebe3" map={wallTexture} roughness={0.98} envMapIntensity={0.06} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
            </mesh>
          ) : null}
        </group>

        {/* Baseboards */}
        <mesh position={[0, 0.06, -roomDimensions.depth / 2 + 0.086]} receiveShadow>
          <boxGeometry args={[roomDimensions.width, 0.08, 0.028]} />
          <meshStandardMaterial color="#e9e1d6" roughness={0.94} />
        </mesh>
        <mesh position={[-roomDimensions.width / 2 + 0.086, 0.06, 0]} receiveShadow>
          <boxGeometry args={[0.028, 0.08, roomDimensions.depth]} />
          <meshStandardMaterial color="#474038" roughness={0.94} />
        </mesh>
        <mesh position={[roomDimensions.width / 2 - 0.086, 0.06, 0]} receiveShadow>
          <boxGeometry args={[0.028, 0.08, roomDimensions.depth]} />
          <meshStandardMaterial color="#e9e1d6" roughness={0.94} />
        </mesh>

        {/* Ceiling hint ??subtle, slightly off-white */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, roomDimensions.height - 0.02, 0]}>
          <planeGeometry args={[roomDimensions.width, roomDimensions.depth]} />
          <meshStandardMaterial color="#f5f0e8" side={BackSide} roughness={1} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>

        {/* Window ??glass + frame */}
        {windowMesh ? (
          <>
            <mesh position={windowMesh.position}>
              <boxGeometry args={windowMesh.args} />
              <meshPhysicalMaterial
                color={isTourMode ? '#f8fbff' : '#eef5fb'}
                transparent
                opacity={isTourMode ? 0.03 : 0.08}
                roughness={isTourMode ? 0.1 : 0.06}
                metalness={0.02}
                transmission={0.9}
                thickness={0.04}
                envMapIntensity={0.28}
              />
            </mesh>
            {windowFrameParts.map((part, index) => (
              <mesh key={`window-frame-${index}`} position={part.position}>
                <boxGeometry args={part.args} />
                <meshStandardMaterial color="#f1ece5" roughness={0.9} />
              </mesh>
            ))}
            {windowMesh.args[0] > windowMesh.args[2] ? (
              <mesh position={[windowMesh.position[0], windowMesh.position[1], windowMesh.position[2] + 0.016]}>
                <boxGeometry args={[windowMesh.args[0] * 0.02, windowMesh.args[1] + 0.02, 0.03]} />
                <meshStandardMaterial color="#ece5db" roughness={0.9} />
              </mesh>
            ) : (
              <mesh position={[windowMesh.position[0] + 0.016, windowMesh.position[1], windowMesh.position[2]]}>
                <boxGeometry args={[0.03, windowMesh.args[1] + 0.02, windowMesh.args[2] * 0.02]} />
                <meshStandardMaterial color="#ece5db" roughness={0.9} />
              </mesh>
            )}
          </>
        ) : null}

        {/* Door */}
        {doorMesh ? (
          <>
            <mesh position={doorMesh.position}>
              <boxGeometry args={doorMesh.args} />
              <meshStandardMaterial color="#5d5348" roughness={0.72} metalness={0.02} envMapIntensity={0.18} />
            </mesh>
            {doorFrameParts.map((part, index) => (
              <mesh key={`door-frame-${index}`} position={part.position}>
                <boxGeometry args={part.args} />
                <meshStandardMaterial color="#f1ece5" roughness={0.9} />
              </mesh>
            ))}
            {doorMesh.args[0] > doorMesh.args[2] ? (
              <mesh position={[doorMesh.position[0] + doorMesh.args[0] * 0.28, doorMesh.position[1], doorMesh.position[2] + 0.026]}>
                <cylinderGeometry args={[0.012, 0.012, doorHeight * 0.14, 14]} />
                <meshStandardMaterial color="#d1c5b7" metalness={0.18} roughness={0.52} envMapIntensity={0.26} />
              </mesh>
            ) : (
              <mesh position={[doorMesh.position[0] + 0.026, doorMesh.position[1], doorMesh.position[2] + doorMesh.args[2] * 0.28]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.012, 0.012, doorHeight * 0.14, 14]} />
                <meshStandardMaterial color="#d1c5b7" metalness={0.18} roughness={0.52} envMapIntensity={0.26} />
              </mesh>
            )}
          </>
        ) : null}

        <Suspense fallback={null}>
          {placedFurniture.map((item) => (
            <FurniturePreview3D
              key={item.id}
              item={item}
              furniturePlacements={furniturePlacements}
              roomDimensions={roomDimensions}
              isSelected={item.id === selectedFurnitureId}
              isCollision={furnitureCollisions.has(item.id)}
              isDragging={draggingFurnitureId === item.id}
              onSelect={isTourMode ? undefined : () => onSelectFurniture(item.id, item.name)}
              onPointerDown={isTourMode ? undefined : handleFurniturePointerDown}
            />
          ))}
        </Suspense>

        {/* Selected furniture rotation handle */}
        {selectedCenter && !isTourMode ? (
          <group>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[selectedCenter.x, 0.024, selectedCenter.z]}>
              <torusGeometry args={[selectedCenter.radius, 0.024, 14, 72]} />
              <meshStandardMaterial color="#d8d0c4" transparent opacity={0.58} envMapIntensity={0.3} />
            </mesh>
            <mesh
              position={[
                selectedCenter.x + Math.cos(selectedCenter.angle) * selectedCenter.radius,
                0.12,
                selectedCenter.z + Math.sin(selectedCenter.angle) * selectedCenter.radius,
              ]}
              onPointerDown={handleRotationPointerDown}
            >
              <sphereGeometry args={[0.09, 24, 24]} />
              <meshStandardMaterial color="#f3eee7" emissive="#bca48d" emissiveIntensity={0.06} envMapIntensity={0.4} />
            </mesh>
          </group>
        ) : null}
      </group>

      <EditorOrbitControls
        enabled={!draggingFurnitureId && !isTourMode}
        minDistance={safeMinDist}
        maxDistance={Math.max(14, safeMinDist * 3)}
        minPolarAngle={minPolar}
        maxPolarAngle={1.38}
        target={orbitTarget}
      />
    </Canvas>
  )
}
