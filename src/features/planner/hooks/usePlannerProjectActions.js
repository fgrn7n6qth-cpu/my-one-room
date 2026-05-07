import { useCallback } from 'react'
import {
  createFallbackLayout,
  createProjectLayout,
  createProjectRecord,
  createResetDemoState,
  createRoomPyeongProjectMeta,
  createSavedProjectMeta,
  duplicateProjectRecord,
  removeProjectData,
} from '../plannerProjects.js'

export function usePlannerProjectActions({
  projects,
  projectLayouts,
  selectedProject,
  selectedProjectId,
  currentView,
  roomDimensions,
  catalogItems,
  stylePresets,
  tourViewpoints,
  defaultPlanElements,
  buildStudioStarter,
  cloneInitialLoadWorkspace,
  saveLayoutSnapshot,
  setProjects,
  setProjectLayouts,
  setSelectedProjectId,
  setPlacedFurniture,
  setSelectedFurnitureId,
  setSelectedFurnitureIds,
  setEditorViewMode,
  setCameraMode,
  setTourViewpointId,
  setTourPose,
  setPlanElements,
  setRoomDimensions,
  setSelectedStyleId,
  setDecorVisibility,
  setProjectDescriptionDraft,
  setProjectSpaceTypeDraft,
  setProjectPrivacyDraft,
  setProjectNameDraft,
  setCurrentView,
  setShowStarterPicker,
  setStatusMessage,
  setActiveTab,
  setSelectedCatalogId,
  setCatalogCategory,
  setCatalogQuery,
  setShareProjectId,
  setShowOnboarding,
  setToastMessage,
  defaultDecorVisibility,
}) {
  const handleCreateProject = useCallback((starter = buildStudioStarter(7)) => {
    const now = new Date().toISOString()
    const nextId = Date.now()
    const nextProject = createProjectRecord({ starter, projectCount: projects.length, now, nextId })

    setProjects((current) => [nextProject, ...current])
    setProjectLayouts((current) => ({
      ...current,
      [nextId]: createProjectLayout({
        starter,
        firstStyleId: stylePresets[0].id,
        firstTourViewpointId: tourViewpoints[0].id,
        defaultPlanElements,
      }),
    }))

    setSelectedProjectId(nextId)
    setPlacedFurniture([])
    setSelectedFurnitureId('')
    setSelectedFurnitureIds([])
    setEditorViewMode('2D')
    setCameraMode('orbit')
    setTourViewpointId(tourViewpoints[0].id)
    setTourPose(null)
    setPlanElements(defaultPlanElements)
    setRoomDimensions(starter.roomDimensions)
    setSelectedStyleId(stylePresets[0].id)
    setDecorVisibility(defaultDecorVisibility)
    setProjectDescriptionDraft(nextProject.description)
    setProjectSpaceTypeDraft(nextProject.spaceType)
    setProjectPrivacyDraft(nextProject.privacy)
    setCurrentView('editor')
    setShowStarterPicker(false)
    setStatusMessage(`${starter.pyeongLabel} 원룸 프로젝트를 만들었습니다.`)
  }, [buildStudioStarter, defaultDecorVisibility, defaultPlanElements, projects.length, setCameraMode, setCurrentView, setDecorVisibility, setEditorViewMode, setPlacedFurniture, setPlanElements, setProjectDescriptionDraft, setProjectLayouts, setProjectPrivacyDraft, setProjects, setProjectSpaceTypeDraft, setRoomDimensions, setSelectedFurnitureId, setSelectedFurnitureIds, setSelectedProjectId, setSelectedStyleId, setShowStarterPicker, setStatusMessage, setTourPose, setTourViewpointId, stylePresets, tourViewpoints])

  const openStarterPicker = useCallback(() => {
    setShowStarterPicker(true)
    setStatusMessage('시작할 원룸 크기를 선택해주세요.')
  }, [setShowStarterPicker, setStatusMessage])

  const handleOpenEditor = useCallback((projectId = selectedProjectId) => {
    if (!projectId) {
      setStatusMessage('열 프로젝트를 먼저 선택해주세요.')
      return
    }

    setSelectedProjectId(projectId)
    cloneInitialLoadWorkspace(projectId)
    setCurrentView('editor')

    const target = projects.find((project) => project.id === projectId) ?? selectedProject
    setStatusMessage(`${target?.name ?? '선택한 프로젝트'} 편집 화면으로 이동했습니다.`)
  }, [cloneInitialLoadWorkspace, projects, selectedProject, selectedProjectId, setCurrentView, setSelectedProjectId, setStatusMessage])

  const handleDuplicateProject = useCallback(() => {
    if (!selectedProject) return

    const nextId = Date.now()
    setProjects((current) => [duplicateProjectRecord(selectedProject, nextId, new Date().toISOString()), ...current])

    const sourceLayout = projectLayouts[selectedProjectId]
    setProjectLayouts((current) => ({
      ...current,
      [nextId]: sourceLayout
        ? JSON.parse(JSON.stringify(sourceLayout))
        : createFallbackLayout({
            firstStyleId: stylePresets[0].id,
            firstTourViewpointId: tourViewpoints[0].id,
          }),
    }))

    setSelectedProjectId(nextId)
    setStatusMessage(`${selectedProject.name} 프로젝트를 복제했습니다.`)
  }, [projectLayouts, selectedProject, selectedProjectId, setProjectLayouts, setProjects, setSelectedProjectId, setStatusMessage, stylePresets, tourViewpoints])

  const handleDeleteProject = useCallback((projectId = selectedProjectId) => {
    const projectToDelete = projects.find((project) => project.id === projectId) ?? selectedProject
    if (!projectToDelete) return

    const deletedName = projectToDelete.name
    const { remainingProjects, nextLayouts, nextProject } = removeProjectData({
      projects,
      projectLayouts,
      selectedProjectId: projectId,
    })

    setProjects(remainingProjects)
    setProjectLayouts(nextLayouts)

    if (nextProject) {
      setSelectedProjectId(nextProject.id)
      if (currentView === 'editor' && projectId === selectedProjectId) {
        cloneInitialLoadWorkspace(nextProject.id, nextLayouts)
      }
    } else {
      setSelectedProjectId(null)
      setActiveTab('home')
      setCurrentView('home')
      setPlacedFurniture([])
      setSelectedFurnitureId('')
      setSelectedFurnitureIds([])
      setEditorViewMode('2D')
      setCameraMode('orbit')
      setTourViewpointId(tourViewpoints[0].id)
      setTourPose(null)
      setPlanElements(defaultPlanElements)
      setRoomDimensions({ width: 5.6, depth: 4.2, height: 2.8 })
    }

    setStatusMessage(`${deletedName} 프로젝트를 삭제했습니다.`)
  }, [cloneInitialLoadWorkspace, currentView, defaultPlanElements, projectLayouts, projects, selectedProject, selectedProjectId, setActiveTab, setCameraMode, setCurrentView, setEditorViewMode, setPlacedFurniture, setPlanElements, setProjectLayouts, setProjects, setRoomDimensions, setSelectedFurnitureId, setSelectedFurnitureIds, setSelectedProjectId, setStatusMessage, setTourPose, setTourViewpointId, tourViewpoints])

  const handleResetDemoData = useCallback(() => {
    const resetState = createResetDemoState({
      firstCatalogId: catalogItems[0]?.id ?? null,
      firstStyleId: stylePresets[0].id,
      firstTourViewpointId: tourViewpoints[0].id,
      defaultPlanElements,
    })

    setProjects(resetState.projects)
    setProjectLayouts(resetState.layouts)
    setSelectedProjectId(resetState.selectedProjectId)
    setSelectedCatalogId(resetState.selectedCatalogId)
    setSelectedStyleId(resetState.selectedStyleId)
    setDecorVisibility(resetState.decorVisibility)
    setProjectNameDraft(resetState.projectNameDraft)
    setPlacedFurniture(resetState.layout.placedFurniture)
    setSelectedFurnitureId(resetState.layout.selectedFurnitureId)
    setSelectedFurnitureIds(resetState.layout.selectedFurnitureIds ?? (resetState.layout.selectedFurnitureId ? [resetState.layout.selectedFurnitureId] : []))
    setEditorViewMode(resetState.layout.editorViewMode)
    setCameraMode(resetState.layout.cameraMode ?? 'orbit')
    setTourViewpointId(resetState.layout.tourViewpointId ?? tourViewpoints[0].id)
    setTourPose(resetState.layout.tourPose ?? null)
    setPlanElements(resetState.layout.planElements ?? resetState.fallback.planElements)
    setRoomDimensions(resetState.layout.roomDimensions)
    setCatalogCategory('전체')
    setCatalogQuery('')
    setCurrentView(resetState.currentView)
    setActiveTab(resetState.activeTab)
    setShareProjectId(resetState.shareProjectId)
    setShowOnboarding(resetState.showOnboarding)
    setShowStarterPicker(resetState.showStarterPicker)
    setToastMessage(resetState.toastMessage)
  }, [catalogItems, defaultPlanElements, setActiveTab, setCameraMode, setCatalogCategory, setCatalogQuery, setCurrentView, setDecorVisibility, setEditorViewMode, setPlacedFurniture, setPlanElements, setProjectLayouts, setProjectNameDraft, setProjects, setRoomDimensions, setSelectedCatalogId, setSelectedFurnitureId, setSelectedFurnitureIds, setSelectedProjectId, setSelectedStyleId, setShareProjectId, setShowOnboarding, setShowStarterPicker, setToastMessage, setTourPose, setTourViewpointId, stylePresets, tourViewpoints])

  const handleSaveProject = useCallback(() => {
    const now = new Date().toISOString()
    setProjectLayouts((current) => ({ ...current, [selectedProjectId]: saveLayoutSnapshot() }))
    setProjects((current) => current.map((project) => (
      project.id !== selectedProjectId ? project : createSavedProjectMeta(project, roomDimensions, now)
    )))
    setStatusMessage(`${selectedProject?.name} 프로젝트를 저장했습니다.`)
  }, [roomDimensions, saveLayoutSnapshot, selectedProject?.name, selectedProjectId, setProjectLayouts, setProjects, setStatusMessage])

  const handleRoomPyeongChange = useCallback((value, pushHistory) => {
    const starter = buildStudioStarter(value)
    if (currentView === 'editor') pushHistory()

    setRoomDimensions(starter.roomDimensions)
    setProjectSpaceTypeDraft('원룸')
    setProjectLayouts((current) => ({
      ...current,
      [selectedProjectId]: { ...(current[selectedProjectId] ?? {}), roomDimensions: starter.roomDimensions },
    }))
    setProjects((current) => current.map((project) => (
      project.id !== selectedProjectId ? project : createRoomPyeongProjectMeta(project, starter)
    )))
    setStatusMessage(`${starter.pyeongLabel} 원룸 크기로 조정했습니다.`)
  }, [buildStudioStarter, currentView, selectedProjectId, setProjectLayouts, setProjects, setProjectSpaceTypeDraft, setRoomDimensions, setStatusMessage])

  return {
    handleCreateProject,
    openStarterPicker,
    handleOpenEditor,
    handleDuplicateProject,
    handleDeleteProject,
    handleResetDemoData,
    handleSaveProject,
    handleRoomPyeongChange,
  }
}
