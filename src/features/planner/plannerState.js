import { defaultCatalogItemId, isValidCatalogItemId } from '../../data/catalogTokens.js'
import { defaultDecorVisibility, defaultStylePresetId, stylePresetIds } from '../../data/styleTokens.js'
import {
  defaultPlanElements,
  initialProjectLayouts,
  initialProjects,
  tourViewpoints,
} from './plannerSeed.js'

export function formatRelativeTime(isoString) {
  if (!isoString) return '방금 전'
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export function formatSaveTime(isoString) {
  if (!isoString) return '방금 전'
  const d = new Date(isoString)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} 저장`
}

export function formatPyeong(width, depth) {
  return `${Math.round((width * depth) / 3.3058)}평형`
}

export function buildShareLink(projectId) {
  return `https://room-planner.app/share/${projectId}`
}

export function buildWorkspaceState(payload) {
  return {
    activeTab: payload.activeTab,
    currentView: payload.currentView,
    projects: payload.projects,
    projectLayouts: payload.projectLayouts,
    selectedProjectId: payload.selectedProjectId,
    selectedCatalogId: payload.selectedCatalogId,
    selectedStyleId: payload.selectedStyleId,
    decorVisibility: payload.decorVisibility,
    showOnboarding: payload.showOnboarding,
    showStarterPicker: payload.showStarterPicker,
  }
}

export function cloneInitialLayouts() {
  return sanitizeProjectLayouts(JSON.parse(JSON.stringify(initialProjectLayouts)), initialProjects)
}

export function cloneInitialProjects() {
  return JSON.parse(JSON.stringify(initialProjects))
}

export function sanitizeRoomDimensions(room) {
  return {
    width: typeof room?.width === 'number' ? Math.min(Math.max(room.width, 3), 10) : 5.6,
    depth: typeof room?.depth === 'number' ? Math.min(Math.max(room.depth, 3), 10) : 4.2,
    height: typeof room?.height === 'number' ? Math.min(Math.max(room.height, 2.2), 5) : 2.8,
  }
}

export function sanitizePlanElements(planElements) {
  return {
    partition: {
      ...defaultPlanElements.partition,
      ...(planElements?.partition ?? {}),
      enabled: false,
      orientation: planElements?.partition?.orientation === 'horizontal' ? 'horizontal' : 'vertical',
      offset: typeof planElements?.partition?.offset === 'number' ? planElements.partition.offset : defaultPlanElements.partition.offset,
    },
    door: {
      ...defaultPlanElements.door,
      ...(planElements?.door ?? {}),
      enabled: planElements?.door?.enabled ?? defaultPlanElements.door.enabled,
      side: ['top', 'right', 'bottom', 'left'].includes(planElements?.door?.side) ? planElements.door.side : defaultPlanElements.door.side,
      offset: typeof planElements?.door?.offset === 'number' ? planElements.door.offset : defaultPlanElements.door.offset,
    },
    window: {
      ...defaultPlanElements.window,
      ...(planElements?.window ?? {}),
      enabled: planElements?.window?.enabled ?? defaultPlanElements.window.enabled,
      side: ['top', 'right', 'bottom', 'left'].includes(planElements?.window?.side) ? planElements.window.side : defaultPlanElements.window.side,
      offset: typeof planElements?.window?.offset === 'number' ? planElements.window.offset : defaultPlanElements.window.offset,
    },
  }
}

export function sanitizeFurnitureArray(items) {
  if (!Array.isArray(items)) return []
  return items.map((item, index) => ({
    id: typeof item?.id === 'string' || typeof item?.id === 'number' ? String(item.id) : `restored-${index}`,
    catalogId: typeof item?.catalogId === 'number' ? item.catalogId : null,
    name: typeof item?.name === 'string' && item.name.trim() ? item.name : `가구 ${index + 1}`,
    position: typeof item?.position === 'string' ? item.position : `배치 ${index + 1}`,
    type: typeof item?.type === 'string' ? item.type : 'chair',
    brand: typeof item?.brand === 'string' ? item.brand : '',
    finish: typeof item?.finish === 'string' ? item.finish : '',
    x: typeof item?.x === 'number' ? Math.min(Math.max(item.x, 0), 95) : 18,
    y: typeof item?.y === 'number' ? Math.min(Math.max(item.y, 0), 90) : 18,
    rotation: typeof item?.rotation === 'number' ? item.rotation : 0,
    scale: typeof item?.scale === 'number' ? Math.min(Math.max(item.scale, 0.5), 2) : 1,
  }))
}

export function sanitizeDecorVisibility(visibility) {
  return {
    ...defaultDecorVisibility,
    ...(visibility && typeof visibility === 'object' ? visibility : {}),
  }
}

export function sanitizeLayout(layout, fallbackProject = initialProjects[0]) {
  const safeFurniture = sanitizeFurnitureArray(layout?.placedFurniture)
  const safeStyleId = typeof layout?.selectedStyleId === 'string' && stylePresetIds.includes(layout.selectedStyleId)
    ? layout.selectedStyleId
    : defaultStylePresetId
  const safeSelectedId = typeof layout?.selectedFurnitureId === 'string' && safeFurniture.some((item) => item.id === layout.selectedFurnitureId)
    ? layout.selectedFurnitureId
    : (safeFurniture[0]?.id ?? '')
  const safeSelectedIds = Array.isArray(layout?.selectedFurnitureIds)
    ? layout.selectedFurnitureIds.filter((id) => typeof id === 'string' && safeFurniture.some((item) => item.id === id))
    : (safeSelectedId ? [safeSelectedId] : [])

  return {
    placedFurniture: safeFurniture,
    selectedFurnitureId: safeSelectedId,
    selectedFurnitureIds: safeSelectedIds,
    editorViewMode: layout?.editorViewMode === '3D' ? '3D' : '2D',
    cameraMode: layout?.cameraMode === 'tour' ? 'tour' : 'orbit',
    tourViewpointId: typeof layout?.tourViewpointId === 'string' && tourViewpoints.some((view) => view.id === layout.tourViewpointId)
      ? layout.tourViewpointId
      : tourViewpoints[0].id,
    tourPose: layout?.tourPose && typeof layout.tourPose === 'object' ? {
      x: typeof layout.tourPose.x === 'number' ? layout.tourPose.x : 0,
      y: typeof layout.tourPose.y === 'number' ? layout.tourPose.y : 1.55,
      z: typeof layout.tourPose.z === 'number' ? layout.tourPose.z : 0,
      yaw: typeof layout.tourPose.yaw === 'number' ? layout.tourPose.yaw : 0,
      pitch: typeof layout.tourPose.pitch === 'number' ? layout.tourPose.pitch : -3,
    } : null,
    selectedStyleId: safeStyleId,
    decorVisibility: sanitizeDecorVisibility(layout?.decorVisibility),
    planElements: sanitizePlanElements(layout?.planElements),
    roomDimensions: sanitizeRoomDimensions(layout?.roomDimensions ?? fallbackProject?.roomDimensions),
  }
}

export function sanitizeProjectLayouts(layouts, projects = initialProjects) {
  const next = {}
  projects.forEach((project) => {
    next[project.id] = sanitizeLayout(layouts?.[project.id], project)
  })
  return next
}

export function sanitizeWorkspaceState(saved) {
  const nextProjects = Array.isArray(saved?.projects) && saved.projects.length > 0 ? saved.projects : initialProjects
  const nextLayouts = sanitizeProjectLayouts(saved?.projectLayouts, nextProjects)
  const nextProjectId = typeof saved?.selectedProjectId === 'number' && nextProjects.some((project) => project.id === saved.selectedProjectId)
    ? saved.selectedProjectId
    : nextProjects[0].id
  const nextView = saved?.currentView === 'editor' && nextLayouts[nextProjectId] ? 'editor' : 'home'
  const nextTab = ['home', 'projects', 'account'].includes(saved?.activeTab) ? saved.activeTab : 'home'
  const nextCatalogId = typeof saved?.selectedCatalogId === 'number' && isValidCatalogItemId(saved.selectedCatalogId)
    ? saved.selectedCatalogId
    : defaultCatalogItemId
  const nextStyleId = typeof saved?.selectedStyleId === 'string' && stylePresetIds.includes(saved.selectedStyleId)
    ? saved.selectedStyleId
    : defaultStylePresetId

  return {
    activeTab: nextTab,
    currentView: nextView,
    projects: nextProjects,
    projectLayouts: nextLayouts,
    selectedProjectId: nextProjectId,
    selectedCatalogId: nextCatalogId,
    selectedStyleId: nextStyleId,
    decorVisibility: sanitizeDecorVisibility(saved?.decorVisibility),
    showOnboarding: typeof saved?.showOnboarding === 'boolean' ? saved.showOnboarding : true,
    showStarterPicker: typeof saved?.showStarterPicker === 'boolean' ? saved.showStarterPicker : false,
  }
}

export function getFurnitureType(name) {
  if (name.includes('소파')) return 'sofa'
  if (name.includes('조명') || name.includes('램프')) return 'lamp'
  if (name.includes('테이블') || name.includes('콘솔')) return 'table'
  if (name.includes('침대')) return 'bed'
  if (name.includes('서랍')) return 'dresser'
  if (name.includes('책장') || name.includes('북케이스') || name.includes('선반')) return 'bookcase'
  if (name.includes('옷장')) return 'wardrobe'
  if (name.includes('협탁')) return 'bedside'
  if (name.includes('수납')) return 'storage'
  return 'chair'
}
