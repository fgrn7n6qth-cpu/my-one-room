import {
  defaultPlanElements,
  initialProjectLayouts,
  initialProjects,
  tourViewpoints,
} from './plannerSeed.js'

export const STORAGE_KEY = 'room-planner-home-styler-state'
export const AUTH_STORAGE_KEY = 'room-planner-auth-token'
export const SNAP_GRID_M = 0.25
export const WALL_SNAP_PCT = 3

export const highlights = [
  { value: '2D + 3D', label: '평면과 3D 공간을 바로 오가며 확인' },
  { value: '실시간 배치', label: '가구를 움직이면 화면에 즉시 반영' },
  { value: '스타일 보드', label: '분위기와 가구 조합을 빠르게 비교' },
]

export const quickCards = [
  {
    id: 'new-room',
    title: '빈 공간에서 시작',
    body: '기본 방 크기를 고르고 2D와 3D를 오가며 원룸을 바로 만들어보세요.',
    tone: 'soft-sand',
    eyebrow: '2D Plan',
    tag: '기본 구조',
    summary: '방 구조와 동선을 먼저 잡는 시작 화면',
    actionLabel: '시작하기',
  },
  {
    id: 'browse-style',
    title: '스타일 둘러보기',
    body: '색감과 소재 조합을 비교하면서 내 취향에 맞는 원룸 무드를 골라보세요.',
    tone: 'soft-mist',
    eyebrow: 'Style Board',
    tag: '무드 비교',
    summary: '거실형, 작업형, 휴식형 분위기를 비교',
    actionLabel: '스타일 보기',
  },
  {
    id: 'save-flow',
    title: '프로젝트 관리',
    body: '레이아웃과 가구 배치를 저장하고 최근 작업을 이어서 확인할 수 있습니다.',
    tone: 'soft-olive',
    eyebrow: 'Project Flow',
    tag: '진행 관리',
    summary: '최근 작업과 저장한 배치를 바로 이어서 확인',
    actionLabel: '프로젝트 열기',
  },
]

export const overviewStats = [
  { label: '생성한 프로젝트', value: '08' },
  { label: '즐겨찾기 스타일', value: '14' },
  { label: '배치한 가구', value: '126' },
  { label: '공유 링크', value: '05' },
]

export const workflowSteps = [
  { title: '방 구조 정리', body: '방 크기와 문, 창문 위치를 먼저 정리해 기본 틀을 만듭니다.' },
  { title: '가구 배치', body: '카탈로그에서 필요한 가구를 고르고 배치해 동선을 확인합니다.' },
  { title: '스타일 조정', body: '공간 색감과 배치 균형을 보며 원하는 분위기를 완성합니다.' },
]

export const trendNotes = [
  '이번 주 인기 무드는 베이지와 월넛 조합',
  '가장 많이 선택된 조명은 스탠드와 테이블 램프',
  '추천 배치는 1인 원룸용 작업 공간 분리 레이아웃',
]

export const onboardingSteps = [
  '새 프로젝트를 만들고 방 크기를 먼저 정합니다.',
  '카탈로그에서 가구를 선택해 원하는 위치에 추가합니다.',
  '이동, 회전, 크기 조절 결과를 프로젝트별로 저장합니다.',
]

export const tabs = [
  { id: 'home', label: '홈' },
  { id: 'projects', label: '프로젝트' },
  { id: 'account', label: '내 정보' },
]

export const tabGuideById = {
  home: {
    title: '시작 화면',
    description: '새 프로젝트를 만들거나 최근 작업 흐름으로 바로 들어갈 수 있습니다.',
    tasks: ['새 프로젝트 만들기', '스타일 둘러보기', '최근 작업 이어가기'],
  },
  projects: {
    title: '프로젝트 관리',
    description: '프로젝트를 고르고 이름과 소개를 정리한 뒤 편집 화면으로 이동합니다.',
    tasks: ['프로젝트 선택', '프로젝트 열기', '이름과 소개 수정'],
  },
  account: {
    title: '내 정보',
    description: '현재 로그인한 계정 정보를 확인하고 수정하거나 회원탈퇴를 진행할 수 있습니다.',
    tasks: ['계정 정보 확인', '프로필 수정', '회원탈퇴'],
  },
}

export const tabStepsById = {
  projects: [
    { step: '1', title: '프로젝트 선택', body: '최근 프로젝트를 고르거나 새 원룸을 만듭니다.' },
    { step: '2', title: '정보 확인', body: '이름, 공간 타입, 소개 문구를 정리합니다.' },
    { step: '3', title: '편집 시작', body: '프로젝트 열기를 눌러 2D와 3D 편집기로 이동합니다.' },
  ],
  account: [
    { step: '1', title: '계정 확인', body: '현재 로그인한 이름, 이메일, 연락처를 확인합니다.' },
    { step: '2', title: '프로필 수정', body: '이름, 전화번호, 주소를 수정하고 저장합니다.' },
    { step: '3', title: '회원탈퇴', body: '필요할 때만 확인 절차를 거쳐 계정을 삭제합니다.' },
  ],
}

export const starterTypes = [
  {
    id: 'studio',
    label: '원룸',
    description: '원룸 꾸미기를 바로 시작할 수 있는 기본 타입입니다.',
    roomDimensions: { width: 5.6, depth: 4.2, height: 2.8 },
    pyeongLabel: '7평형',
  },
]

export {
  defaultPlanElements,
  initialProjectLayouts,
  initialProjects,
  tourViewpoints,
}

export const editorFurniture = []
