import { useEffect } from 'react'

function isTypingTarget(target) {
  return target instanceof HTMLElement && /input|textarea|select/i.test(target.tagName)
}

export function usePlannerShortcuts({
  currentView,
  undo,
  redo,
  setPlacedFurniture,
  setRoomDimensions,
  setPlanElements,
  hasSelectedFurniture,
  selectedCatalog,
  onDuplicateFurniture,
  onDeleteFurniture,
  onAddSelectedCatalog,
  editorViewMode,
  cameraMode,
  onMoveTourPose,
  onExitTourMode,
}) {
  useEffect(() => {
    const handler = (event) => {
      if (currentView !== 'editor') return
      const typing = isTypingTarget(event.target)
      const ctrl = event.ctrlKey || event.metaKey

      if (ctrl && event.key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo(setPlacedFurniture, setRoomDimensions, setPlanElements)
        return
      }

      if (ctrl && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
        event.preventDefault()
        redo(setPlacedFurniture, setRoomDimensions, setPlanElements)
        return
      }

      if (!typing && ctrl && event.key.toLowerCase() === 'd' && hasSelectedFurniture) {
        event.preventDefault()
        onDuplicateFurniture()
        return
      }

      if (!typing && (event.key === 'Delete' || event.key === 'Backspace') && hasSelectedFurniture) {
        event.preventDefault()
        onDeleteFurniture()
        return
      }

      if (!typing && event.key === 'Enter' && selectedCatalog) {
        event.preventDefault()
        onAddSelectedCatalog()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [
    currentView,
    hasSelectedFurniture,
    onAddSelectedCatalog,
    onDeleteFurniture,
    onDuplicateFurniture,
    redo,
    selectedCatalog,
    setPlacedFurniture,
    setPlanElements,
    setRoomDimensions,
    undo,
  ])

  useEffect(() => {
    const handler = (event) => {
      if (currentView !== 'editor' || editorViewMode !== '3D' || cameraMode !== 'tour') return
      if (isTypingTarget(event.target)) return

      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        event.preventDefault()
        onMoveTourPose('forward')
      } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        event.preventDefault()
        onMoveTourPose('backward')
      } else if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        event.preventDefault()
        onMoveTourPose('turn-left')
      } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        event.preventDefault()
        onMoveTourPose('turn-right')
      } else if (event.key.toLowerCase() === 'escape') {
        event.preventDefault()
        onExitTourMode()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cameraMode, currentView, editorViewMode, onExitTourMode, onMoveTourPose])
}
