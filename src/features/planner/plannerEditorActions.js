import { getScaledBounds, furnitureMetricMap } from '../../data/furniture.js'

export function updateFurniturePositionInList({
  items,
  furnitureId,
  nextX,
  nextY,
  roomDimensions,
  snapEnabled,
  snapGridM,
  snapPosition,
}) {
  let guides = { vertical: null, horizontal: null }

  const nextItems = items.map((item) => {
    if (item.id !== furnitureId) return item
    if (item.type === 'wallMountedAc') {
      const bounds = getScaledBounds(item.type, item.scale ?? 1, roomDimensions)
      const rawX = Math.min(Math.max(nextX, 0), 100 - bounds.w)
      guides = { vertical: null, horizontal: null }
      return { ...item, x: rawX, position: `X ${rawX.toFixed(0)} · 벽걸이` }
    }

    const bounds = getScaledBounds(item.type, item.scale ?? 1, roomDimensions)
    const rawX = Math.min(Math.max(nextX, 0), 100 - bounds.w)
    const rawY = Math.min(Math.max(nextY, 0), 100 - bounds.h)
    const snapped = snapPosition({
      rawX,
      rawY,
      bounds,
      movingId: furnitureId,
      snapEnabled,
      gridStepWidth: (snapGridM / roomDimensions.width) * 100,
      gridStepHeight: (snapGridM / roomDimensions.depth) * 100,
      placedFurniture: items,
      roomDimensions,
    })
    guides = snapped.guides
    return { ...item, x: snapped.x, y: snapped.y, position: `X ${snapped.x.toFixed(0)} · Y ${snapped.y.toFixed(0)}` }
  })

  return { items: nextItems, guides }
}

export function rotateFurnitureInList(items, furnitureId, nextRotation) {
  return items.map((item) =>
    item.id !== furnitureId ? item : { ...item, rotation: (((nextRotation % 360) + 360) % 360) * 1 },
  )
}

export function resizeFurnitureInList(items, furnitureId, delta, roomDimensions) {
  return items.map((item) => {
    if (item.id !== furnitureId) return item
    const nextScale = Math.min(Math.max((item.scale ?? 1) + delta, 0.7), 1.5)
    const bounds = getScaledBounds(item.type, nextScale, roomDimensions)
    const nx = Math.min(item.x ?? 18, 100 - bounds.w)
    const ny = Math.min(item.y ?? 18, 100 - bounds.h)
    return { ...item, scale: Number(nextScale.toFixed(2)), x: nx, y: ny, position: `X ${nx.toFixed(0)} · Y ${ny.toFixed(0)}` }
  })
}

export function deleteFurnitureSelection(items, selectedFurnitureId, selectedFurnitureIds) {
  const targetIds = selectedFurnitureIds.length > 0 ? selectedFurnitureIds : (selectedFurnitureId ? [selectedFurnitureId] : [])
  const target = items.find((i) => i.id === selectedFurnitureId)
  const nextItems = items.filter((i) => !targetIds.includes(i.id))
  return {
    items: nextItems,
    nextSelectedFurnitureId: nextItems[0]?.id ?? '',
    nextSelectedFurnitureIds: nextItems[0]?.id ? [nextItems[0].id] : [],
    target,
  }
}

export function duplicateFurnitureSelection({
  items,
  selectedFurnitureId,
  selectedFurnitureIds,
  roomDimensions,
  snapEnabled,
  snapGridM,
  snapPosition,
  seed = Date.now(),
}) {
  const sourceIds = selectedFurnitureIds.length > 0 ? selectedFurnitureIds : (selectedFurnitureId ? [selectedFurnitureId] : [])
  const sourceItems = items.filter((item) => sourceIds.includes(item.id))
  const duplicates = sourceItems.map((item, index) => {
    const bounds = getScaledBounds(item.type, item.scale ?? 1, roomDimensions)
    const rawX = Math.min(Math.max((item.x ?? 18) + 6, 0), 100 - bounds.w)
    const rawY = Math.min(Math.max((item.y ?? 18) + 6, 0), 100 - bounds.h)
    const snapped = snapPosition({
      rawX,
      rawY,
      bounds,
      snapEnabled,
      gridStepWidth: (snapGridM / roomDimensions.width) * 100,
      gridStepHeight: (snapGridM / roomDimensions.depth) * 100,
      placedFurniture: items,
      roomDimensions,
    })
    return {
      ...item,
      id: `editor-copy-${seed}-${index}`,
      x: snapped.x,
      y: snapped.y,
      position: `X ${snapped.x.toFixed(0)} · Y ${snapped.y.toFixed(0)}`,
    }
  })

  return {
    items: [...items, ...duplicates],
    duplicates,
  }
}

export function autoArrangeFurnitureSelection({
  items,
  targetIds,
  mode,
  roomDimensions,
  snapEnabled,
  snapGridM,
  snapPosition,
}) {
  const arranged = items
    .filter((item) => targetIds.includes(item.id))
    .map((item) => ({ ...item }))
    .sort((a, b) => {
      if (mode === 'align-left' || mode === 'align-right' || mode === 'distribute-vertical') return (a.y ?? 0) - (b.y ?? 0)
      return (a.x ?? 0) - (b.x ?? 0)
    })

  const positioned = arranged.map((item) => ({ item, bounds: getScaledBounds(item.type, item.scale ?? 1, roomDimensions) }))

  if (mode === 'align-left') {
    const anchor = Math.min(...positioned.map(({ item }) => item.x ?? 0))
    positioned.forEach(({ item, bounds }) => { item.x = Math.min(Math.max(anchor, 0), 100 - bounds.w) })
  } else if (mode === 'align-right') {
    const anchor = Math.max(...positioned.map(({ item, bounds }) => (item.x ?? 0) + bounds.w))
    positioned.forEach(({ item, bounds }) => { item.x = Math.min(Math.max(anchor - bounds.w, 0), 100 - bounds.w) })
  } else if (mode === 'align-top') {
    const anchor = Math.min(...positioned.map(({ item }) => item.y ?? 0))
    positioned.forEach(({ item, bounds }) => { item.y = Math.min(Math.max(anchor, 0), 100 - bounds.h) })
  } else if (mode === 'align-bottom') {
    const anchor = Math.max(...positioned.map(({ item, bounds }) => (item.y ?? 0) + bounds.h))
    positioned.forEach(({ item, bounds }) => { item.y = Math.min(Math.max(anchor - bounds.h, 0), 100 - bounds.h) })
  } else if (mode === 'distribute-horizontal') {
    const first = positioned[0]
    const last = positioned[positioned.length - 1]
    const firstX = first.item.x ?? 0
    const lastX = last.item.x ?? 0
    const gap = positioned.length > 1 ? (lastX - firstX) / (positioned.length - 1) : 0
    positioned.forEach(({ item, bounds }, index) => {
      item.x = Math.min(Math.max(firstX + gap * index, 0), 100 - bounds.w)
    })
  } else if (mode === 'distribute-vertical') {
    const first = positioned[0]
    const last = positioned[positioned.length - 1]
    const firstY = first.item.y ?? 0
    const lastY = last.item.y ?? 0
    const gap = positioned.length > 1 ? (lastY - firstY) / (positioned.length - 1) : 0
    positioned.forEach(({ item, bounds }, index) => {
      item.y = Math.min(Math.max(firstY + gap * index, 0), 100 - bounds.h)
    })
  }

  const normalized = arranged.map((item) => {
    const bounds = getScaledBounds(item.type, item.scale ?? 1, roomDimensions)
    const snapped = snapPosition({
      rawX: item.x ?? 0,
      rawY: item.y ?? 0,
      bounds,
      snapEnabled,
      gridStepWidth: (snapGridM / roomDimensions.width) * 100,
      gridStepHeight: (snapGridM / roomDimensions.depth) * 100,
      placedFurniture: items,
      roomDimensions,
    })
    return { ...item, x: snapped.x, y: snapped.y, position: `X ${snapped.x.toFixed(0)} · Y ${snapped.y.toFixed(0)}` }
  })

  return items.map((item) => normalized.find((nextItem) => nextItem.id === item.id) ?? item)
}

export function createFurnitureItem({
  nextId,
  catalogItem,
  nextType,
  placement,
  order,
}) {
  return {
    id: nextId,
    catalogId: catalogItem.id,
    name: catalogItem.name,
    position: `새 배치 ${order}`,
    type: nextType,
    brand: catalogItem.brand,
    finish: catalogItem.finish,
    x: placement.x,
    y: placement.y,
    rotation: placement.rotation,
    scale: 1,
  }
}

export function resizeFurnitureByDimension(items, furnitureId, axis, valueCm) {
  const valueM = Number(valueCm) / 100
  if (!valueM || valueM <= 0) return items
  return items.map((item) => {
    if (item.id !== furnitureId) return item
    const base = furnitureMetricMap[item.type] ?? furnitureMetricMap.chair
    const newScale = axis === 'width' ? valueM / base.width : valueM / base.depth
    return { ...item, scale: Number(Math.min(Math.max(newScale, 0.5), 2.0).toFixed(2)) }
  })
}
