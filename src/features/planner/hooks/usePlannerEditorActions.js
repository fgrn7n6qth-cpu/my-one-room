import { useCallback } from 'react'
import { createFurnitureItem, deleteFurnitureSelection, duplicateFurnitureSelection, resizeFurnitureByDimension, resizeFurnitureInList, rotateFurnitureInList, updateFurniturePositionInList, autoArrangeFurnitureSelection } from '../plannerEditorActions.js'
import { getSmartPlacement, snapPosition } from '../plannerFurniture.js'

export function usePlannerEditorActions({
  placedFurniture,
  selectedFurniture,
  selectedFurnitureId,
  selectedFurnitureIds,
  roomDimensions,
  snapEnabled,
  setPlacedFurniture,
  setSelectedFurnitureId,
  setSelectedFurnitureIds,
  setAlignmentGuides,
  setDraggingFurnitureId,
  setStatusMessage,
  setProjectLayouts,
  setCurrentView,
  setRoomDimensions,
  setPlanElements,
  setToastMessage,
  selectedCatalog,
  selectedProjectId,
  saveLayoutSnapshot,
  pushHistory,
  snapGridM,
  getFurnitureType,
  defaultPlanElements,
}) {
  const updateFurniturePosition = useCallback((furnitureId, nextX, nextY) => {
    setPlacedFurniture((current) => {
      const result = updateFurniturePositionInList({
        items: current,
        furnitureId,
        nextX,
        nextY,
        roomDimensions,
        snapEnabled,
        snapGridM,
        snapPosition,
      })
      setAlignmentGuides(result.guides)
      return result.items
    })
  }, [roomDimensions, setAlignmentGuides, setPlacedFurniture, snapEnabled, snapGridM])

  const setFurnitureRotation = useCallback((furnitureId, nextRotation) => {
    setPlacedFurniture((current) => rotateFurnitureInList(current, furnitureId, nextRotation))
  }, [setPlacedFurniture])

  const startDraggingFurnitureIn3D = useCallback((furnitureId) => {
    pushHistory()
    setDraggingFurnitureId(furnitureId)
  }, [pushHistory, setDraggingFurnitureId])

  const endDraggingFurnitureIn3D = useCallback((furnitureId, furnitureName, mode = '이동') => {
    setDraggingFurnitureId(null)
    setAlignmentGuides({ vertical: null, horizontal: null })
    setStatusMessage(`${furnitureName} 가구 ${mode === 'rotate' ? '각도' : '위치'}를 3D에서 업데이트했습니다.`)
  }, [setAlignmentGuides, setDraggingFurnitureId, setStatusMessage])

  const handleSelectFurniture = useCallback((furnitureId, options = {}) => {
    const { multi = false } = options
    if (!multi) {
      setSelectedFurnitureId(furnitureId)
      setSelectedFurnitureIds([furnitureId])
      return
    }

    setSelectedFurnitureIds((current) => {
      const exists = current.includes(furnitureId)
      const next = exists ? current.filter((id) => id !== furnitureId) : [...current, furnitureId]
      setSelectedFurnitureId(next[0] ?? '')
      return next
    })
  }, [setSelectedFurnitureId, setSelectedFurnitureIds])

  const rotateSelectedFurniture = useCallback((delta) => {
    if (!selectedFurnitureId) return
    pushHistory()
    setFurnitureRotation(selectedFurnitureId, (selectedFurniture?.rotation ?? 0) + delta)
    if (selectedFurniture?.name) setStatusMessage(`${selectedFurniture.name} 가구를 회전했습니다.`)
  }, [pushHistory, selectedFurniture, selectedFurnitureId, setFurnitureRotation, setStatusMessage])

  const resizeSelectedFurniture = useCallback((delta) => {
    if (!selectedFurnitureId) return
    pushHistory()
    setPlacedFurniture((current) => resizeFurnitureInList(current, selectedFurnitureId, delta, roomDimensions))
    if (selectedFurniture?.name) setStatusMessage(`${selectedFurniture.name} 가구 크기를 조절했습니다.`)
  }, [pushHistory, roomDimensions, selectedFurniture, selectedFurnitureId, setPlacedFurniture, setStatusMessage])

  const deleteSelectedFurniture = useCallback(() => {
    if (!selectedFurnitureId) return
    pushHistory()
    const result = deleteFurnitureSelection(placedFurniture, selectedFurnitureId, selectedFurnitureIds)
    setPlacedFurniture(result.items)
    setSelectedFurnitureId(result.nextSelectedFurnitureId)
    setSelectedFurnitureIds(result.nextSelectedFurnitureIds)
    setStatusMessage(`${result.target?.name ?? '선택한'} 가구를 삭제했습니다.`)
  }, [placedFurniture, pushHistory, selectedFurnitureId, selectedFurnitureIds, setPlacedFurniture, setSelectedFurnitureId, setSelectedFurnitureIds, setStatusMessage])

  const moveSelectedFurniture = useCallback((deltaX, deltaY) => {
    const targetIds = selectedFurnitureIds.length > 0 ? selectedFurnitureIds : (selectedFurnitureId ? [selectedFurnitureId] : [])
    if (targetIds.length === 0) return

    if (targetIds.length === 1) {
      const target = placedFurniture.find((i) => i.id === targetIds[0])
      if (!target) return
      updateFurniturePosition(target.id, (target.x ?? 20) + deltaX, (target.y ?? 20) + deltaY)
      setStatusMessage(`${target.name} 가구 위치를 조정했습니다.`)
      return
    }

    pushHistory()
    setPlacedFurniture((current) => current.map((item) => {
      if (!targetIds.includes(item.id)) return item
      const result = updateFurniturePositionInList({
        items: current,
        furnitureId: item.id,
        nextX: (item.x ?? 18) + deltaX,
        nextY: (item.y ?? 18) + deltaY,
        roomDimensions,
        snapEnabled,
        snapGridM,
        snapPosition,
      })
      return result.items.find((nextItem) => nextItem.id === item.id) ?? item
    }))
    setStatusMessage(`${targetIds.length}개 가구 위치를 함께 조정했습니다.`)
  }, [placedFurniture, pushHistory, roomDimensions, selectedFurnitureId, selectedFurnitureIds, setPlacedFurniture, setStatusMessage, snapEnabled, snapGridM, updateFurniturePosition])

  const duplicateSelectedFurniture = useCallback(() => {
    if ((selectedFurnitureIds.length > 0 ? selectedFurnitureIds : (selectedFurnitureId ? [selectedFurnitureId] : [])).length === 0) return
    pushHistory()
    const result = duplicateFurnitureSelection({
      items: placedFurniture,
      selectedFurnitureId,
      selectedFurnitureIds,
      roomDimensions,
      snapEnabled,
      snapGridM,
      snapPosition,
    })
    setPlacedFurniture(result.items)
    setSelectedFurnitureId(result.duplicates[0]?.id ?? '')
    setSelectedFurnitureIds(result.duplicates.map((item) => item.id))
    setStatusMessage(`${result.duplicates.length}개 가구를 복제했습니다.`)
  }, [placedFurniture, pushHistory, roomDimensions, selectedFurnitureId, selectedFurnitureIds, setPlacedFurniture, setSelectedFurnitureId, setSelectedFurnitureIds, setStatusMessage, snapEnabled, snapGridM])

  const handleAutoArrangeFurniture = useCallback((mode) => {
    const targetIds = selectedFurnitureIds.length >= 2 ? selectedFurnitureIds : placedFurniture.map((item) => item.id)
    if (targetIds.length < 2) {
      setStatusMessage('자동 정렬은 선택된 가구가 2개 이상일 때 사용할 수 있습니다.')
      return
    }

    pushHistory()
    setPlacedFurniture(autoArrangeFurnitureSelection({
      items: placedFurniture,
      targetIds,
      mode,
      roomDimensions,
      snapEnabled,
      snapGridM,
      snapPosition,
    }))
    setStatusMessage({
      'align-left': '가구를 왼쪽 기준으로 정렬했습니다.',
      'align-right': '가구를 오른쪽 기준으로 정렬했습니다.',
      'align-top': '가구를 위쪽 기준으로 정렬했습니다.',
      'align-bottom': '가구를 아래쪽 기준으로 정렬했습니다.',
      'distribute-horizontal': '가구를 가로로 균등 배치했습니다.',
      'distribute-vertical': '가구를 세로로 균등 배치했습니다.',
    }[mode] ?? '가구 자동 정렬을 적용했습니다.')
  }, [placedFurniture, pushHistory, roomDimensions, selectedFurnitureIds, setPlacedFurniture, setStatusMessage, snapEnabled, snapGridM])

  const handleUpdateSelectedFurnitureField = useCallback((field, value) => {
    if (!selectedFurnitureId || !selectedFurniture) return
    pushHistory()

    if (field === 'x' || field === 'y') {
      const next = Number(value)
      if (Number.isNaN(next)) return
      updateFurniturePosition(
        selectedFurnitureId,
        field === 'x' ? next : (selectedFurniture.x ?? 18),
        field === 'y' ? next : (selectedFurniture.y ?? 18),
      )
      setStatusMessage(`${selectedFurniture.name} 가구 위치를 수치로 조정했습니다.`)
      return
    }

    if (field === 'rotation') {
      setFurnitureRotation(selectedFurnitureId, Number(value))
      setStatusMessage(`${selectedFurniture.name} 가구 각도를 수치로 조정했습니다.`)
    }
  }, [pushHistory, selectedFurniture, selectedFurnitureId, setFurnitureRotation, setStatusMessage, updateFurniturePosition])

  const handleAddFurnitureToEditor = useCallback((catalogItem = selectedCatalog, placementMode = 'auto') => {
    if (!catalogItem) return
    pushHistory()
    const nextId = `editor-${Date.now()}`
    const nextType = catalogItem.type ?? getFurnitureType(catalogItem.name)
    const placement = getSmartPlacement(nextType, placementMode, placedFurniture, roomDimensions)
    const nextItem = createFurnitureItem({ nextId, catalogItem, nextType, placement, order: placedFurniture.length + 1 })
    const next = [...placedFurniture, nextItem]
    setPlacedFurniture(next)
    setSelectedFurnitureId(nextId)
    setSelectedFurnitureIds([nextId])
    setProjectLayouts((current) => ({
      ...current,
      [selectedProjectId]: saveLayoutSnapshot({ placedFurniture: next, selectedFurnitureId: nextId, selectedFurnitureIds: [nextId] }),
    }))
    setCurrentView('editor')
    setStatusMessage(`${catalogItem.name} 가구를 ${placementMode === 'auto' ? '추천 위치에' : '지정한 위치에'} 배치했습니다.`)
  }, [getFurnitureType, placedFurniture, pushHistory, roomDimensions, saveLayoutSnapshot, selectedCatalog, selectedProjectId, setCurrentView, setPlacedFurniture, setProjectLayouts, setSelectedFurnitureId, setSelectedFurnitureIds, setStatusMessage])

  const handleFurnitureSizeChange = useCallback((axis, valueCm) => {
    if (!selectedFurnitureId) return
    if (!Number.isFinite(Number(valueCm)) || Number(valueCm) <= 0) return
    pushHistory()
    setPlacedFurniture((current) => resizeFurnitureByDimension(current, selectedFurnitureId, axis, valueCm))
  }, [pushHistory, selectedFurnitureId, setPlacedFurniture])

  const handleImportJSON = useCallback((event) => {
    const file = event.target.files?.[0]
    if (!file) return
    event.target.value = ''

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data || typeof data !== 'object') throw new Error('잘못된 형식')

        const room = data.roomDimensions
        if (!room || typeof room.width !== 'number' || typeof room.depth !== 'number' || typeof room.height !== 'number') {
          throw new Error('roomDimensions 누락')
        }

        const furniture = Array.isArray(data.furniture) ? data.furniture : []
        pushHistory()

        setRoomDimensions({
          width: Math.min(Math.max(room.width, 3), 10),
          depth: Math.min(Math.max(room.depth, 3), 10),
          height: Math.min(Math.max(room.height, 2), 5),
        })

        if (data.planElements && typeof data.planElements === 'object') {
          setPlanElements({
            partition: { ...defaultPlanElements.partition, ...(data.planElements.partition ?? {}) },
            door: { ...defaultPlanElements.door, ...(data.planElements.door ?? {}) },
            window: { ...defaultPlanElements.window, ...(data.planElements.window ?? {}) },
          })
        }

        const imported = furniture.map((item, idx) => ({
          id: item.id ?? `imported-${Date.now()}-${idx}`,
          catalogId: item.catalogId ?? null,
          name: item.name ?? '가져온 가구',
          position: item.position ?? `가져온 배치 ${idx + 1}`,
          type: item.type ?? 'chair',
          brand: item.brand ?? '',
          finish: item.finish ?? '',
          x: typeof item.x === 'number' ? Math.min(Math.max(item.x, 0), 95) : 18,
          y: typeof item.y === 'number' ? Math.min(Math.max(item.y, 0), 90) : 18,
          rotation: typeof item.rotation === 'number' ? item.rotation : 0,
          scale: typeof item.scale === 'number' ? Math.min(Math.max(item.scale, 0.5), 2) : 1,
        }))

        setPlacedFurniture(imported)
        setSelectedFurnitureId(imported[0]?.id ?? '')
        setSelectedFurnitureIds(imported[0]?.id ? [imported[0].id] : [])

        const projectName = typeof data.projectName === 'string' ? data.projectName : file.name.replace('.json', '')
        setStatusMessage(`"${projectName}"에서 ${imported.length}개 가구를 불러왔습니다.`)
        setToastMessage(`JSON 가져오기 완료: ${imported.length}개 가구`)
      } catch (err) {
        setStatusMessage(`JSON 가져오기 실패: ${err.message}`)
        setToastMessage('파일 형식이 올바르지 않습니다.')
      }
    }
    reader.readAsText(file)
  }, [defaultPlanElements, pushHistory, setPlanElements, setPlacedFurniture, setRoomDimensions, setSelectedFurnitureId, setSelectedFurnitureIds, setStatusMessage, setToastMessage])

  const handleAddSelectedCatalogToEditor = useCallback((placementMode = 'auto') => {
    const item = selectedCatalog
    if (!item) return
    handleAddFurnitureToEditor(item, placementMode)
  }, [handleAddFurnitureToEditor, selectedCatalog])

  return {
    updateFurniturePosition,
    setFurnitureRotation,
    startDraggingFurnitureIn3D,
    endDraggingFurnitureIn3D,
    handleSelectFurniture,
    rotateSelectedFurniture,
    resizeSelectedFurniture,
    deleteSelectedFurniture,
    moveSelectedFurniture,
    duplicateSelectedFurniture,
    handleAutoArrangeFurniture,
    handleUpdateSelectedFurnitureField,
    handleAddFurnitureToEditor,
    handleFurnitureSizeChange,
    handleImportJSON,
    handleAddSelectedCatalogToEditor,
  }
}
