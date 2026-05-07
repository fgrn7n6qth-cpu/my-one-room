import { defaultDecorVisibility } from '../../data/styleTokens.js'

export const defaultPlanElements = {
  partition: { enabled: false, orientation: 'vertical', offset: 50 },
  door: { enabled: true, side: 'left', offset: 18 },
  window: { enabled: true, side: 'top', offset: 58 },
}

const defaultFurniture = [
  {
    id: 'editor-sofa',
    catalogId: 1,
    name: '모듈 소파',
    type: 'sofa',
    brand: 'RoomPlanner',
    finish: '샌드 패브릭',
    x: 22,
    y: 58,
    rotation: 0,
    scale: 1,
    position: 'X 22 / Y 58',
  },
  {
    id: 'editor-table',
    catalogId: 2,
    name: '라운드 사이드 테이블',
    type: 'table',
    brand: 'RoomPlanner',
    finish: '월넛 우드',
    x: 42,
    y: 42,
    rotation: 0,
    scale: 1,
    position: 'X 42 / Y 42',
  },
  {
    id: 'editor-chair',
    catalogId: 3,
    name: '코너 암체어',
    type: 'chair',
    brand: 'RoomPlanner',
    finish: '소프트 그레이',
    x: 34,
    y: 34,
    rotation: 15,
    scale: 1,
    position: 'X 34 / Y 34',
  },
  {
    id: 'editor-lamp',
    catalogId: 6,
    name: '스탠드 조명',
    type: 'lamp',
    brand: 'RoomPlanner',
    finish: '브론즈',
    x: 74,
    y: 22,
    rotation: 0,
    scale: 1,
    position: 'X 74 / Y 22',
  },
]

export const initialProjects = [
  {
    id: 1,
    name: '원룸 프로젝트 1',
    summary: '7평 원룸 / 5.6m x 4.2m / 초안 완료',
    status: '편집 가능',
    updatedAt: '방금 전',
    updatedAtISO: null,
    description: '원룸 레이아웃을 빠르게 검토하기 위한 기본 프로젝트입니다.',
    spaceType: '원룸',
    privacy: '비공개 링크',
  },
  {
    id: 2,
    name: '원룸 프로젝트 2',
    summary: '6평 원룸 / 4.7m x 4.2m / 작업 중',
    status: '작업 중',
    updatedAt: '3시간 전',
    updatedAtISO: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    description: '가구 배치와 동선을 비교 중인 원룸 프로젝트입니다.',
    spaceType: '원룸',
    privacy: '비공개 링크',
  },
]

export const initialProjectLayouts = {
  1: {
    placedFurniture: defaultFurniture,
    selectedFurnitureId: 'editor-sofa',
    selectedFurnitureIds: ['editor-sofa'],
    editorViewMode: '3D',
    cameraMode: 'orbit',
    tourViewpointId: 'entry',
    tourPose: null,
    selectedStyleId: 'minimal-living',
    decorVisibility: defaultDecorVisibility,
    planElements: defaultPlanElements,
    roomDimensions: { width: 5.6, depth: 4.2, height: 2.8 },
  },
  2: {
    placedFurniture: defaultFurniture,
    selectedFurnitureId: 'editor-sofa',
    selectedFurnitureIds: ['editor-sofa'],
    editorViewMode: '3D',
    cameraMode: 'orbit',
    tourViewpointId: 'entry',
    tourPose: null,
    selectedStyleId: 'minimal-living',
    decorVisibility: defaultDecorVisibility,
    planElements: defaultPlanElements,
    roomDimensions: { width: 4.7, depth: 4.2, height: 2.8 },
  },
}

export const tourViewpoints = [
  { id: 'entry', label: '입구' },
  { id: 'window', label: '창가' },
  { id: 'bed', label: '침대' },
  { id: 'detail', label: '디테일' },
]
