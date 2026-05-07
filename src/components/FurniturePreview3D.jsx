import { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { BackSide, DoubleSide, MathUtils } from 'three'
import { getFurniturePlacement3D } from '../data/furniture.js'
import { getFurniturePalette } from '../data/catalogItems.js'

function RoundedBox({ args, children, ...props }) {
  return (
    <mesh {...props}>
      <boxGeometry args={args} />
      {children}
    </mesh>
  )
}

function SmoothFurnitureGroup({ position, rotationY, onClick, onPointerDown, isDragging = false, children }) {
  const groupRef = useRef(null)

  useEffect(() => {
    if (!groupRef.current) return
    if (!isDragging) return
    groupRef.current.position.set(position[0], position[1], position[2])
    groupRef.current.rotation.y = rotationY
  }, [isDragging, position, rotationY])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    if (isDragging) {
      groupRef.current.position.set(position[0], position[1], position[2])
      groupRef.current.rotation.y = rotationY
      return
    }
    const smoothing = 1 - Math.exp(-delta * 16)
    groupRef.current.position.x = MathUtils.lerp(groupRef.current.position.x, position[0], smoothing)
    groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, position[1], smoothing)
    groupRef.current.position.z = MathUtils.lerp(groupRef.current.position.z, position[2], smoothing)
    groupRef.current.rotation.y = MathUtils.lerp(groupRef.current.rotation.y, rotationY, smoothing)
  })

  return (
    <group ref={groupRef} position={position} rotation={[0, rotationY, 0]} onClick={onClick} onPointerDown={onPointerDown}>
      {children}
    </group>
  )
}

function SelectionRing({ radius, color, opacity = 0.52 }) {
  return (
    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius * 0.88, radius, 48]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} side={DoubleSide} />
    </mesh>
  )
}

const SUPPORT_SURFACE_TYPES = {
  computer: ['desk'],
  monitorArm: ['desk'],
  laptop: ['desk', 'table'],
  speaker: ['desk', 'table', 'sideTable', 'bedside'],
  microwave: ['microwaveStand', 'dresser', 'trolley', 'table'],
  riceCooker: ['microwaveStand', 'trolley', 'table'],
  coffeeMachine: ['microwaveStand', 'trolley', 'table'],
  makeupOrganizer: ['vanity', 'dresser', 'bedside', 'sideTable'],
  tableLamp: ['desk', 'bedside', 'sideTable', 'table'],
}

function hasSupportOverlap(itemPlacement, supportPlacement) {
  const itemHalfWidth = itemPlacement.width / 2
  const itemHalfDepth = itemPlacement.depth / 2
  const supportHalfWidth = supportPlacement.width / 2
  const supportHalfDepth = supportPlacement.depth / 2
  const tolerance = 0.08

  return (
    Math.abs(itemPlacement.x - supportPlacement.x) <= supportHalfWidth + itemHalfWidth * 0.35 + tolerance
    && Math.abs(itemPlacement.z - supportPlacement.z) <= supportHalfDepth + itemHalfDepth * 0.35 + tolerance
  )
}

export default function FurniturePreview3D({
  item,
  furniturePlacements = [],
  roomDimensions,
  isSelected,
  isCollision,
  isDragging = false,
  onSelect,
  onPointerDown,
}) {
  const placement = useMemo(() => getFurniturePlacement3D(item, roomDimensions), [item, roomDimensions])
  const { width, depth, height, x, z } = placement
  const rotationY = -((item.rotation ?? 0) * Math.PI) / 180
  const palette = getFurniturePalette(item)
  const accentColor = isCollision ? '#c96e5f' : isSelected ? '#d8cec1' : '#cfc4b6'
  const frameColor = palette.accentColor ?? '#6d6256'
  const upholsteryColor = palette.fabricColor ?? '#dad0c4'
  const shellColor = palette.shellColor ?? '#4a433c'
  const warmMetal = '#b9aa98'
  const supportSurface = useMemo(() => {
    if (!SUPPORT_SURFACE_TYPES[item.type]) return null

    return furniturePlacements
      .filter(({ item: candidate }) => candidate.id !== item.id && SUPPORT_SURFACE_TYPES[item.type].includes(candidate.type))
      .filter(({ placement: candidatePlacement }) => hasSupportOverlap(placement, candidatePlacement))
      .sort((a, b) => {
        const da = Math.hypot(a.placement.x - x, a.placement.z - z)
        const db = Math.hypot(b.placement.x - x, b.placement.z - z)
        return da - db
      })[0] ?? null
  }, [furniturePlacements, item.id, item.type, placement, x, z])
  const baseY = supportSurface ? supportSurface.placement.height * 0.92 + 0.02 : 0
  const isWallMounted = ['poster', 'wallClock', 'wallShelf', 'wallMountedAc'].includes(item.type)
  const distanceToWalls = {
    left: Math.abs(x + roomDimensions.width / 2),
    right: Math.abs(roomDimensions.width / 2 - x),
    back: Math.abs(z + roomDimensions.depth / 2),
    front: Math.abs(roomDimensions.depth / 2 - z),
  }
  const nearestWall = Object.entries(distanceToWalls).sort((a, b) => a[1] - b[1])[0]?.[0] ?? 'back'
  const wallMountHeight = item.type === 'wallClock'
    ? roomDimensions.height * 0.66
    : item.type === 'wallMountedAc'
      ? roomDimensions.height * 0.78
      : roomDimensions.height * 0.56
  const wallMountedPose = !isWallMounted
    ? null
    : item.type === 'wallMountedAc'
      ? { position: [x, wallMountHeight, -roomDimensions.depth / 2 + 0.05], rotationY: 0 }
    : nearestWall === 'left'
      ? { position: [-roomDimensions.width / 2 + 0.05, wallMountHeight, z], rotationY: Math.PI / 2 }
      : nearestWall === 'right'
        ? { position: [roomDimensions.width / 2 - 0.05, wallMountHeight, z], rotationY: -Math.PI / 2 }
        : nearestWall === 'front'
          ? { position: [x, wallMountHeight, roomDimensions.depth / 2 - 0.05], rotationY: Math.PI }
          : { position: [x, wallMountHeight, -roomDimensions.depth / 2 + 0.05], rotationY: 0 }

  const handlePointerDown = (event) => {
    event.stopPropagation()
    onPointerDown?.(event, { id: item.id, name: item.name, type: item.type, x, z, width, depth })
  }

  const rootPosition = wallMountedPose ? wallMountedPose.position : [x, baseY, z]
  const rootRotation = wallMountedPose ? wallMountedPose.rotationY : rotationY
  const ringRadius = Math.max(width, depth) * 0.56

  if (item.type === 'lamp') {
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.22, 0.04, 32]} />
          <meshStandardMaterial color={frameColor} roughness={0.62} metalness={0.12} envMapIntensity={0.4} />
        </mesh>
        <mesh position={[0, height * 0.38, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.03, height * 0.72, 16]} />
          <meshStandardMaterial color={frameColor} roughness={0.56} metalness={0.18} envMapIntensity={0.5} />
        </mesh>
        <mesh position={[0, height * 0.74, 0]} castShadow>
          <cylinderGeometry args={[width * 0.4, width * 0.48, height * 0.2, 32]} />
          <meshStandardMaterial color="#e6ddd2" roughness={0.96} envMapIntensity={0.12} />
        </mesh>
        <mesh position={[0, height * 0.74, 0]}>
          <cylinderGeometry args={[width * 0.28, width * 0.4, height * 0.16, 32, 1, true]} />
          <meshStandardMaterial color="#fff8ef" emissive="#ead7b5" emissiveIntensity={0.22} side={BackSide} roughness={1} />
        </mesh>
        <pointLight position={[0, height * 0.72, 0]} intensity={0.18} color="#ffe8b0" distance={2.5} decay={2} />
      </SmoothFurnitureGroup>
    )
  }

  if (item.type === 'table') {
    const r = Math.min(width, depth) * 0.48
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        <mesh position={[0, height * 0.9, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[r, r * 1.02, 0.06, 48]} />
          <meshStandardMaterial color={shellColor} roughness={0.58} metalness={0.02} envMapIntensity={0.22} />
        </mesh>
        <mesh position={[0, height * 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, height * 0.82, 20]} />
          <meshStandardMaterial color={frameColor} roughness={0.56} metalness={0.08} envMapIntensity={0.22} />
        </mesh>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.18, 0.2, 0.1, 24]} />
          <meshStandardMaterial color={frameColor} roughness={0.62} metalness={0.05} envMapIntensity={0.18} />
        </mesh>
        <SelectionRing radius={ringRadius} color={accentColor} />
      </SmoothFurnitureGroup>
    )
  }

  if (item.type === 'desk') {
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        <RoundedBox args={[width, 0.06, depth]} radius={0.02} smoothness={4} position={[0, height * 0.92, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={shellColor} roughness={0.58} metalness={0.02} envMapIntensity={0.24} />
        </RoundedBox>
        {[[-width * 0.42, height * 0.42, -depth * 0.38], [width * 0.42, height * 0.42, -depth * 0.38], [-width * 0.42, height * 0.42, depth * 0.38], [width * 0.42, height * 0.42, depth * 0.38]].map((leg, index) => (
          <mesh key={`desk-leg-${index}`} position={leg} castShadow>
            <boxGeometry args={[0.05, height * 0.84, 0.05]} />
            <meshStandardMaterial color={warmMetal} roughness={0.66} metalness={0.16} envMapIntensity={0.26} />
          </mesh>
        ))}
        <RoundedBox args={[width * 0.22, height * 0.58, depth * 0.38]} radius={0.02} smoothness={4} position={[-width * 0.28, height * 0.36, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={frameColor} roughness={0.84} envMapIntensity={0.14} />
        </RoundedBox>
        <SelectionRing radius={ringRadius} color={accentColor} />
      </SmoothFurnitureGroup>
    )
  }

  if (item.type === 'rug') {
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        <RoundedBox args={[width, 0.014, depth]} radius={0.03} smoothness={4} position={[0, 0.01, 0]} receiveShadow>
          <meshStandardMaterial color={upholsteryColor} roughness={0.98} envMapIntensity={0.06} />
        </RoundedBox>
        <RoundedBox args={[width * 0.82, 0.016, depth * 0.72]} radius={0.02} smoothness={4} position={[0, 0.012, 0]} receiveShadow>
          <meshStandardMaterial color="#d9cec0" roughness={0.98} envMapIntensity={0.04} />
        </RoundedBox>
        <SelectionRing radius={ringRadius} color={accentColor} opacity={0.34} />
      </SmoothFurnitureGroup>
    )
  }

  if (item.type === 'tv') {
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        <RoundedBox args={[width * 0.84, height * 0.36, depth * 0.04]} radius={0.016} smoothness={4} position={[0, height * 0.82, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#f6f3ee" roughness={0.36} metalness={0.08} envMapIntensity={0.3} />
        </RoundedBox>
        <RoundedBox args={[width * 0.78, height * 0.3, depth * 0.018]} radius={0.012} smoothness={4} position={[0, height * 0.82, depth * 0.012]} castShadow>
          <meshStandardMaterial color="#14181c" emissive="#0d1014" emissiveIntensity={0.06} roughness={0.14} metalness={0.16} envMapIntensity={0.38} />
        </RoundedBox>
        <RoundedBox args={[width * 0.16, height * 0.1, 0.04]} radius={0.012} smoothness={4} position={[0, height * 0.72, -depth * 0.04]} castShadow receiveShadow>
          <meshStandardMaterial color="#f2eee8" roughness={0.5} metalness={0.08} envMapIntensity={0.24} />
        </RoundedBox>
        <mesh position={[0, height * 0.37, 0]} castShadow>
          <cylinderGeometry args={[0.042, 0.052, height * 0.6, 28]} />
          <meshStandardMaterial color="#f3efe9" roughness={0.42} metalness={0.1} envMapIntensity={0.24} />
        </mesh>
        <mesh position={[0, height * 0.04, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[width * 0.24, width * 0.24, 0.04, 56]} />
          <meshStandardMaterial color="#f5f1eb" roughness={0.48} metalness={0.08} envMapIntensity={0.24} />
        </mesh>
        {[[-width * 0.16, height * 0.015, -depth * 0.18], [width * 0.16, height * 0.015, -depth * 0.18], [-width * 0.16, height * 0.015, depth * 0.18], [width * 0.16, height * 0.015, depth * 0.18]].map((wheel, index) => (
          <mesh key={`tv-wheel-${index}`} position={wheel} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 0.024, 14]} />
            <meshStandardMaterial color="#292e33" roughness={0.56} metalness={0.16} envMapIntensity={0.18} />
          </mesh>
        ))}
        <SelectionRing radius={ringRadius} color={accentColor} />
      </SmoothFurnitureGroup>
    )
  }

  if (item.type === 'sofa') {
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        <RoundedBox args={[width, height * 0.3, depth * 0.9]} radius={0.045} smoothness={4} position={[0, height * 0.18, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={shellColor} roughness={0.98} envMapIntensity={0.08} />
        </RoundedBox>
        <RoundedBox args={[width * 0.88, height * 0.28, depth * 0.14]} radius={0.035} smoothness={4} position={[0, height * 0.6, -depth * 0.31]} castShadow receiveShadow>
          <meshStandardMaterial color={shellColor} roughness={0.98} envMapIntensity={0.06} />
        </RoundedBox>
        <RoundedBox args={[width * 0.09, height * 0.32, depth * 0.86]} radius={0.035} smoothness={4} position={[-width * 0.455, height * 0.25, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={shellColor} roughness={0.98} envMapIntensity={0.06} />
        </RoundedBox>
        <RoundedBox args={[width * 0.09, height * 0.32, depth * 0.86]} radius={0.035} smoothness={4} position={[width * 0.455, height * 0.25, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={shellColor} roughness={0.98} envMapIntensity={0.06} />
        </RoundedBox>
        <RoundedBox args={[width * 0.74, height * 0.1, depth * 0.5]} radius={0.028} smoothness={4} position={[0, height * 0.34, 0.02]} castShadow receiveShadow>
          <meshStandardMaterial color={upholsteryColor} roughness={0.94} envMapIntensity={0.12} />
        </RoundedBox>
        <RoundedBox args={[width * 0.28, height * 0.14, depth * 0.4]} radius={0.032} smoothness={4} position={[-width * 0.18, height * 0.46, 0.02]} castShadow receiveShadow>
          <meshStandardMaterial color={upholsteryColor} roughness={0.92} envMapIntensity={0.1} />
        </RoundedBox>
        <RoundedBox args={[width * 0.28, height * 0.14, depth * 0.4]} radius={0.032} smoothness={4} position={[width * 0.18, height * 0.46, 0.02]} castShadow receiveShadow>
          <meshStandardMaterial color={upholsteryColor} roughness={0.92} envMapIntensity={0.1} />
        </RoundedBox>
        <SelectionRing radius={ringRadius} color={accentColor} />
      </SmoothFurnitureGroup>
    )
  }

  if (item.type === 'chair') {
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        <RoundedBox args={[width * 0.72, height * 0.12, depth * 0.58]} radius={0.032} smoothness={4} position={[0, height * 0.4, 0.04]} castShadow receiveShadow>
          <meshStandardMaterial color={upholsteryColor} roughness={0.9} envMapIntensity={0.12} />
        </RoundedBox>
        <RoundedBox args={[width * 0.72, height * 0.3, depth * 0.14]} radius={0.032} smoothness={4} position={[0, height * 0.74, -depth * 0.18]} castShadow receiveShadow>
          <meshStandardMaterial color={shellColor} roughness={0.94} envMapIntensity={0.08} />
        </RoundedBox>
        {[[-width * 0.28, -depth * 0.18], [width * 0.28, -depth * 0.18], [-width * 0.28, depth * 0.24], [width * 0.28, depth * 0.24]].map(([legX, legZ], index) => (
          <mesh key={`chair-leg-${index}`} position={[legX, height * 0.2, legZ]} castShadow>
            <boxGeometry args={[0.035, height * 0.4, 0.035]} />
            <meshStandardMaterial color={frameColor} roughness={0.68} metalness={0.08} envMapIntensity={0.18} />
          </mesh>
        ))}
        <SelectionRing radius={ringRadius} color={accentColor} />
      </SmoothFurnitureGroup>
    )
  }

  if (item.type === 'computer') {
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        <RoundedBox args={[width * 0.54, height * 0.48, depth * 0.14]} radius={0.018} smoothness={4} position={[0, height * 0.32, -depth * 0.06]} castShadow receiveShadow>
          <meshStandardMaterial color={shellColor} roughness={0.38} metalness={0.18} envMapIntensity={0.42} />
        </RoundedBox>
        <RoundedBox args={[width * 0.48, height * 0.38, depth * 0.035]} radius={0.016} smoothness={4} position={[0, height * 0.32, -depth * 0.05]} castShadow>
          <meshStandardMaterial color="#101417" roughness={0.16} metalness={0.26} envMapIntensity={0.46} />
        </RoundedBox>
        <mesh position={[0, height * 0.16, -depth * 0.06]} castShadow>
          <boxGeometry args={[0.034, height * 0.18, 0.028]} />
          <meshStandardMaterial color={warmMetal} roughness={0.52} metalness={0.2} envMapIntensity={0.3} />
        </mesh>
        <mesh position={[0, height * 0.08, -depth * 0.06]} castShadow receiveShadow>
          <boxGeometry args={[width * 0.22, 0.018, depth * 0.1]} />
          <meshStandardMaterial color={warmMetal} roughness={0.52} metalness={0.18} envMapIntensity={0.3} />
        </mesh>
        <RoundedBox args={[width * 0.34, 0.026, depth * 0.12]} radius={0.012} smoothness={3} position={[0, 0.02, depth * 0.14]} castShadow receiveShadow>
          <meshStandardMaterial color="#d7dce2" roughness={0.74} metalness={0.08} envMapIntensity={0.18} />
        </RoundedBox>
        <RoundedBox args={[width * 0.18, height * 0.5, depth * 0.18]} radius={0.018} smoothness={4} position={[width * 0.34, height * 0.16, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#515761" roughness={0.38} metalness={0.2} envMapIntensity={0.34} />
        </RoundedBox>
        <SelectionRing radius={ringRadius * 0.9} color={accentColor} />
      </SmoothFurnitureGroup>
    )
  }

  if (item.type === 'bed') {
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        <RoundedBox args={[width * 0.98, height * 0.16, depth * 0.94]} radius={0.03} smoothness={5} position={[0, height * 0.12, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={shellColor} roughness={0.84} envMapIntensity={0.14} />
        </RoundedBox>
        <RoundedBox args={[width * 0.9, height * 0.1, depth * 0.76]} radius={0.035} smoothness={5} position={[0, height * 0.27, 0.08]} castShadow receiveShadow>
          <meshStandardMaterial color="#f4f0e8" roughness={0.82} envMapIntensity={0.16} />
        </RoundedBox>
        <RoundedBox args={[width * 0.94, height * 0.5, depth * 0.075]} radius={0.028} smoothness={5} position={[0, height * 0.5, -depth * 0.43]} castShadow receiveShadow>
          <meshStandardMaterial color={shellColor} roughness={0.88} envMapIntensity={0.1} />
        </RoundedBox>
        {[-0.24, 0.24].map((xOffset) => (
          <RoundedBox key={`bed-pillow-${xOffset}`} args={[width * 0.28, height * 0.08, depth * 0.2]} radius={0.035} smoothness={5} position={[width * xOffset, height * 0.36, -depth * 0.23]} castShadow receiveShadow>
            <meshStandardMaterial color="#fffaf2" roughness={0.88} envMapIntensity={0.12} />
          </RoundedBox>
        ))}
        <RoundedBox args={[width * 0.82, height * 0.075, depth * 0.34]} radius={0.028} smoothness={5} position={[0, height * 0.38, depth * 0.2]} castShadow receiveShadow>
          <meshStandardMaterial color={upholsteryColor} roughness={0.9} envMapIntensity={0.1} />
        </RoundedBox>
        <mesh position={[0, height * 0.425, depth * 0.02]} castShadow receiveShadow>
          <boxGeometry args={[width * 0.78, 0.012, depth * 0.012]} />
          <meshStandardMaterial color="#d8cfc1" roughness={0.78} envMapIntensity={0.12} />
        </mesh>
        {[
          [-width * 0.42, height * 0.08, -depth * 0.33],
          [width * 0.42, height * 0.08, -depth * 0.33],
          [-width * 0.42, height * 0.08, depth * 0.36],
          [width * 0.42, height * 0.08, depth * 0.36],
        ].map((leg, index) => (
          <mesh key={`bed-leg-${index}`} position={leg} castShadow receiveShadow>
            <boxGeometry args={[0.04, height * 0.14, 0.04]} />
            <meshStandardMaterial color={warmMetal} roughness={0.62} metalness={0.12} envMapIntensity={0.18} />
          </mesh>
        ))}
        <SelectionRing radius={ringRadius} color={accentColor} />
      </SmoothFurnitureGroup>
    )
  }

  if (item.type === 'wardrobe' || item.type === 'bookcase' || item.type === 'storage' || item.type === 'dresser' || item.type === 'bedside' || item.type === 'vanity' || item.type === 'fridge' || item.type === 'microwave') {
    const bodyHeight = item.type === 'microwave' ? height : height * 0.94
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        <RoundedBox args={[width, bodyHeight, depth * 0.94]} radius={0.028} smoothness={4} position={[0, bodyHeight * 0.5, 0]} castShadow receiveShadow>
          <meshStandardMaterial color={item.type === 'fridge' ? upholsteryColor : shellColor} roughness={0.58} metalness={item.type === 'fridge' ? 0.08 : 0.04} envMapIntensity={0.24} />
        </RoundedBox>
        {item.type === 'fridge' ? (
          <>
            <RoundedBox args={[width * 0.9, bodyHeight * 0.34, 0.028]} radius={0.018} smoothness={4} position={[0, bodyHeight * 0.77, depth * 0.485]} castShadow receiveShadow>
              <meshStandardMaterial color="#f7f8f8" roughness={0.5} metalness={0.06} envMapIntensity={0.28} />
            </RoundedBox>
            <RoundedBox args={[width * 0.9, bodyHeight * 0.5, 0.028]} radius={0.018} smoothness={4} position={[0, bodyHeight * 0.36, depth * 0.485]} castShadow receiveShadow>
              <meshStandardMaterial color="#eef1f2" roughness={0.56} metalness={0.06} envMapIntensity={0.24} />
            </RoundedBox>
            <mesh position={[0, bodyHeight * 0.58, depth * 0.505]} castShadow>
              <boxGeometry args={[width * 0.82, 0.014, 0.018]} />
              <meshStandardMaterial color="#cfd5d8" roughness={0.48} metalness={0.08} envMapIntensity={0.18} />
            </mesh>
            <RoundedBox args={[0.035, bodyHeight * 0.2, 0.026]} radius={0.01} smoothness={3} position={[width * 0.35, bodyHeight * 0.77, depth * 0.525]} castShadow>
              <meshStandardMaterial color="#d4d9dc" roughness={0.34} metalness={0.2} envMapIntensity={0.3} />
            </RoundedBox>
            <RoundedBox args={[0.035, bodyHeight * 0.28, 0.026]} radius={0.01} smoothness={3} position={[width * 0.35, bodyHeight * 0.36, depth * 0.525]} castShadow>
              <meshStandardMaterial color="#d4d9dc" roughness={0.34} metalness={0.2} envMapIntensity={0.3} />
            </RoundedBox>
            <mesh position={[0, bodyHeight * 0.07, depth * 0.505]} castShadow receiveShadow>
              <boxGeometry args={[width * 0.56, bodyHeight * 0.032, 0.018]} />
              <meshStandardMaterial color="#c8ced1" roughness={0.7} metalness={0.08} envMapIntensity={0.12} />
            </mesh>
            {[-0.32, 0.32].map((xOffset) => (
              <mesh key={`fridge-foot-${xOffset}`} position={[width * xOffset, 0.025, depth * 0.28]} castShadow receiveShadow>
                <cylinderGeometry args={[0.025, 0.03, 0.05, 12]} />
                <meshStandardMaterial color="#9ca4a8" roughness={0.58} metalness={0.18} envMapIntensity={0.2} />
              </mesh>
            ))}
          </>
        ) : null}
        {item.type === 'vanity' ? (
          <RoundedBox args={[width * 0.52, height * 0.42, 0.04]} radius={0.02} smoothness={4} position={[0, height * 0.92, -depth * 0.32]} castShadow receiveShadow>
            <meshStandardMaterial color="#ede8e0" roughness={0.2} metalness={0.04} envMapIntensity={0.34} />
          </RoundedBox>
        ) : null}
        {item.type === 'microwave' ? (
          <RoundedBox args={[width * 0.58, height * 0.54, depth * 0.03]} radius={0.014} smoothness={4} position={[-width * 0.12, height * 0.56, depth * 0.51]} castShadow>
            <meshStandardMaterial color="#111518" roughness={0.14} metalness={0.22} envMapIntensity={0.4} />
          </RoundedBox>
        ) : null}
        <SelectionRing radius={ringRadius} color={accentColor} />
      </SmoothFurnitureGroup>
    )
  }

  if (['shelf', 'openShelf', 'miniBookcase', 'shoeCabinet', 'microwaveStand'].includes(item.type)) {
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
        {[[-width * 0.46, height * 0.48, 0], [width * 0.46, height * 0.48, 0]].map((post, index) => (
          <mesh key={`shelf-post-${index}`} position={post} castShadow receiveShadow>
            <boxGeometry args={[0.04, height * 0.96, depth * 0.9]} />
            <meshStandardMaterial color={shellColor} roughness={0.72} envMapIntensity={0.2} />
          </mesh>
        ))}
        {[0.06, 0.32, 0.58, 0.88].map((level, index) => (
          <mesh key={`shelf-slab-${index}`} position={[0, height * level, 0]} castShadow receiveShadow>
            <boxGeometry args={[width * 0.96, 0.026, depth * 0.9]} />
            <meshStandardMaterial color={index === 0 ? shellColor : upholsteryColor} roughness={0.64} envMapIntensity={0.18} />
          </mesh>
        ))}
        {item.type === 'openShelf'
          ? [0.26, 0.52, 0.78].map((level, index) => (
            <mesh key={`open-shelf-divider-${index}`} position={[0, height * level, 0]} castShadow>
              <boxGeometry args={[width * 0.88, 0.014, depth * 0.78]} />
              <meshStandardMaterial color="#d7cec1" roughness={0.7} envMapIntensity={0.14} />
            </mesh>
          ))
          : null}
        {item.type === 'miniBookcase'
          ? [0.24, 0.5, 0.76].map((level, index) => (
            <group key={`mini-book-${index}`} position={[-width * 0.12 + index * 0.08, height * level, 0]}>
              {[[-0.14, '#ccb9a1'], [-0.02, '#8d9aa9'], [0.1, '#b38c73']].map((book, bookIndex) => (
                <mesh key={`book-${index}-${bookIndex}`} position={[width * book[0], 0.06, 0]} castShadow>
                  <boxGeometry args={[0.06, 0.12 + bookIndex * 0.02, depth * 0.54]} />
                  <meshStandardMaterial color={book[1]} roughness={0.76} envMapIntensity={0.1} />
                </mesh>
              ))}
            </group>
          ))
          : null}
        {item.type === 'shoeCabinet'
          ? [0.32, 0.68].map((level, index) => (
            <group key={`shoe-door-${index}`} position={[0, height * level, depth * 0.46]}>
              {[-0.24, 0.24].map((xOffset, doorIndex) => (
                <mesh key={`shoe-door-panel-${index}-${doorIndex}`} position={[width * xOffset, 0, 0]} castShadow receiveShadow>
                  <boxGeometry args={[width * 0.42, height * 0.24, 0.018]} />
                  <meshStandardMaterial color={shellColor} roughness={0.66} envMapIntensity={0.14} />
                </mesh>
              ))}
            </group>
          ))
          : null}
        {item.type === 'microwaveStand' ? (
          <>
            <RoundedBox args={[width * 0.86, height * 0.26, depth * 0.78]} radius={0.018} smoothness={4} position={[0, height * 0.72, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={shellColor} roughness={0.58} envMapIntensity={0.16} />
            </RoundedBox>
            <mesh position={[0, height * 0.36, depth * 0.34]} castShadow receiveShadow>
              <boxGeometry args={[width * 0.76, height * 0.38, 0.018]} />
              <meshStandardMaterial color="#d8d2c8" roughness={0.64} envMapIntensity={0.14} />
            </mesh>
          </>
        ) : null}
        <SelectionRing radius={ringRadius} color={accentColor} />
      </SmoothFurnitureGroup>
    )
  }

  if (['sideTable', 'stool', 'hanger', 'mirror', 'washer', 'freezer', 'portableAc', 'wallMountedAc', 'monitorArm', 'laptop', 'tableLamp', 'speaker', 'riceCooker', 'coffeeMachine', 'makeupOrganizer', 'beanbag', 'cushion', 'airPurifier', 'trashCan', 'laundryBasket', 'plant', 'fan', 'circulator', 'vacuumDock', 'trolley', 'curtain', 'blind', 'poster', 'wallClock', 'wallShelf'].includes(item.type)) {
    return (
      <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} onClick={onSelect} onPointerDown={handlePointerDown}>
        {item.type === 'sideTable' ? (
          <>
            <mesh position={[0, height * 0.86, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[Math.min(width, depth) * 0.42, Math.min(width, depth) * 0.44, 0.05, 28]} />
              <meshStandardMaterial color={shellColor} roughness={0.58} metalness={0.04} envMapIntensity={0.22} />
            </mesh>
            <mesh position={[0, height * 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.05, height * 0.72, 18]} />
              <meshStandardMaterial color={warmMetal} roughness={0.62} metalness={0.16} envMapIntensity={0.2} />
            </mesh>
            <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[Math.min(width, depth) * 0.18, Math.min(width, depth) * 0.24, 0.08, 18]} />
              <meshStandardMaterial color={warmMetal} roughness={0.64} metalness={0.14} envMapIntensity={0.18} />
            </mesh>
          </>
        ) : null}
        {item.type === 'stool' ? (
          <>
            <mesh position={[0, height * 0.76, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[Math.min(width, depth) * 0.4, Math.min(width, depth) * 0.42, height * 0.18, 28]} />
              <meshStandardMaterial color={upholsteryColor} roughness={0.92} envMapIntensity={0.08} />
            </mesh>
            {[[-width * 0.18, height * 0.28, -depth * 0.18], [width * 0.18, height * 0.28, -depth * 0.18], [-width * 0.18, height * 0.28, depth * 0.18], [width * 0.18, height * 0.28, depth * 0.18]].map((leg, index) => (
              <mesh key={`stool-leg-${index}`} position={leg} castShadow>
                <cylinderGeometry args={[0.014, 0.016, height * 0.48, 10]} />
                <meshStandardMaterial color={warmMetal} roughness={0.68} metalness={0.14} envMapIntensity={0.18} />
              </mesh>
            ))}
          </>
        ) : null}
        {item.type === 'hanger' ? (
          <>
            <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.22, 0.24, 0.06, 28]} />
              <meshStandardMaterial color={frameColor} roughness={0.62} metalness={0.14} envMapIntensity={0.18} />
            </mesh>
            <mesh position={[0, height * 0.42, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.024, height * 0.82, 18]} />
              <meshStandardMaterial color={shellColor} roughness={0.56} metalness={0.2} envMapIntensity={0.24} />
            </mesh>
            <mesh position={[0, height * 0.86, 0]} castShadow>
              <boxGeometry args={[width * 0.76, 0.035, 0.035]} />
              <meshStandardMaterial color={shellColor} roughness={0.56} metalness={0.2} envMapIntensity={0.22} />
            </mesh>
            {[-0.24, 0, 0.24].map((hook, index) => (
              <mesh key={`hanger-hook-${index}`} position={[width * hook, height * 0.8, 0]} castShadow>
                <cylinderGeometry args={[0.01, 0.01, 0.14, 10]} />
                <meshStandardMaterial color={warmMetal} roughness={0.58} metalness={0.18} envMapIntensity={0.2} />
              </mesh>
            ))}
          </>
        ) : null}
        {item.type === 'mirror' ? (
          <>
            <RoundedBox args={[width * 0.96, height * 0.92, 0.05]} radius={0.03} smoothness={4} position={[0, height * 0.48, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#ece7de" roughness={0.24} metalness={0.06} envMapIntensity={0.3} />
            </RoundedBox>
            <RoundedBox args={[width * 0.84, height * 0.8, 0.02]} radius={0.025} smoothness={4} position={[0, height * 0.5, 0.012]} castShadow>
              <meshStandardMaterial color="#f4f5f6" roughness={0.08} metalness={0.12} envMapIntensity={0.42} />
            </RoundedBox>
            <mesh position={[0, 0.05, -depth * 0.12]} rotation={[0.2, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[width * 0.8, 0.06, 0.08]} />
              <meshStandardMaterial color={frameColor} roughness={0.7} envMapIntensity={0.14} />
            </mesh>
          </>
        ) : null}
        {['washer', 'freezer', 'portableAc'].includes(item.type) ? (
          <>
            <RoundedBox args={[width, height * 0.98, depth]} radius={0.03} smoothness={4} position={[0, height * 0.49, 0]} castShadow receiveShadow>
              <meshStandardMaterial color={upholsteryColor} roughness={0.44} metalness={0.08} envMapIntensity={0.28} />
            </RoundedBox>
            {item.type === 'washer' ? (
              <mesh position={[0, height * 0.6, depth * 0.5]} castShadow>
                <cylinderGeometry args={[width * 0.22, width * 0.22, 0.028, 26]} />
                <meshStandardMaterial color="#1f2428" roughness={0.24} metalness={0.18} envMapIntensity={0.32} />
              </mesh>
            ) : null}
            {item.type === 'portableAc' ? (
              <mesh position={[0, height * 0.72, depth * 0.5]} castShadow>
                <boxGeometry args={[width * 0.56, height * 0.12, 0.02]} />
                <meshStandardMaterial color="#a4adb4" roughness={0.42} metalness={0.12} envMapIntensity={0.2} />
              </mesh>
            ) : null}
          </>
        ) : null}
        {item.type === 'wallMountedAc' ? (
          <>
            <RoundedBox args={[width, height * 0.82, depth * 0.68]} radius={0.04} smoothness={4} position={[0, 0, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#eef2f5" roughness={0.34} metalness={0.06} envMapIntensity={0.16} />
            </RoundedBox>
            <mesh position={[0, -height * 0.08, depth * 0.3]} castShadow receiveShadow>
              <boxGeometry args={[width * 0.78, height * 0.08, 0.014]} />
              <meshStandardMaterial color="#c8d0d7" roughness={0.46} metalness={0.08} envMapIntensity={0.12} />
            </mesh>
            {[0.12, 0.32, 0.52].map((slot, index) => (
              <mesh key={`wall-ac-slot-${index}`} position={[-width * 0.18 + width * slot, 0, depth * 0.31]} castShadow>
                <boxGeometry args={[width * 0.16, 0.012, 0.01]} />
                <meshStandardMaterial color="#acb6be" roughness={0.5} metalness={0.08} envMapIntensity={0.1} />
              </mesh>
            ))}
            <mesh position={[width * 0.34, height * 0.06, depth * 0.31]} castShadow>
              <boxGeometry args={[width * 0.12, height * 0.12, 0.012]} />
              <meshStandardMaterial color="#9eabb5" roughness={0.38} metalness={0.1} envMapIntensity={0.1} />
            </mesh>
          </>
        ) : null}
        {['monitorArm', 'laptop', 'tableLamp', 'speaker', 'riceCooker', 'coffeeMachine', 'makeupOrganizer'].includes(item.type) ? (
          <>
            {item.type === 'monitorArm' ? (
              <>
                <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
                  <boxGeometry args={[0.08, 0.04, 0.08]} />
                  <meshStandardMaterial color={shellColor} roughness={0.5} metalness={0.18} envMapIntensity={0.24} />
                </mesh>
                <mesh position={[0, height * 0.22, 0]} castShadow>
                  <boxGeometry args={[0.03, height * 0.44, 0.03]} />
                  <meshStandardMaterial color={shellColor} roughness={0.5} metalness={0.18} envMapIntensity={0.24} />
                </mesh>
                <mesh position={[width * 0.18, height * 0.3, -depth * 0.08]} rotation={[0, 0, -0.36]} castShadow>
                  <boxGeometry args={[width * 0.42, 0.025, 0.025]} />
                  <meshStandardMaterial color={warmMetal} roughness={0.58} metalness={0.2} envMapIntensity={0.2} />
                </mesh>
              </>
            ) : null}
            {item.type === 'laptop' ? (
              <>
                <mesh position={[0, 0.012, 0]} castShadow receiveShadow>
                  <boxGeometry args={[width, 0.024, depth]} />
                  <meshStandardMaterial color="#c7d0d8" roughness={0.36} metalness={0.18} envMapIntensity={0.28} />
                </mesh>
                <mesh position={[0, height * 0.18, -depth * 0.16]} rotation={[-0.9, 0, 0]} castShadow>
                  <boxGeometry args={[width, 0.018, depth * 0.78]} />
                  <meshStandardMaterial color="#aeb7c0" roughness={0.32} metalness={0.2} envMapIntensity={0.28} />
                </mesh>
              </>
            ) : null}
            {item.type === 'tableLamp' ? (
              <>
                <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
                  <cylinderGeometry args={[0.08, 0.1, 0.04, 18]} />
                  <meshStandardMaterial color={warmMetal} roughness={0.56} metalness={0.16} envMapIntensity={0.18} />
                </mesh>
                <mesh position={[0, height * 0.32, 0]} castShadow>
                  <cylinderGeometry args={[0.012, 0.016, height * 0.5, 12]} />
                  <meshStandardMaterial color={frameColor} roughness={0.5} metalness={0.18} envMapIntensity={0.2} />
                </mesh>
                <mesh position={[0, height * 0.66, 0]} castShadow>
                  <cylinderGeometry args={[width * 0.24, width * 0.3, height * 0.22, 20]} />
                  <meshStandardMaterial color="#ede3d7" roughness={0.92} envMapIntensity={0.08} />
                </mesh>
              </>
            ) : null}
            {item.type === 'speaker' ? (
              <RoundedBox args={[width, Math.max(height * 0.86, 0.08), depth]} radius={0.02} smoothness={4} position={[0, Math.max(height * 0.43, 0.04), 0]} castShadow receiveShadow>
                <meshStandardMaterial color={shellColor} roughness={0.46} metalness={0.08} envMapIntensity={0.22} />
              </RoundedBox>
            ) : null}
            {item.type === 'riceCooker' ? (
              <mesh position={[0, height * 0.48, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[width * 0.42, width * 0.5, height * 0.82, 24]} />
                <meshStandardMaterial color="#e4e8ec" roughness={0.34} metalness={0.08} envMapIntensity={0.24} />
              </mesh>
            ) : null}
            {item.type === 'coffeeMachine' ? (
              <RoundedBox args={[width, height * 0.86, depth * 0.9]} radius={0.02} smoothness={4} position={[0, height * 0.44, 0]} castShadow receiveShadow>
                <meshStandardMaterial color={shellColor} roughness={0.42} metalness={0.12} envMapIntensity={0.24} />
              </RoundedBox>
            ) : null}
            {item.type === 'makeupOrganizer' ? (
              <RoundedBox args={[width, Math.max(height * 0.8, 0.06), depth]} radius={0.018} smoothness={4} position={[0, Math.max(height * 0.4, 0.03), 0]} castShadow receiveShadow>
                <meshStandardMaterial color="#ece7df" roughness={0.28} metalness={0.06} envMapIntensity={0.22} />
              </RoundedBox>
            ) : null}
          </>
        ) : null}
        {['beanbag', 'cushion'].includes(item.type) ? (
          <RoundedBox args={[width, height * 0.72, depth]} radius={0.12} smoothness={4} position={[0, height * 0.36, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={upholsteryColor} roughness={0.96} envMapIntensity={0.08} />
          </RoundedBox>
        ) : null}
        {item.type === 'airPurifier' ? (
          <>
            <RoundedBox args={[width * 0.9, height * 0.96, depth * 0.9]} radius={0.04} smoothness={4} position={[0, height * 0.48, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#e6ecef" roughness={0.42} metalness={0.08} envMapIntensity={0.18} />
            </RoundedBox>
            <mesh position={[0, height * 0.76, depth * 0.42]} castShadow receiveShadow>
              <boxGeometry args={[width * 0.56, height * 0.08, 0.015]} />
              <meshStandardMaterial color="#b8c2ca" roughness={0.44} metalness={0.12} envMapIntensity={0.16} />
            </mesh>
            {[0.34, 0.5, 0.66].map((level, index) => (
              <mesh key={`air-slot-${index}`} position={[0, height * level, depth * 0.43]} castShadow>
                <boxGeometry args={[width * 0.52, 0.012, 0.01]} />
                <meshStandardMaterial color="#9eabb3" roughness={0.48} metalness={0.08} envMapIntensity={0.14} />
              </mesh>
            ))}
          </>
        ) : null}
        {item.type === 'trashCan' ? (
          <>
            <mesh position={[0, height * 0.42, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[Math.min(width, depth) * 0.32, Math.min(width, depth) * 0.4, height * 0.78, 24]} />
              <meshStandardMaterial color="#e4e8eb" roughness={0.52} metalness={0.08} envMapIntensity={0.18} />
            </mesh>
            <mesh position={[0, height * 0.82, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[Math.min(width, depth) * 0.34, Math.min(width, depth) * 0.34, 0.03, 24]} />
              <meshStandardMaterial color="#c9d1d7" roughness={0.48} metalness={0.08} envMapIntensity={0.16} />
            </mesh>
          </>
        ) : null}
        {item.type === 'laundryBasket' ? (
          <>
            <mesh position={[0, height * 0.42, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[Math.min(width, depth) * 0.28, Math.min(width, depth) * 0.38, height * 0.72, 24]} />
              <meshStandardMaterial color={upholsteryColor} roughness={0.82} envMapIntensity={0.1} />
            </mesh>
            <mesh position={[0, height * 0.82, 0]} castShadow>
              <torusGeometry args={[Math.min(width, depth) * 0.28, 0.018, 12, 28]} />
              <meshStandardMaterial color="#cdbda7" roughness={0.74} envMapIntensity={0.12} />
            </mesh>
          </>
        ) : null}
        {item.type === 'fan' ? (
          <>
            <mesh position={[0, height * 0.5, 0]} castShadow>
              <cylinderGeometry args={[0.012, 0.016, height * 0.82, 16]} />
              <meshStandardMaterial color={warmMetal} roughness={0.6} metalness={0.18} envMapIntensity={0.18} />
            </mesh>
            <mesh position={[0, height * 0.82, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[width * 0.36, width * 0.36, 0.05, 28]} />
              <meshStandardMaterial color="#edf1f4" roughness={0.44} metalness={0.08} envMapIntensity={0.18} />
            </mesh>
            {[0, Math.PI * 0.66, Math.PI * 1.33].map((angle, index) => (
              <mesh key={`fan-blade-${index}`} position={[Math.cos(angle) * width * 0.08, height * 0.82, Math.sin(angle) * depth * 0.08]} rotation={[0, angle, 0]} castShadow>
                <boxGeometry args={[width * 0.42, 0.012, depth * 0.08]} />
                <meshStandardMaterial color="#dbe2e8" roughness={0.52} metalness={0.08} envMapIntensity={0.14} />
              </mesh>
            ))}
            <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.16, 0.18, 0.08, 24]} />
              <meshStandardMaterial color="#f3f4f5" roughness={0.5} metalness={0.08} envMapIntensity={0.16} />
            </mesh>
          </>
        ) : null}
        {item.type === 'circulator' ? (
          <>
            <mesh position={[0, height * 0.56, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[width * 0.34, width * 0.34, depth * 0.54, 24]} />
              <meshStandardMaterial color="#eef1f3" roughness={0.44} metalness={0.08} envMapIntensity={0.18} />
            </mesh>
            {[0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].map((angle, index) => (
              <mesh key={`circ-blade-${index}`} position={[Math.cos(angle) * width * 0.08, height * 0.56, Math.sin(angle) * depth * 0.08]} rotation={[0, angle, 0]} castShadow>
                <boxGeometry args={[width * 0.26, 0.012, depth * 0.07]} />
                <meshStandardMaterial color="#d8dfe4" roughness={0.52} metalness={0.08} envMapIntensity={0.14} />
              </mesh>
            ))}
            <mesh position={[0, height * 0.18, 0]} castShadow>
              <cylinderGeometry args={[0.018, 0.024, height * 0.28, 14]} />
              <meshStandardMaterial color={warmMetal} roughness={0.62} metalness={0.18} envMapIntensity={0.16} />
            </mesh>
            <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[0.12, 0.14, 0.06, 20]} />
              <meshStandardMaterial color="#eceff1" roughness={0.52} metalness={0.08} envMapIntensity={0.16} />
            </mesh>
          </>
        ) : null}
        {item.type === 'vacuumDock' ? (
          <>
            <RoundedBox args={[width * 0.3, height * 0.98, depth * 0.24]} radius={0.02} smoothness={4} position={[0, height * 0.49, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#1f2529" roughness={0.34} metalness={0.14} envMapIntensity={0.18} />
            </RoundedBox>
            <RoundedBox args={[width * 0.74, 0.08, depth * 0.52]} radius={0.02} smoothness={4} position={[0, 0.04, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#d7dddf" roughness={0.5} metalness={0.08} envMapIntensity={0.14} />
            </RoundedBox>
          </>
        ) : null}
        {item.type === 'plant' ? (
          <>
            <mesh position={[0, height * 0.16, 0]} castShadow receiveShadow>
              <cylinderGeometry args={[width * 0.22, width * 0.28, height * 0.28, 20]} />
              <meshStandardMaterial color="#8f765e" roughness={0.78} envMapIntensity={0.12} />
            </mesh>
            {[[-0.16, 0.56, 0], [0.16, 0.62, 0.08], [0, 0.72, -0.08]].map((leaf, index) => (
              <mesh key={`leaf-${index}`} position={[width * leaf[0], height * leaf[1], depth * leaf[2]]} castShadow>
                <sphereGeometry args={[width * (0.18 + index * 0.02), 16, 16]} />
                <meshStandardMaterial color={index === 1 ? '#859d7d' : '#6f8a67'} roughness={0.92} envMapIntensity={0.08} />
              </mesh>
            ))}
          </>
        ) : null}
        {item.type === 'trolley' ? (
          <>
            {[[-width * 0.38, height * 0.42, -depth * 0.34], [width * 0.38, height * 0.42, -depth * 0.34], [-width * 0.38, height * 0.42, depth * 0.34], [width * 0.38, height * 0.42, depth * 0.34]].map((leg, index) => (
              <mesh key={`trolley-leg-${index}`} position={leg} castShadow>
                <cylinderGeometry args={[0.012, 0.016, height * 0.84, 10]} />
                <meshStandardMaterial color={warmMetal} roughness={0.62} metalness={0.18} envMapIntensity={0.16} />
              </mesh>
            ))}
            {[0.18, 0.5, 0.82].map((level, index) => (
              <mesh key={`trolley-${index}`} position={[0, height * level, 0]} castShadow receiveShadow>
                <boxGeometry args={[width * 0.9, 0.018, depth * 0.9]} />
                <meshStandardMaterial color="#f2f3f4" roughness={0.44} metalness={0.08} envMapIntensity={0.18} />
              </mesh>
            ))}
            {[[-width * 0.34, 0.012, -depth * 0.28], [width * 0.34, 0.012, -depth * 0.28], [-width * 0.34, 0.012, depth * 0.28], [width * 0.34, 0.012, depth * 0.28]].map((wheel, index) => (
              <mesh key={`trolley-wheel-${index}`} position={wheel} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.016, 0.016, 0.02, 12]} />
                <meshStandardMaterial color="#33393f" roughness={0.58} metalness={0.16} envMapIntensity={0.12} />
              </mesh>
            ))}
          </>
        ) : null}
        {['curtain', 'blind'].includes(item.type) ? (
          <>
            <mesh position={[0, height * 0.98, 0]} castShadow receiveShadow>
              <boxGeometry args={[width * 1.02, 0.04, 0.04]} />
              <meshStandardMaterial color="#d7cec1" roughness={0.56} metalness={0.08} envMapIntensity={0.16} />
            </mesh>
            <mesh position={[0, height * 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[width, height * 0.92, Math.max(depth * 0.24, 0.03)]} />
              <meshStandardMaterial color={item.type === 'curtain' ? '#ece4d8' : '#d7d1c8'} roughness={0.96} envMapIntensity={0.06} />
            </mesh>
            {item.type === 'curtain'
              ? [-0.34, -0.12, 0.12, 0.34].map((fold, index) => (
                <mesh key={`curtain-fold-${index}`} position={[width * fold, height * 0.5, depth * 0.06]} castShadow>
                  <boxGeometry args={[width * 0.1, height * 0.9, Math.max(depth * 0.08, 0.018)]} />
                  <meshStandardMaterial color="#e0d4c4" roughness={0.94} envMapIntensity={0.06} />
                </mesh>
              ))
              : [0.2, 0.36, 0.52, 0.68].map((level, index) => (
                <mesh key={`blind-slat-${index}`} position={[0, height * level, depth * 0.04]} castShadow>
                  <boxGeometry args={[width * 0.94, 0.014, Math.max(depth * 0.18, 0.018)]} />
                  <meshStandardMaterial color="#cec8be" roughness={0.86} envMapIntensity={0.08} />
                </mesh>
              ))}
          </>
        ) : null}
        {item.type === 'poster' ? (
          <>
            <RoundedBox args={[width, height, 0.02]} radius={0.018} smoothness={3} castShadow receiveShadow>
              <meshStandardMaterial color="#f0ece6" roughness={0.8} envMapIntensity={0.08} />
            </RoundedBox>
            <mesh position={[0, 0, 0.012]} castShadow>
              <boxGeometry args={[width * 0.84, height * 0.84, 0.008]} />
              <meshStandardMaterial color="#d7c4ae" roughness={0.82} envMapIntensity={0.06} />
            </mesh>
          </>
        ) : null}
        {item.type === 'wallClock' ? (
          <>
            <mesh castShadow receiveShadow>
              <cylinderGeometry args={[width * 0.48, width * 0.48, 0.06, 24]} />
              <meshStandardMaterial color="#f1ece4" roughness={0.34} metalness={0.04} envMapIntensity={0.18} />
            </mesh>
            {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((angle, index) => (
              <mesh key={`clock-mark-${index}`} position={[Math.cos(angle) * width * 0.34, Math.sin(angle) * width * 0.34, 0.034]} castShadow>
                <boxGeometry args={[0.018, 0.06, 0.008]} />
                <meshStandardMaterial color={shellColor} roughness={0.48} envMapIntensity={0.12} />
              </mesh>
            ))}
            <mesh position={[0, 0.06, 0.036]} rotation={[0, 0, Math.PI * 0.2]} castShadow>
              <boxGeometry args={[0.012, width * 0.24, 0.008]} />
              <meshStandardMaterial color={frameColor} roughness={0.44} envMapIntensity={0.12} />
            </mesh>
            <mesh position={[0.03, -0.02, 0.036]} rotation={[0, 0, -Math.PI * 0.38]} castShadow>
              <boxGeometry args={[0.01, width * 0.16, 0.008]} />
              <meshStandardMaterial color={frameColor} roughness={0.44} envMapIntensity={0.12} />
            </mesh>
          </>
        ) : null}
        {item.type === 'wallShelf' ? (
          <>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[width, height * 0.26, depth * 0.6]} />
              <meshStandardMaterial color={shellColor} roughness={0.62} envMapIntensity={0.16} />
            </mesh>
            {[-width * 0.28, width * 0.28].map((xOffset, index) => (
              <mesh key={`wall-shelf-bracket-${index}`} position={[xOffset, -height * 0.16, 0]} castShadow>
                <boxGeometry args={[0.04, height * 0.42, 0.04]} />
                <meshStandardMaterial color={warmMetal} roughness={0.58} metalness={0.16} envMapIntensity={0.14} />
              </mesh>
            ))}
          </>
        ) : null}
        {!wallMountedPose ? <SelectionRing radius={ringRadius} color={accentColor} /> : null}
      </SmoothFurnitureGroup>
    )
  }

  return (
    <SmoothFurnitureGroup position={rootPosition} rotationY={rootRotation} isDragging={isDragging} onClick={onSelect} onPointerDown={handlePointerDown}>
      <mesh position={[0, height * 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[width * 0.88, height * 0.18, depth * 0.88]} />
        <meshStandardMaterial color="#e2d8cc" roughness={0.8} envMapIntensity={0.3} />
      </mesh>
      <mesh position={[0, height * 0.82, -depth * 0.3]} castShadow>
        <boxGeometry args={[width * 0.86, height * 0.22, depth * 0.18]} />
        <meshStandardMaterial color="#d2c0aa" roughness={0.76} envMapIntensity={0.3} />
      </mesh>
      {!wallMountedPose ? <SelectionRing radius={ringRadius * 0.92} color={accentColor} opacity={0.62} /> : null}
    </SmoothFurnitureGroup>
  )
}
