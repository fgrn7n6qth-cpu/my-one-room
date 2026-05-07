import {
  cloneInitialLayouts,
  cloneInitialProjects,
  formatPyeong,
  formatRelativeTime,
  formatSaveTime,
} from './plannerState.js'
import { defaultDecorVisibility } from '../../data/styles.js'

export function createProjectRecord({ starter, projectCount, now, nextId }) {
  return {
    id: nextId,
    name: `${starter.name} 프로젝트 ${projectCount + 1}`,
    summary: `${starter.pyeongLabel} 원룸 · ${starter.roomDimensions.width}m × ${starter.roomDimensions.depth}m · 방금 생성`,
    status: '새로 생성됨',
    updatedAt: '방금 전',
    updatedAtISO: now,
    description: `${starter.pyeongLabel} 원룸 크기로 바로 시작하는 프로젝트입니다.`,
    spaceType: '원룸',
    privacy: '읽기 전용 링크',
  }
}

export function createProjectLayout({ starter, firstStyleId, firstTourViewpointId, defaultPlanElements }) {
  return {
    placedFurniture: [],
    selectedFurnitureId: '',
    selectedFurnitureIds: [],
    editorViewMode: '2D',
    cameraMode: 'orbit',
    tourViewpointId: firstTourViewpointId,
    tourPose: null,
    selectedStyleId: firstStyleId,
    decorVisibility: defaultDecorVisibility,
    planElements: defaultPlanElements,
    roomDimensions: starter.roomDimensions,
  }
}

export function duplicateProjectRecord(project, nextId, now) {
  return {
    ...project,
    id: nextId,
    name: `${project.name} 복제본`,
    status: '복제됨',
    summary: `${project.summary} · 복제본`,
    updatedAt: '방금 전',
    updatedAtISO: now,
  }
}

export function createFallbackLayout({ firstStyleId, firstTourViewpointId }) {
  return {
    placedFurniture: [],
    selectedFurnitureId: '',
    selectedFurnitureIds: [],
    editorViewMode: '2D',
    cameraMode: 'orbit',
    tourViewpointId: firstTourViewpointId,
    tourPose: null,
    selectedStyleId: firstStyleId,
    decorVisibility: defaultDecorVisibility,
    roomDimensions: { width: 5.6, depth: 4.2, height: 2.8 },
  }
}

export function removeProjectData({ projects, projectLayouts, selectedProjectId }) {
  const remainingProjects = projects.filter((p) => p.id !== selectedProjectId)
  const nextLayouts = { ...projectLayouts }
  delete nextLayouts[selectedProjectId]
  return { remainingProjects, nextLayouts, nextProject: remainingProjects[0] ?? null }
}

export function createResetDemoState({ firstCatalogId, firstStyleId, firstTourViewpointId, defaultPlanElements }) {
  const projects = cloneInitialProjects()
  const layouts = cloneInitialLayouts()
  return {
    projects,
    layouts,
    selectedProjectId: projects[0].id,
    selectedCatalogId: firstCatalogId,
    selectedStyleId: firstStyleId,
    decorVisibility: defaultDecorVisibility,
    projectNameDraft: projects[0].name,
    layout: layouts[1],
    currentView: 'home',
    activeTab: 'home',
    shareProjectId: null,
    showOnboarding: true,
    showStarterPicker: false,
    toastMessage: '데모 데이터를 초기화했습니다.',
    fallback: {
      planElements: defaultPlanElements,
      tourViewpointId: firstTourViewpointId,
    },
  }
}

export function createSavedProjectMeta(project, roomDimensions, now) {
  return {
    ...project,
    summary: `${formatPyeong(roomDimensions.width, roomDimensions.depth)} ${project.spaceType} · ${roomDimensions.width.toFixed(1)}m × ${roomDimensions.depth.toFixed(1)}m · 방금 저장됨`,
    status: '저장 완료',
    updatedAt: formatSaveTime(now),
    updatedAtISO: now,
  }
}

export function createRoomPyeongProjectMeta(project, starter) {
  return {
    ...project,
    spaceType: '원룸',
    summary: `${starter.pyeongLabel} 원룸 · ${starter.roomDimensions.width}m × ${starter.roomDimensions.depth}m · ${project.updatedAtISO ? formatRelativeTime(project.updatedAtISO) : (project.updatedAt ?? '방금 전')}`,
  }
}
