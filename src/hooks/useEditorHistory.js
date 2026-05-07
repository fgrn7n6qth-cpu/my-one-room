import { useRef } from 'react'

const MAX_HISTORY = 60

/**
 * Undo/Redo system for editor state.
 * Stores snapshots of { placedFurniture, roomDimensions, planElements }.
 *
 * Usage:
 *   const { pushHistory, undo, redo, canUndo, canRedo } = useEditorHistory(stateRefs)
 *   stateRefs = { placedFurniture, roomDimensions, planElements } as refs
 */
export function useEditorHistory({ placedFurnitureRef, roomDimensionsRef, planElementsRef }) {
  const stackRef = useRef([])
  const indexRef = useRef(-1)

  /** Save current state before a mutation. Call BEFORE calling setters. */
  function pushHistory() {
    const snapshot = {
      placedFurniture: JSON.parse(JSON.stringify(placedFurnitureRef.current)),
      roomDimensions: { ...roomDimensionsRef.current },
      planElements: JSON.parse(JSON.stringify(planElementsRef.current)),
    }
    // Discard any redo states ahead of current index
    const newStack = stackRef.current.slice(0, indexRef.current + 1)
    newStack.push(snapshot)
    // Limit history length
    if (newStack.length > MAX_HISTORY) {
      newStack.splice(0, newStack.length - MAX_HISTORY)
    }
    stackRef.current = newStack
    indexRef.current = newStack.length - 1
  }

  function undo(setPlacedFurniture, setRoomDimensions, setPlanElements) {
    if (indexRef.current <= 0) return false
    indexRef.current -= 1
    const snapshot = stackRef.current[indexRef.current]
    setPlacedFurniture(snapshot.placedFurniture)
    setRoomDimensions(snapshot.roomDimensions)
    setPlanElements(snapshot.planElements)
    return true
  }

  function redo(setPlacedFurniture, setRoomDimensions, setPlanElements) {
    if (indexRef.current >= stackRef.current.length - 1) return false
    indexRef.current += 1
    const snapshot = stackRef.current[indexRef.current]
    setPlacedFurniture(snapshot.placedFurniture)
    setRoomDimensions(snapshot.roomDimensions)
    setPlanElements(snapshot.planElements)
    return true
  }

  const canUndo = () => indexRef.current > 0
  const canRedo = () => indexRef.current < stackRef.current.length - 1

  return { pushHistory, undo, redo, canUndo, canRedo }
}
