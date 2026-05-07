import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { Suspense, lazy } from 'react'

import { catalogItems, getCatalogItemForFurniture } from './data/catalogItems.js'
import { furnitureMetricMap, getScaledBounds, getOBBCorners, satOverlap } from './data/furniture.js'
import {
  stylePresets,
  defaultDecorVisibility,
  styleCatalogRecommendations,
} from './data/styles.js'
import { getTourStopConfig } from './data/style3d.js'
import { useEditorHistory } from './hooks/useEditorHistory.js'
import { usePlannerShortcuts } from './features/planner/hooks/usePlannerShortcuts.js'
import { usePlannerEditorActions } from './features/planner/hooks/usePlannerEditorActions.js'
import { usePlannerProjectActions } from './features/planner/hooks/usePlannerProjectActions.js'
import { deleteMe, fetchMe, logout, startSocialLogin, updateProfile } from './services/auth.js'
import { fetchWorkspace, saveWorkspace } from './services/workspace.js'
import AccountPanel from './components/dashboard/AccountPanel.jsx'
import HomePanel from './components/dashboard/HomePanel.jsx'
import DeleteAccountModal from './components/modals/DeleteAccountModal.jsx'
import OnboardingModal from './components/modals/OnboardingModal.jsx'
import ProfileSetupModal from './components/modals/ProfileSetupModal.jsx'
import ShareProjectModal from './components/modals/ShareProjectModal.jsx'
import StarterPickerModal from './components/modals/StarterPickerModal.jsx'
import {
  AUTH_STORAGE_KEY,
  SNAP_GRID_M,
  STORAGE_KEY,
  defaultPlanElements,
  initialProjects,
  onboardingSteps,
  tabStepsById,
  tabs,
  tourViewpoints,
} from './features/planner/plannerConfig.js'
import { getFilteredCatalogItems } from './features/planner/plannerCatalog.js'
import { getCanvasFootprint } from './features/planner/plannerFurniture.js'
import { getTourViewpointLabel } from './features/planner/plannerTour.js'
import {
  buildShareLink,
  buildWorkspaceState,
  cloneInitialLayouts,
  cloneInitialProjects,
  formatPyeong,
  formatRelativeTime,
  getFurnitureType,
  sanitizeDecorVisibility,
  sanitizeLayout,
  sanitizeWorkspaceState,
} from './features/planner/plannerState.js'

const Planner3DCanvas = lazy(() => import('./components/Planner3DCanvas.jsx'))
const AuthScreen = lazy(() => import('./components/AuthScreen.jsx'))
const ProjectThumbnail = lazy(() =>
  import('./components/ProjectPreview.jsx').then((module) => ({ default: module.ProjectThumbnail })),
)
const WorkspaceSteps = lazy(() =>
  import('./components/ProjectPreview.jsx').then((module) => ({ default: module.WorkspaceSteps })),
)

const MIN_STUDIO_PYEONG = 7
const MAX_STUDIO_PYEONG = 10
const STUDIO_HEIGHT_M = 2.8

const recommendationSeed = [
  {
    type: 'desk',
    keyword: '원룸 컴퓨터 책상 1200 화이트',
    title: '작업 책상',
    reason: '노트북이나 데스크톱을 쓰는 공간을 분리하면 원룸에서도 생활 동선이 훨씬 정리됩니다.',
    placement: 'wall',
  },
  {
    type: 'chair',
    keyword: '원룸 책상 의자 컴팩트 등받이',
    title: '컴팩트 의자',
    reason: '책상과 함께 쓰기 좋은 작은 의자를 두면 작업 공간이 바로 완성됩니다.',
    placement: 'center',
  },
  {
    type: 'openShelf',
    fallbackType: 'shelf',
    keyword: '원룸 수납 선반 슬림 3단',
    title: '슬림 수납 선반',
    reason: '바닥 면적을 적게 쓰면서 자주 쓰는 물건을 정리할 수 있어 좁은 방에 잘 맞습니다.',
    placement: 'wall',
  },
  {
    type: 'tableLamp',
    fallbackType: 'lamp',
    keyword: '무드등 테이블 램프 원룸 침대 협탁',
    title: '무드 조명',
    reason: '큰 가구를 늘리지 않아도 조명 하나로 방 분위기를 부드럽게 바꿀 수 있습니다.',
    placement: 'window',
  },
  {
    type: 'rug',
    keyword: '원룸 러그 미니 사이즈 워셔블',
    title: '미니 러그',
    reason: '침대나 책상 주변 영역을 가볍게 나눠주어 공간이 덜 흩어져 보입니다.',
    placement: 'center',
  },
  {
    type: 'trolley',
    keyword: '이동식 트롤리 수납 원룸 3단',
    title: '이동식 트롤리',
    reason: '필요할 때 옮겨 쓰기 쉬워 주방, 책상, 침대 옆을 유연하게 보완합니다.',
    placement: 'wall',
  },
]

function buildRoomDiagnosis({ placedFurniture, roomDimensions, collisionCount }) {
  const placedTypes = new Set(placedFurniture.map((item) => item.type))
  const hasWorkSetup = placedTypes.has('desk') || placedTypes.has('computer')
  const hasStorage = ['storage', 'dresser', 'bookcase', 'openShelf', 'shelf', 'wardrobe'].some((type) => placedTypes.has(type))
  const hasMoodLight = ['lamp', 'tableLamp'].some((type) => placedTypes.has(type))
  const roomArea = roomDimensions.width * roomDimensions.depth
  const issues = []

  if (!hasWorkSetup) issues.push('작업 공간이 아직 비어 있어요')
  if (!hasStorage) issues.push('수납 가구가 부족해 보여요')
  if (!hasMoodLight) issues.push('분위기를 잡아줄 조명이 없어요')
  if (collisionCount > 0) issues.push('겹치는 가구가 있어 배치 정리가 필요해요')
  if (roomArea < 28 && placedFurniture.length >= 8) issues.push('작은 원룸에 가구가 조금 많아요')

  if (!issues.length) {
    return {
      label: '균형 좋음',
      summary: '기본 가구 구성이 안정적입니다. 이제 분위기와 수납 디테일을 더하면 좋아요.',
      issues: ['배치 균형이 좋아요', '소품과 조명으로 완성도를 높여보세요'],
    }
  }

  return {
    label: '보완 추천',
    summary: issues[0],
    issues: issues.slice(0, 3),
  }
}

function buildCoupangSearchUrl(keyword) {
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`
}

function buildStudioStarter(pyeong) {
  const safePyeong = Math.min(MAX_STUDIO_PYEONG, Math.max(MIN_STUDIO_PYEONG, Number(pyeong) || 7))
  const area = safePyeong * 3.3058
  let depth = Math.max(3, Math.sqrt(area / 1.25))
  let width = area / depth

  if (width < 3) {
    width = 3
    depth = area / width
  }

  return {
    id: `studio-${safePyeong}`,
    label: '원룸',
    name: `${safePyeong}평 원룸`,
    description: `${safePyeong}평 크기로 바로 시작합니다.`,
    roomDimensions: {
      width: Number(width.toFixed(1)),
      depth: Number(depth.toFixed(1)),
      height: STUDIO_HEIGHT_M,
    },
    pyeongLabel: `${safePyeong}평형`,
    pyeongValue: safePyeong,
  }
}

const studioStarterOptions = Array.from(
  { length: MAX_STUDIO_PYEONG - MIN_STUDIO_PYEONG + 1 },
  (_, index) => buildStudioStarter(MIN_STUDIO_PYEONG + index),
)

function normalizeAuthMessage(message, fallback) {
  if (!message) return fallback

  const raw = String(message)

  if (raw.includes('access_denied')) return '로그인이 취소되었습니다.'
  if (raw.includes('authorization_request_not_found')) return '로그인 요청이 만료되었습니다. 다시 시도해주세요.'
  if (raw.includes('Client id')) return '소셜 로그인 설정이 아직 완전히 준비되지 않았습니다.'
  if (raw.includes('Invalid redirect')) return '로그인 연결 주소 설정을 다시 확인해주세요.'
  if (raw.includes('잠시 후')) return raw

  return raw
}

function AppSectionFallback({ className = 'app-lazy-fallback', title = '화면을 준비하고 있습니다.', description = '조금만 기다려주세요.' }) {
  return (
    <div className={className}>
      <strong>{title}</strong>
      <span>{description}</span>
    </div>
  )
}

// ??? App ??????????????????????????????????????????????????????????????????????

function App() {
  const [authToken, setAuthToken] = useState(() => (typeof window === 'undefined' ? '' : window.sessionStorage.getItem(AUTH_STORAGE_KEY) ?? ''))
  const [currentUser, setCurrentUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => (typeof window === 'undefined' ? false : Boolean(window.sessionStorage.getItem(AUTH_STORAGE_KEY))))
  const [authMessage, setAuthMessage] = useState('')
  const [accountActionLoading, setAccountActionLoading] = useState(false)
  const [remoteWorkspaceReady, setRemoteWorkspaceReady] = useState(() => !(typeof window !== 'undefined' && window.sessionStorage.getItem(AUTH_STORAGE_KEY)))
  const [activeTab, setActiveTab] = useState('home')
  const [currentView, setCurrentView] = useState('home')
  const [projects, setProjects] = useState(initialProjects)
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjects[0].id)
  const [selectedCatalogId, setSelectedCatalogId] = useState(catalogItems[0]?.id ?? null)
  const [selectedStyleId, setSelectedStyleId] = useState(stylePresets[0].id)
  const [, setStatusMessage] = useState('편집 화면을 준비하고 있습니다.')
  const [projectLayouts, setProjectLayouts] = useState(() => cloneInitialLayouts())
  const [placedFurniture, setPlacedFurniture] = useState(() => cloneInitialLayouts()[1].placedFurniture)
  const [selectedFurnitureId, setSelectedFurnitureId] = useState(() => cloneInitialLayouts()[1].selectedFurnitureId)
  const [selectedFurnitureIds, setSelectedFurnitureIds] = useState(() => cloneInitialLayouts()[1].selectedFurnitureIds ?? [])
  const [editorViewMode, setEditorViewMode] = useState('3D')
  const [draggingFurnitureId, setDraggingFurnitureId] = useState(null)
  const [roomDimensions, setRoomDimensions] = useState(() => cloneInitialLayouts()[1].roomDimensions)
  const [activePlanTool, setActivePlanTool] = useState('select')
  const [planElements, setPlanElements] = useState(() => cloneInitialLayouts()[1].planElements ?? defaultPlanElements)
  const [, setCatalogCategory] = useState('전체')
  const [catalogGroup, setCatalogGroup] = useState('전체')
  const [catalogQuery, setCatalogQuery] = useState('')
  const [favoriteCatalogIds, setFavoriteCatalogIds] = useState([9, 11, 14, 18, 19, 23, 25, 26, 29, 37])
  const [projectNameDraft, setProjectNameDraft] = useState(initialProjects[0].name)
  const [projectDescriptionDraft, setProjectDescriptionDraft] = useState(initialProjects[0].description)
  const [, setProjectSpaceTypeDraft] = useState(initialProjects[0].spaceType)
  const [projectPrivacyDraft, setProjectPrivacyDraft] = useState(initialProjects[0].privacy)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const [showStarterPicker, setShowStarterPicker] = useState(false)
  const [shareProjectId, setShareProjectId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [cameraPreset, setCameraPreset] = useState('editorial')
  const [cameraResetKey, setCameraResetKey] = useState(0)
  const [cameraMode, setCameraMode] = useState('orbit')
  const [tourViewpointId, setTourViewpointId] = useState(tourViewpoints[0].id)
  const [tourPose, setTourPose] = useState(null)
  const [decorVisibility, setDecorVisibility] = useState(defaultDecorVisibility)
  const [snapEnabled] = useState(true)
  const [showMeasurements] = useState(false)
  const [alignmentGuides, setAlignmentGuides] = useState({ vertical: null, horizontal: null })
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '' })
  const [profileSaving, setProfileSaving] = useState(false)
  const [addressLookupLoading, setAddressLookupLoading] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('')

  // Refs kept in sync with state ??used by history hook to avoid stale closures
  const placedFurnitureRef = useRef(placedFurniture)
  const roomDimensionsRef = useRef(roomDimensions)
  const planElementsRef = useRef(planElements)
  const projectsRef = useRef(projects)
  const projectLayoutsRef = useRef(projectLayouts)
  const glRef = useRef(null)
  const importFileRef = useRef(null)
  const deleteSelectedFurnitureRef = useRef(() => {})
  const duplicateSelectedFurnitureRef = useRef(() => {})
  const addSelectedCatalogToEditorRef = useRef(() => {})

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (authToken) {
      window.sessionStorage.setItem(AUTH_STORAGE_KEY, authToken)
    } else {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
    }
  }, [authToken])

  useEffect(() => {
    if (!currentUser) return

    const preloadStaticPanels = () => {
      void import('./components/ProjectPreview.jsx')
      void import('./components/AuthScreen.jsx')
    }

    const shouldPreloadEditor = currentView === 'editor'

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = window.requestIdleCallback(() => {
        preloadStaticPanels()
        if (shouldPreloadEditor) {
          void import('./components/Planner3DCanvas.jsx')
        }
      })

      return () => window.cancelIdleCallback?.(idleId)
    }

    preloadStaticPanels()
    if (shouldPreloadEditor) {
      void import('./components/Planner3DCanvas.jsx')
    }

    return undefined
  }, [currentUser, currentView])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const redirectedAuthToken = params.get('authToken')
    const authProvider = params.get('authProvider')
    const socialError = params.get('socialError')

    if (!redirectedAuthToken && !socialError) return

    if (redirectedAuthToken) {
      const providerLabelMap = {
        google: '구글',
        kakao: '카카오',
        naver: '네이버',
      }
      const providerLabel = providerLabelMap[authProvider] ?? '소셜'

      setAuthLoading(true)
      setAuthToken(redirectedAuthToken)
      setAuthMessage(`${providerLabel} 로그인되었습니다.`)
    } else if (socialError) {
      setAuthMessage(normalizeAuthMessage(socialError, '소셜 로그인 중 문제가 발생했습니다.'))
    }

    params.delete('authToken')
    params.delete('authProvider')
    params.delete('socialError')
    const nextQuery = params.toString()
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash}`
    window.history.replaceState({}, document.title, nextUrl)
  }, [])

  useEffect(() => {
    let cancelled = false

    if (!authToken) {
      setCurrentUser(null)
      setAuthLoading(false)
      return undefined
    }

    setAuthLoading(true)
    fetchMe(authToken)
      .then((user) => {
        if (cancelled) return
        setCurrentUser(user)
        setAuthMessage('')
      })
      .catch((error) => {
        if (cancelled) return
        setAuthToken('')
        setCurrentUser(null)
        setAuthMessage(normalizeAuthMessage(error.message, '로그인 상태를 확인하지 못했습니다.'))
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [authToken])

  useEffect(() => {
    if (!currentUser) return
    setProfileForm({
      name: currentUser.name ?? '',
      phone: currentUser.phone ?? '',
      address: currentUser.address ?? '',
    })
    if (!currentUser.profileComplete) {
      setActiveTab('home')
      setCurrentView('home')
      setShowStarterPicker(false)
    }
  }, [currentUser])

  const handleSocialLogin = useCallback((provider) => {
    setAuthMessage('')
    startSocialLogin(provider)
  }, [])

  const handleAuthSuccess = useCallback((auth, nextMessage) => {
    setAuthLoading(true)
    setAuthToken(auth?.token ?? '')
    setCurrentUser(auth?.user ?? null)
    setAuthMessage(nextMessage ?? '')
  }, [])

  const handleLogout = async () => {
    try {
      if (authToken) {
        await logout(authToken)
      }
    } catch {
      // 로그아웃 요청 실패는 클라이언트 상태 정리로 보완합니다.
    } finally {
      clearLocalWorkspaceCache()
      resetWorkspaceToDefaults()
      setAuthToken('')
      setCurrentUser(null)
      setAuthMessage('로그아웃되었습니다.')
      setStatusMessage('로그아웃되었습니다.')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteAccountConfirmText !== '탈퇴') {
      setStatusMessage('회원탈퇴 문구를 정확히 입력해주세요.')
      return
    }

    try {
      setAccountActionLoading(true)
      await deleteMe(authToken)
      clearLocalWorkspaceCache()
      resetWorkspaceToDefaults()
      setAuthToken('')
      setCurrentUser(null)
      setAuthMessage('회원탈퇴가 완료되었습니다. 다시 시작하려면 카카오나 네이버로 로그인하면 새 계정이 자동으로 만들어집니다.')
      setStatusMessage('회원탈퇴가 완료되었습니다.')
      setToastMessage('계정이 삭제되었습니다.')
      setShowDeleteAccountModal(false)
      setDeleteAccountConfirmText('')
      setActiveTab('home')
      setCurrentView('home')
    } catch (error) {
      setStatusMessage(error.message || '회원탈퇴 처리 중 문제가 발생했습니다.')
    } finally {
      setAccountActionLoading(false)
    }
  }

  const handleProfileFormChange = useCallback((key, value) => {
    setProfileForm((current) => ({
      ...current,
      [key]: value,
    }))
  }, [])

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    if (!authToken) return

    try {
      const wasProfileComplete = Boolean(currentUser?.profileComplete)
      setProfileSaving(true)
      const updatedUser = await updateProfile(authToken, profileForm)
      setCurrentUser(updatedUser)
      if (wasProfileComplete) {
        setAuthMessage('내 정보가 저장되었습니다.')
        setStatusMessage('내 정보 저장이 완료되었습니다.')
        setToastMessage('내 정보를 저장했습니다.')
      } else {
        setAuthMessage('회원 정보가 등록되었습니다.')
        setStatusMessage('회원 정보 등록이 완료되었습니다.')
        setToastMessage(`${updatedUser.name}님, 환영합니다.`)
        setShowOnboarding(true)
      }
    } catch (error) {
      setAuthMessage(normalizeAuthMessage(error.message, '회원 정보 등록 중 문제가 발생했습니다.'))
    } finally {
      setProfileSaving(false)
    }
  }

  const handleAddressLookup = useCallback(() => {
    if (typeof window === 'undefined') return

    const openPostcode = () => {
      if (!window.daum?.Postcode) {
        setAuthMessage('주소 검색 창을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
        setAddressLookupLoading(false)
        return
      }

      new window.daum.Postcode({
        oncomplete: (data) => {
          const extraAddressParts = []
          if (data.bname && /[동로가]$/u.test(data.bname)) {
            extraAddressParts.push(data.bname)
          }
          if (data.buildingName && data.apartment === 'Y') {
            extraAddressParts.push(data.buildingName)
          }

          const extraAddress = extraAddressParts.length ? ` (${extraAddressParts.join(', ')})` : ''
          const fullAddress = `${data.address}${extraAddress}`.trim()

          setProfileForm((current) => ({
            ...current,
            address: fullAddress,
          }))
          setAuthMessage('')
          setAddressLookupLoading(false)
        },
        onclose: () => {
          setAddressLookupLoading(false)
        },
        width: '100%',
        height: '100%',
      }).open()
    }

    if (window.daum?.Postcode) {
      setAddressLookupLoading(true)
      openPostcode()
      return
    }

    const existingScript = document.querySelector('script[data-daum-postcode="true"]')
    if (existingScript) {
      setAddressLookupLoading(true)
      existingScript.addEventListener('load', openPostcode, { once: true })
      existingScript.addEventListener('error', () => {
        setAddressLookupLoading(false)
        setAuthMessage('주소 검색 스크립트를 불러오지 못했습니다.')
      }, { once: true })
      return
    }

    setAddressLookupLoading(true)
    const script = document.createElement('script')
    script.src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.dataset.daumPostcode = 'true'
    script.onload = openPostcode
    script.onerror = () => {
      setAddressLookupLoading(false)
      setAuthMessage('주소 검색 스크립트를 불러오지 못했습니다.')
    }
    document.body.appendChild(script)
  }, [])

  const createTourPoseFromView = useCallback((viewId, nextRoomDimensions = roomDimensions, nextPlacedFurniture = placedFurniture) => {
    const config = getTourStopConfig(viewId, nextRoomDimensions, nextPlacedFurniture)
    return {
      x: Number(config.position[0].toFixed(3)),
      y: Number(config.position[1].toFixed(3)),
      z: Number(config.position[2].toFixed(3)),
      yaw: Number(config.yaw.toFixed(4)),
      pitch: Number((config.pitch ?? -3).toFixed(2)),
    }
  }, [placedFurniture, roomDimensions])

  const saveLayoutSnapshot = useCallback((overrides = {}) => ({
    placedFurniture,
    selectedFurnitureId,
    selectedFurnitureIds,
    editorViewMode,
    cameraMode: cameraMode === 'tour' ? 'orbit' : cameraMode,
    tourViewpointId,
    tourPose: null,
    planElements,
    roomDimensions,
    selectedStyleId,
    decorVisibility,
    ...overrides,
  }), [placedFurniture, selectedFurnitureId, selectedFurnitureIds, editorViewMode, cameraMode, tourViewpointId, planElements, roomDimensions, selectedStyleId, decorVisibility])

  const handleMoveTourPose = useCallback((action) => {
    setCameraMode('tour')
    setTourPose((current) => {
      const base = current ?? createTourPoseFromView(tourViewpointId)
      const moveStep = 0.22
      const turnStep = Math.PI / 20
      const wallMargin = Math.max(Math.min(Math.min(roomDimensions.width, roomDimensions.depth) * 0.18, 1.08), 0.88)
      const next = { ...base }

      if (action === 'forward') {
        next.x += Math.sin(base.yaw ?? 0) * moveStep
        next.z += Math.cos(base.yaw ?? 0) * moveStep
      } else if (action === 'backward') {
        next.x -= Math.sin(base.yaw ?? 0) * moveStep
        next.z -= Math.cos(base.yaw ?? 0) * moveStep
      } else if (action === 'turn-left') {
        next.yaw = (next.yaw ?? 0) - turnStep
      } else if (action === 'turn-right') {
        next.yaw = (next.yaw ?? 0) + turnStep
      }

      next.x = Number(Math.min(Math.max(next.x, -roomDimensions.width / 2 + wallMargin), roomDimensions.width / 2 - wallMargin).toFixed(3))
      next.z = Number(Math.min(Math.max(next.z, -roomDimensions.depth / 2 + wallMargin), roomDimensions.depth / 2 - wallMargin).toFixed(3))
      next.yaw = Number(next.yaw.toFixed(4))

      return next
    })
  }, [createTourPoseFromView, roomDimensions.depth, roomDimensions.width, tourViewpointId])

  const handleLookTourPose = useCallback((deltaYaw, deltaPitch = 0) => {
    setCameraMode('tour')
    setTourPose((current) => {
      const base = current ?? createTourPoseFromView(tourViewpointId)
      const nextPitch = Math.min(18, Math.max(-18, (base.pitch ?? -3) + deltaPitch))
      return {
        ...base,
        yaw: Number(((base.yaw ?? 0) + deltaYaw).toFixed(4)),
        pitch: Number(nextPitch.toFixed(2)),
      }
    })
  }, [createTourPoseFromView, tourViewpointId])

  useEffect(() => { placedFurnitureRef.current = placedFurniture }, [placedFurniture])
  useEffect(() => { roomDimensionsRef.current = roomDimensions }, [roomDimensions])
  useEffect(() => { planElementsRef.current = planElements }, [planElements])
  useEffect(() => { projectsRef.current = projects }, [projects])
  useEffect(() => { projectLayoutsRef.current = projectLayouts }, [projectLayouts])

  const { pushHistory, undo, redo } = useEditorHistory({
    placedFurnitureRef,
    roomDimensionsRef,
    planElementsRef,
  })

  const clearLocalWorkspaceCache = useCallback(() => {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(STORAGE_KEY)
  }, [])

  const resetWorkspaceToDefaults = useCallback(() => {
    const nextProjects = cloneInitialProjects()
    const nextLayouts = cloneInitialLayouts()
    const firstProject = nextProjects[0]
    const firstLayout = nextLayouts[firstProject.id]

    setActiveTab('home')
    setCurrentView('home')
    setProjects(nextProjects)
    setProjectLayouts(nextLayouts)
    setSelectedProjectId(firstProject.id)
    setSelectedCatalogId(catalogItems[0]?.id ?? null)
    setSelectedStyleId(stylePresets[0].id)
    setDecorVisibility(defaultDecorVisibility)
    setShowOnboarding(true)
    setShowStarterPicker(false)
    setProjectNameDraft(firstProject.name)
    setProjectDescriptionDraft(firstProject.description)
    setProjectSpaceTypeDraft(firstProject.spaceType)
    setProjectPrivacyDraft(firstProject.privacy)
    setShareProjectId(null)
    setPlacedFurniture(firstLayout.placedFurniture)
    setSelectedFurnitureId(firstLayout.selectedFurnitureId)
    setSelectedFurnitureIds(firstLayout.selectedFurnitureIds ?? [])
    setEditorViewMode(firstLayout.editorViewMode ?? '3D')
    setCameraMode('orbit')
    setTourViewpointId(tourViewpoints[0].id)
    setTourPose(null)
    setRoomDimensions(firstLayout.roomDimensions)
    setPlanElements(firstLayout.planElements ?? defaultPlanElements)
    setActivePlanTool('select')
  }, [])

  // ??? Load / Save localStorage ????????????????????????????????????????????????
  const loadProjectWorkspace = useCallback((projectId, layouts = projectLayoutsRef.current, availableProjects = projectsRef.current) => {
    const layout = sanitizeLayout(layouts?.[projectId], availableProjects.find((project) => project.id === projectId))
    if (!layout) {
      setPlacedFurniture([])
      setSelectedFurnitureId('')
      setSelectedFurnitureIds([])
      setEditorViewMode('2D')
      setCameraMode('orbit')
      setTourViewpointId(tourViewpoints[0].id)
      setTourPose(null)
      setRoomDimensions({ width: 5.6, depth: 4.2, height: 2.8 })
      setPlanElements(defaultPlanElements)
      return
    }
    setPlacedFurniture(layout.placedFurniture ?? [])
    setSelectedFurnitureId(layout.selectedFurnitureId ?? layout.placedFurniture?.[0]?.id ?? '')
    setSelectedFurnitureIds(layout.selectedFurnitureIds ?? (layout.selectedFurnitureId ? [layout.selectedFurnitureId] : []))
    setEditorViewMode(layout.editorViewMode ?? '2D')
    setCameraMode(layout.cameraMode === 'tour' ? 'orbit' : (layout.cameraMode ?? 'orbit'))
    setTourViewpointId(layout.tourViewpointId ?? tourViewpoints[0].id)
    setTourPose(null)
    setRoomDimensions(layout.roomDimensions ?? { width: 5.6, depth: 4.2, height: 2.8 })
    setPlanElements(layout.planElements ?? defaultPlanElements)
    setSelectedStyleId(layout.selectedStyleId ?? 'minimal-living')
    setDecorVisibility(sanitizeDecorVisibility(layout.decorVisibility))
    setActivePlanTool('select')
  }, [])

  const applyPersistedWorkspace = useCallback((savedState) => {
    const nextState = sanitizeWorkspaceState(savedState)
    setProjects(nextState.projects)
    setProjectLayouts(nextState.projectLayouts)
    setActiveTab(nextState.activeTab)
    setCurrentView(nextState.currentView)
    setSelectedProjectId(nextState.selectedProjectId)
    setSelectedCatalogId(nextState.selectedCatalogId)
    setSelectedStyleId(nextState.selectedStyleId)
    setDecorVisibility(nextState.decorVisibility)
    setShowOnboarding(nextState.showOnboarding)
    setShowStarterPicker(nextState.showStarterPicker)
    loadProjectWorkspace(nextState.selectedProjectId, nextState.projectLayouts, nextState.projects)
  }, [loadProjectWorkspace])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.sessionStorage.getItem(AUTH_STORAGE_KEY)) return
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    try {
      applyPersistedWorkspace(JSON.parse(raw))
      setStatusMessage('저장된 작업 상태를 불러왔습니다.')
    } catch {
      window.localStorage.removeItem(STORAGE_KEY)
      setStatusMessage('저장된 데이터를 읽지 못해 기본 상태로 시작했습니다.')
    }
  }, [applyPersistedWorkspace])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (authToken || currentUser) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildWorkspaceState({
      activeTab,
      currentView,
      projects,
      projectLayouts,
      selectedProjectId,
      selectedCatalogId,
      selectedStyleId,
      decorVisibility,
      showOnboarding,
      showStarterPicker,
    })))
  }, [authToken, currentUser, activeTab, currentView, projects, projectLayouts, selectedProjectId, selectedCatalogId, selectedStyleId, decorVisibility, showOnboarding, showStarterPicker])

  useEffect(() => {
    let cancelled = false

    if (!authToken || !currentUser) {
      setRemoteWorkspaceReady(!authToken)
      return undefined
    }

    setRemoteWorkspaceReady(false)
    fetchWorkspace(authToken)
      .then((workspace) => {
        if (cancelled) return
        if (workspace?.state) {
          applyPersistedWorkspace(workspace.state)
          setStatusMessage('계정 작업 공간을 불러왔습니다.')
        } else {
          clearLocalWorkspaceCache()
          resetWorkspaceToDefaults()
          setStatusMessage('새 계정입니다. 비어 있는 원룸에서 바로 시작할 수 있어요.')
        }
      })
      .catch((error) => {
        if (cancelled) return
        setStatusMessage(error.message || '계정 작업 공간을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setRemoteWorkspaceReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [authToken, currentUser, applyPersistedWorkspace, clearLocalWorkspaceCache, resetWorkspaceToDefaults])

  useEffect(() => {
    if (!authToken || !currentUser || !remoteWorkspaceReady) return undefined

    const timer = window.setTimeout(() => {
      saveWorkspace(authToken, buildWorkspaceState({
        activeTab,
        currentView,
        projects,
        projectLayouts,
        selectedProjectId,
        selectedCatalogId,
        selectedStyleId,
        decorVisibility,
        showOnboarding,
        showStarterPicker,
      })).catch((error) => {
        setStatusMessage(error.message || '작업 공간을 서버에 저장하지 못했습니다.')
      })
    }, 700)

    return () => window.clearTimeout(timer)
  }, [
    authToken,
    currentUser,
    remoteWorkspaceReady,
    activeTab,
    currentView,
    projects,
    projectLayouts,
    selectedProjectId,
    selectedCatalogId,
    selectedStyleId,
    decorVisibility,
    showOnboarding,
    showStarterPicker,
  ])

  useEffect(() => {
    if (currentView !== 'editor') return
    setProjectLayouts((current) => ({
      ...current,
      [selectedProjectId]: saveLayoutSnapshot(),
    }))
  }, [currentView, selectedProjectId, saveLayoutSnapshot])

  useEffect(() => {
    if (currentView !== 'editor') return
    const recommendation = styleCatalogRecommendations[selectedStyleId] ?? styleCatalogRecommendations['minimal-living']
    setCatalogCategory(recommendation.category)
    setCatalogQuery('')
    if (recommendation.itemIds?.[0]) setSelectedCatalogId(recommendation.itemIds[0])
  }, [currentView, selectedStyleId])

  useEffect(() => {
    if (!toastMessage) return
    const t = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(t)
  }, [toastMessage])

  useEffect(() => {
    if (currentView !== 'editor' || editorViewMode !== '3D' || cameraMode !== 'tour' || tourPose) return
    setTourPose(createTourPoseFromView(tourViewpointId))
  }, [currentView, editorViewMode, cameraMode, tourPose, tourViewpointId, createTourPoseFromView])

  // ??? Derived state (?좎뼵? 紐⑤뱺 effect ?ㅼ뿉) ?????????????????????????????????
  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? projects[0]
  const selectedCatalog = catalogItems.find((i) => i.id === selectedCatalogId) ?? catalogItems[0]
  const selectedFurniture = placedFurniture.find((i) => i.id === selectedFurnitureId) ?? placedFurniture[0]
  const hasSelectedFurniture = selectedFurnitureIds.length > 0 && Boolean(selectedFurniture)
  const hasMultipleSelectedFurniture = selectedFurnitureIds.length > 1
  const selectedFurnitureSet = new Set(selectedFurnitureIds)
  const selectedFurnitureCatalog = useMemo(() => getCatalogItemForFurniture(selectedFurniture), [selectedFurniture])
  const shareProject = projects.find((p) => p.id === shareProjectId) ?? selectedProject
  const styleRecommendation = styleCatalogRecommendations[selectedStyleId] ?? styleCatalogRecommendations['minimal-living']
  const currentRoomPyeong = Math.min(MAX_STUDIO_PYEONG, Math.max(MIN_STUDIO_PYEONG, Math.round((roomDimensions.width * roomDimensions.depth) / 3.3058)))
  const furnitureRecommendations = useMemo(() => {
    const placedTypes = new Set(placedFurniture.map((item) => item.type))
    const roomArea = roomDimensions.width * roomDimensions.depth
    const hasWorkSetup = placedTypes.has('desk') || placedTypes.has('computer')
    const hasStorage = ['storage', 'dresser', 'bookcase', 'openShelf', 'shelf', 'wardrobe'].some((type) => placedTypes.has(type))
    const hasMoodLight = ['lamp', 'tableLamp'].some((type) => placedTypes.has(type))

    const scored = recommendationSeed.map((seed) => {
      const catalogItem = catalogItems.find((item) => item.type === seed.type) ?? catalogItems.find((item) => item.type === seed.fallbackType)
      const alreadyPlaced = placedTypes.has(seed.type) || (seed.fallbackType ? placedTypes.has(seed.fallbackType) : false)
      let score = alreadyPlaced ? 0 : 2

      if (!hasWorkSetup && ['desk', 'chair'].includes(seed.type)) score += 3
      if (!hasStorage && ['openShelf', 'trolley'].includes(seed.type)) score += 3
      if (!hasMoodLight && seed.type === 'tableLamp') score += 2
      if (roomArea < 28 && ['openShelf', 'trolley', 'rug'].includes(seed.type)) score += 1

      return {
        ...seed,
        catalogItem,
        score,
        keyword: `${currentRoomPyeong}평 ${seed.keyword}`,
        coupangUrl: buildCoupangSearchUrl(`${currentRoomPyeong}평 ${seed.keyword}`),
      }
    })

    return scored
      .filter((item) => item.catalogItem && item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }, [currentRoomPyeong, placedFurniture, roomDimensions.depth, roomDimensions.width])

  // selectedProject가 바뀔 때 draft 상태를 동기화합니다. (derived state 이후에 배치)
  useEffect(() => {
    setProjectNameDraft(selectedProject?.name ?? '')
    setProjectDescriptionDraft(selectedProject?.description ?? '')
    setProjectSpaceTypeDraft(selectedProject?.spaceType ?? '원룸')
    setProjectPrivacyDraft(selectedProject?.privacy ?? '읽기 전용 링크')
  }, [selectedProject?.description, selectedProject?.name, selectedProject?.privacy, selectedProject?.spaceType])

  const filteredCatalogItems = useMemo(() => {
    return getFilteredCatalogItems({
      items: catalogItems,
      query: catalogQuery,
      catalogGroup,
      favoriteCatalogIds,
      styleRecommendation,
    })
  }, [catalogGroup, catalogQuery, favoriteCatalogIds, styleRecommendation])

  // OBB collision detection
  const furnitureCollisions = useMemo(() => {
    const collisions = new Set()
    for (let i = 0; i < placedFurniture.length; i++) {
      const a = placedFurniture[i]
      const boundsA = getScaledBounds(a.type, a.scale ?? 1, roomDimensions)
      const cx_a = (a.x ?? 0) + boundsA.w / 2
      const cy_a = (a.y ?? 0) + boundsA.h / 2
      const cornersA = getOBBCorners(cx_a, cy_a, boundsA.w, boundsA.h, a.rotation ?? 0)
      for (let j = i + 1; j < placedFurniture.length; j++) {
        const b = placedFurniture[j]
        const boundsB = getScaledBounds(b.type, b.scale ?? 1, roomDimensions)
        const cx_b = (b.x ?? 0) + boundsB.w / 2
        const cy_b = (b.y ?? 0) + boundsB.h / 2
        const cornersB = getOBBCorners(cx_b, cy_b, boundsB.w, boundsB.h, b.rotation ?? 0)
        if (satOverlap(cornersA, cornersB)) {
          collisions.add(a.id)
          collisions.add(b.id)
        }
      }
    }
    return collisions
  }, [placedFurniture, roomDimensions])

  const roomCanvasStyle = useMemo(() => ({
    width: `${Math.min(92, Math.max(72, roomDimensions.width * 14))}%`,
    aspectRatio: `${roomDimensions.width} / ${roomDimensions.depth}`,
  }), [roomDimensions.depth, roomDimensions.width])

  const {
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
  } = usePlannerEditorActions({
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
    snapGridM: SNAP_GRID_M,
    getFurnitureType,
    defaultPlanElements,
  })

  const handleApplyRecommendation = useCallback((recommendation) => {
    if (!recommendation?.catalogItem) return
    setSelectedCatalogId(recommendation.catalogItem.id)
    handleAddFurnitureToEditor(recommendation.catalogItem, recommendation.placement)
    setToastMessage(`${recommendation.title} 추천 가구를 배치했습니다.`)
  }, [handleAddFurnitureToEditor, setSelectedCatalogId, setToastMessage])

  // ??? Plan canvas helpers ??????????????????????????????????????????????????????
  const nearestPlanSide = (x, y) =>
    [{ side: 'top', value: y }, { side: 'right', value: 100 - x }, { side: 'bottom', value: 100 - y }, { side: 'left', value: x }]
      .sort((a, b) => a.value - b.value)[0].side

  const handlePlanCanvasPointerDown = (event) => {
    if (editorViewMode !== '2D' || activePlanTool === 'select') return
    if (event.target instanceof Element && (event.target.closest('.canvas-object') || event.target.closest('.plan-tool'))) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - bounds.left) / bounds.width) * 100
    const y = ((event.clientY - bounds.top) / bounds.height) * 100
    const side = nearestPlanSide(x, y)
    pushHistory()
    if (activePlanTool === 'wall') {
      const orientation = Math.abs(x - 50) < Math.abs(y - 50) ? 'vertical' : 'horizontal'
      setPlanElements((c) => ({ ...c, partition: { enabled: true, orientation, offset: Number((orientation === 'vertical' ? x : y).toFixed(1)) } }))
      setStatusMessage('내부 벽 위치를 조정했습니다.')
    } else if (activePlanTool === 'window') {
      setPlanElements((c) => ({ ...c, window: { enabled: true, side, offset: Number(((side === 'left' || side === 'right') ? y : x).toFixed(1)) } }))
      setStatusMessage('창문 위치를 조정했습니다.')
    } else if (activePlanTool === 'door') {
      setPlanElements((c) => ({ ...c, door: { enabled: true, side, offset: Number(((side === 'left' || side === 'right') ? y : x).toFixed(1)) } }))
      setStatusMessage('문 위치를 조정했습니다.')
    }
  }

  const partitionStyle = useMemo(() => {
    if (!planElements?.partition?.enabled) return null
    return planElements.partition.orientation === 'vertical'
      ? { left: `${planElements.partition.offset}%` }
      : { top: `${planElements.partition.offset}%` }
  }, [planElements])

  const windowStyle = useMemo(() => {
    const offset = planElements?.window?.offset ?? 50
    const side = planElements?.window?.side ?? 'top'
    return (side === 'top' || side === 'bottom')
      ? { left: `clamp(10%, calc(${offset}% - 10%), 70%)` }
      : { top: `clamp(12%, calc(${offset}% - 11%), 66%)` }
  }, [planElements])

  const doorStyle = useMemo(() => {
    const offset = planElements?.door?.offset ?? 20
    const side = planElements?.door?.side ?? 'left'
    return (side === 'top' || side === 'bottom')
      ? { left: `clamp(8%, calc(${offset}% - 6%), 78%)` }
      : { top: `clamp(10%, calc(${offset}% - 10%), 70%)` }
  }, [planElements])

  const {
    handleCreateProject,
    openStarterPicker,
    handleOpenEditor,
    handleDeleteProject,
    handleResetDemoData,
    handleSaveProject,
    handleRoomPyeongChange: handleRoomPyeongChangeAction,
  } = usePlannerProjectActions({
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
    cloneInitialLoadWorkspace: loadProjectWorkspace,
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
  })

  const handleRoomPyeongChange = useCallback((value) => {
    handleRoomPyeongChangeAction(value, pushHistory)
  }, [handleRoomPyeongChangeAction, pushHistory])

  const handleDeleteProjectWithConfirm = useCallback((projectId, projectName) => {
    const confirmed = window.confirm(`"${projectName}" 프로젝트를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)
    if (!confirmed) return
    handleDeleteProject(projectId)
  }, [handleDeleteProject])

  const handleRenameProject = () => {
    const name = projectNameDraft.trim()
    if (!name) { setStatusMessage('프로젝트 이름을 입력해 주세요.'); return }
    setProjects((c) => c.map((p) => p.id !== selectedProjectId ? p : { ...p, name, description: projectDescriptionDraft.trim() || p.description, spaceType: '원룸', privacy: projectPrivacyDraft }))
    setStatusMessage(`프로젝트 이름을 ${name}(으)로 변경했습니다.`)
  }

  const handleCloseShare = () => { setShareProjectId(null); setStatusMessage('공유 모달을 닫았습니다.') }

  const handleCopyShareLink = async () => {
    const url = buildShareLink(shareProjectId)
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(url); setToastMessage('공유 링크를 복사했습니다.'); return }
    } catch { /* fallthrough */ }
    setToastMessage(`공유 링크: ${url}`)
  }


  const handleRoomDimensionChange = (dimension, value) => {
    const numericValue = Number(value)
    if (!Number.isFinite(numericValue)) return

    const nextRoomDimensions = {
      ...roomDimensions,
      [dimension]: Number(numericValue.toFixed(1)),
      height: STUDIO_HEIGHT_M,
    }

    setRoomDimensions(nextRoomDimensions)
    setProjectLayouts((current) => ({
      ...current,
      [selectedProjectId]: {
        ...(current[selectedProjectId] ?? {}),
        roomDimensions: nextRoomDimensions,
      },
    }))
    setStatusMessage(`방 ${dimension === 'width' ? '가로' : '세로'} 길이를 조정했습니다.`)
  }

  const handlePlanElementToggle = (elementKey) => {
    setPlanElements((current) => {
      const next = {
        ...current,
        [elementKey]: {
          ...current[elementKey],
          enabled: !current[elementKey]?.enabled,
        },
      }
      return next
    })
    setStatusMessage(`${elementKey === 'window' ? '창문' : '문'} 표시를 변경했습니다.`)
  }

  const handlePlanElementSideChange = (elementKey, side) => {
    setPlanElements((current) => ({
      ...current,
      [elementKey]: {
        ...current[elementKey],
        enabled: true,
        side,
      },
    }))
    setStatusMessage(`${elementKey === 'window' ? '창문' : '문'} 방향을 바꿨습니다.`)
  }

  const handlePlanElementOffsetChange = (elementKey, offset) => {
    const numericOffset = Number(offset)
    if (!Number.isFinite(numericOffset)) return
    setPlanElements((current) => ({
      ...current,
      [elementKey]: {
        ...current[elementKey],
        enabled: true,
        offset: Number(numericOffset.toFixed(1)),
      },
    }))
  }

  const toggleFavoriteCatalogItem = (catalogId) => {
    setFavoriteCatalogIds((current) => current.includes(catalogId) ? current.filter((id) => id !== catalogId) : [...current, catalogId])
  }

  const handleEnterTourMode = (viewId = null) => {
    const nextViewId = viewId ?? 'entry'
    setCameraMode('tour')
    setTourViewpointId(nextViewId)
    setTourPose(createTourPoseFromView(nextViewId))
    setStatusMessage(`${getTourViewpointLabel(tourViewpoints, nextViewId)} 시점으로 안쪽 투어를 시작했습니다.`)
  }

  const handleExitTourMode = () => {
    setCameraMode('orbit')
    setTourPose(null)
    setStatusMessage('투어 모드를 종료하고 편집 3D 시점으로 돌아왔습니다.')
  }

  usePlannerShortcuts({
    currentView,
    undo,
    redo,
    setPlacedFurniture,
    setRoomDimensions,
    setPlanElements,
    hasSelectedFurniture,
    selectedCatalog,
    onDuplicateFurniture: () => duplicateSelectedFurnitureRef.current(),
    onDeleteFurniture: () => deleteSelectedFurnitureRef.current(),
    onAddSelectedCatalog: () => addSelectedCatalogToEditorRef.current(),
    editorViewMode,
    cameraMode,
    onMoveTourPose: handleMoveTourPose,
    onExitTourMode: handleExitTourMode,
  })

  const handleSelectTourViewpoint = (viewId) => {
    setCameraMode('tour')
    setTourViewpointId(viewId)
    setTourPose(createTourPoseFromView(viewId))
    setStatusMessage(`${getTourViewpointLabel(tourViewpoints, viewId)} 구도로 이동했습니다.`)
  }

  const resetOrbitView = () => {
    if (cameraMode === 'tour') {
      handleSelectTourViewpoint(tourViewpointId === 'detail' ? 'entry' : tourViewpointId)
      return
    }
    setCameraPreset('editorial')
    setCameraResetKey((k) => k + 1)
    setStatusMessage('3D 시점을 기본 각도로 되돌렸습니다.')
  }

  deleteSelectedFurnitureRef.current = deleteSelectedFurniture
  duplicateSelectedFurnitureRef.current = duplicateSelectedFurniture
  addSelectedCatalogToEditorRef.current = handleAddSelectedCatalogToEditor

  const leaveEditor = useCallback((nextTab = 'projects', nextMessage = '프로젝트 편집을 종료하고 목록으로 돌아왔습니다.') => {
    setDraggingFurnitureId(null)
    setCameraMode('orbit')
    setTourPose(null)
    glRef.current = null
    setCurrentView('home')
    setActiveTab(nextTab)
    setStatusMessage(nextMessage)
  }, [])

  const handleExitEditor = (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    leaveEditor()
  }

  const handleSaveAndExit = (event) => {
    event?.preventDefault?.()
    event?.stopPropagation?.()
    handleSaveProject()
    leaveEditor('projects', '프로젝트를 저장하고 목록으로 돌아왔습니다.')
  }

  const roomAreaLabel = formatPyeong(roomDimensions.width, roomDimensions.depth)
  const selectedFurnitureLabel = selectedFurniture?.name ?? '선택 없음'
  const selectedFurnitureCount = selectedFurnitureIds.length
  const selectedCollisionCount = selectedFurnitureIds.filter((id) => furnitureCollisions.has(id)).length
  const collisionCount = furnitureCollisions.size
  const layoutStatus = collisionCount > 0 ? '재배치 필요' : placedFurniture.length > 0 ? '배치 안정' : '가구 배치 전'
  const layoutStatusDescription = collisionCount > 0
    ? `${collisionCount}개 가구가 다른 가구와 겹치고 있습니다.`
    : placedFurniture.length > 0
      ? '현재 배치에서 충돌이 감지되지 않았습니다.'
      : '왼쪽 라이브러리에서 가구를 추가해 배치를 시작하세요.'
  const roomDiagnosis = useMemo(() => buildRoomDiagnosis({
    placedFurniture,
    roomDimensions,
    collisionCount,
  }), [collisionCount, placedFurniture, roomDimensions])

  // ??? Selected furniture metric sizes ?????????????????????????????????????????
  const selectedFurnitureMetricSize = useMemo(() => {
    if (!selectedFurniture) return null
    const base = furnitureMetricMap[selectedFurniture.type] ?? furnitureMetricMap.chair
    const scale = selectedFurniture.scale ?? 1
    return { widthCm: Math.round(base.width * scale * 100), depthCm: Math.round(base.depth * scale * 100) }
  }, [selectedFurniture])

  // ??? renderEditor ?????????????????????????????????????????????????????????????
  const renderEditor = () => (
    <main className="pro-editor pro-editor-reboot">
      <div className="pro-topbar">
        <div className="pro-topbar-left">
          <button type="button" className="pro-back-btn" onClick={handleExitEditor} aria-label="나만의 원룸으로 돌아가기">
            <span className="pro-back-icon" aria-hidden="true">←</span>
            <span className="pro-back-label">내 원룸</span>
          </button>
          <div className="pro-topbar-title">
            <span className="pro-topbar-project">{selectedProject?.name}</span>
            <span className="pro-topbar-dim">{roomDimensions.width.toFixed(1)} × {roomDimensions.depth.toFixed(1)} m</span>
          </div>
        </div>
        <div className="pro-topbar-center">
          <div className="pro-topbar-controls">
            <div className="pro-view-switch">
              <button type="button" className={`pro-view-btn ${editorViewMode === '2D' ? 'active' : ''}`} onClick={() => { setEditorViewMode('2D'); setStatusMessage('평면 꾸미기 모드로 전환했습니다.') }}>2D</button>
              <button type="button" className={`pro-view-btn ${editorViewMode === '3D' ? 'active' : ''}`} onClick={() => { setEditorViewMode('3D'); setStatusMessage('3D 꾸미기 모드로 전환했습니다.') }}>3D</button>
            </div>
            {editorViewMode === '3D' ? (
              <div className="pro-viewer-controls">
                <button type="button" className={`pro-tool-btn ${cameraMode === 'tour' ? 'active' : ''}`} onClick={() => cameraMode === 'tour' ? handleExitTourMode() : handleEnterTourMode()}>
                  {cameraMode === 'tour' ? '둘러보기 종료' : '내 방 둘러보기'}
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="pro-topbar-right">
          <button type="button" className="pro-topbar-btn" onClick={handleSaveProject}>저장</button>
          <button type="button" className="pro-topbar-btn is-primary" onClick={handleSaveAndExit}>완료</button>
        </div>
      </div>

      <div className="pro-body">
        <aside className="pro-left pro-pane-shell">
          <div className="pro-pane-intro">
            <span className="pro-pane-kicker">My Room</span>
            <strong>가구 고르기</strong>
            <p>원하는 가구를 담아보세요</p>
          </div>

          <div className="pro-pane-section pro-pane-section-tight">
            <div className="pro-left-head">
              <div className="pro-pane-title">
                <strong>가구 모아보기</strong>
              </div>
              <span>{filteredCatalogItems.length}개</span>
            </div>
            <div className="pro-catalog-search">
              <input
                type="text"
                value={catalogQuery}
                onChange={(e) => setCatalogQuery(e.target.value)}
                placeholder="가구 이름이나 브랜드 검색"
              />
            </div>
            <div className="pro-catalog-group-row">
              {['전체', '즐겨찾기', '작업', '휴식', '수납', '가전', '분위기'].map((group) => (
                <button
                  key={group}
                  type="button"
                  className={`pro-catalog-group-chip ${catalogGroup === group ? 'active' : ''}`}
                  onClick={() => setCatalogGroup(group)}
                >
                  {group}
                </button>
              ))}
            </div>
            <div className="pro-catalog-grid">
              {filteredCatalogItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`pro-catalog-tile ${selectedCatalogId === item.id ? 'active' : ''}`}
                  onClick={() => { setSelectedCatalogId(item.id); setStatusMessage(`${item.name} 선택`) }}
                  onDoubleClick={() => { setSelectedCatalogId(item.id); handleAddFurnitureToEditor(item) }}
                  title="더블클릭하면 바로 배치"
                >
                  <span
                    className={`pro-catalog-fav ${favoriteCatalogIds.includes(item.id) ? 'active' : ''}`}
                    onClick={(event) => {
                      event.stopPropagation()
                      toggleFavoriteCatalogItem(item.id)
                    }}
                    onDoubleClick={(event) => event.stopPropagation()}
                    aria-label={`${item.name} 즐겨찾기`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        toggleFavoriteCatalogItem(item.id)
                      }
                    }}
                  >
                    {favoriteCatalogIds.includes(item.id) ? '★' : '☆'}
                  </span>
                  {styleRecommendation.itemIds.includes(item.id) ? <span className="pro-catalog-rec">추천</span> : null}
                  <span className="pro-catalog-copy">
                    <span className="pro-catalog-name">{item.name}</span>
                    <span className="pro-catalog-sub">{item.typeLabel ?? item.category}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {selectedCatalogId ? (
            <div className="pro-pane-section pro-pane-section-floating">
              <div className="pro-catalog-preview">
                <div className="pro-catalog-preview-head">
                  <strong>{selectedCatalog?.name}</strong>
                  <span>{selectedCatalog?.brand}</span>
                </div>
                <div className="pro-catalog-preview-meta">
                  <span>{selectedCatalog?.typeLabel ?? selectedCatalog?.category}</span>
                  <span>{selectedCatalog?.finish}</span>
                </div>
                <p>{selectedCatalog?.sceneLabel ?? '선택한 가구를 원하는 위치와 분위기에 맞춰 빠르게 배치해보세요.'}</p>
              </div>
              <button type="button" className="pro-add-btn" onClick={() => handleAddSelectedCatalogToEditor()} title="Enter">
                배치
              </button>
              <div className="pro-quick-place-grid">
                <button type="button" className="pro-quick-place-btn" onClick={() => handleAddSelectedCatalogToEditor('center')}>중앙</button>
                <button type="button" className="pro-quick-place-btn" onClick={() => handleAddSelectedCatalogToEditor('wall')}>벽면</button>
                <button type="button" className="pro-quick-place-btn" onClick={() => handleAddSelectedCatalogToEditor('window')}>창가</button>
              </div>
              <div className="pro-catalog-shortcuts">`Enter`</div>
            </div>
          ) : null}
        </aside>

        <section className="pro-canvas-area pro-stage-shell">
          <input ref={importFileRef} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={handleImportJSON} />

          <div className={`pro-canvas ${editorViewMode === '3D' ? 'is-3d' : 'is-2d'}`}>
            {editorViewMode === '3D' ? (
              <>
                {cameraMode === 'tour' ? (
                  <div className="tour-mode-hud">
                    <div className="tour-mode-copy">
                      <strong>둘러보기</strong>
                      <span>드래그로 시선 이동 · WASD / 방향키</span>
                    </div>
                    <div className="tour-direction-pad" aria-label="투어 이동 패드">
                      <button type="button" className="tour-direction-btn forward" onClick={() => handleMoveTourPose('forward')}>↑</button>
                      <button type="button" className="tour-direction-btn left" onClick={() => handleMoveTourPose('turn-left')}>←</button>
                      <button type="button" className="tour-direction-btn center" onClick={resetOrbitView}>•</button>
                      <button type="button" className="tour-direction-btn right" onClick={() => handleMoveTourPose('turn-right')}>→</button>
                      <button type="button" className="tour-direction-btn backward" onClick={() => handleMoveTourPose('backward')}>↓</button>
                    </div>
                  </div>
                ) : null}
                <Suspense fallback={<AppSectionFallback className="editor-canvas-loading" title="3D 공간을 불러오는 중입니다." description="처음 한 번만 조금 더 걸릴 수 있습니다." />}>
                  <Planner3DCanvas
                    roomDimensions={roomDimensions}
                    placedFurniture={placedFurniture}
                    selectedFurnitureId={selectedFurnitureId}
                    furnitureCollisions={furnitureCollisions}
                    planElements={planElements}
                    cameraPreset={cameraPreset}
                    cameraResetKey={cameraResetKey}
                    cameraMode={cameraMode}
                    tourPose={tourPose}
                    selectedStyleId={selectedStyleId}
                    decorVisibility={decorVisibility}
                    draggingFurnitureId={draggingFurnitureId}
                    onSelectFurniture={(id, name) => { handleSelectFurniture(id); setStatusMessage(`${name} 가구를 3D 화면에서 선택했습니다.`) }}
                    onMoveFurniture={updateFurniturePosition}
                    onRotateFurniture={setFurnitureRotation}
                    onLookTour={handleLookTourPose}
                    onStartDraggingFurniture={startDraggingFurnitureIn3D}
                    onEndDraggingFurniture={endDraggingFurnitureIn3D}
                    onCanvasReady={(gl) => { glRef.current = gl }}
                  />
                </Suspense>
              </>
            ) : (
              <div className="canvas-room mode-2d planner-room" style={roomCanvasStyle} onPointerDown={handlePlanCanvasPointerDown}>
                <div className="plan-dimension plan-dimension-top"><span>{roomDimensions.width.toFixed(1)}m</span></div>
                <div className="plan-dimension plan-dimension-left"><span>{roomDimensions.depth.toFixed(1)}m</span></div>
                <div className="plan-room-label">
                  <strong>{selectedProject?.spaceType ?? '룸'}</strong>
                  <span>{formatPyeong(roomDimensions.width, roomDimensions.depth)}</span>
                </div>
                <div className="plan-scale-ruler">
                  <span>0m</span>
                  <div className="plan-scale-ruler-bar"><i /><i /><i /><i /></div>
                  <span>2m</span>
                </div>
                <div className="canvas-grid" />
                <div className="plan-wall plan-wall-top" />
                <div className="plan-wall plan-wall-right" />
                <div className="plan-wall plan-wall-bottom" />
                <div className="plan-wall plan-wall-left" />
                {planElements?.partition?.enabled ? (
                  <div className={`plan-partition ${planElements.partition.orientation === 'vertical' ? 'is-vertical' : 'is-horizontal'}`} style={partitionStyle ?? undefined} />
                ) : null}
                {planElements?.window?.enabled !== false ? (
                  <div className={`plan-window plan-window-dynamic is-${planElements?.window?.side ?? 'top'}`} style={windowStyle} />
                ) : null}
                {planElements?.door?.enabled !== false ? (
                  <div className={`plan-door is-${planElements?.door?.side ?? 'left'}`} style={doorStyle}>
                    <div className="plan-door-leaf" />
                    <div className="plan-door-arc" />
                  </div>
                ) : null}
                {alignmentGuides.vertical !== null ? (
                  <div className="plan-alignment-guide is-vertical" style={{ left: `${alignmentGuides.vertical}%` }} />
                ) : null}
                {alignmentGuides.horizontal !== null ? (
                  <div className="plan-alignment-guide is-horizontal" style={{ top: `${alignmentGuides.horizontal}%` }} />
                ) : null}
                {placedFurniture.length === 0 ? (
                  <div className="canvas-empty-state">
                    <span>PLAN MODE</span>
                    <strong>가구를 추가하면 이 공간이 바로 평면 배치 보드로 채워집니다.</strong>
                    <p>왼쪽 라이브러리에서 가구를 선택한 뒤 배치 버튼을 눌러보세요.</p>
                  </div>
                ) : null}
                {placedFurniture.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`canvas-object ${item.type}-object ${selectedFurnitureSet.has(item.id) ? 'selected' : ''} object-2d ${draggingFurnitureId === item.id ? 'dragging' : ''} ${furnitureCollisions.has(item.id) ? 'collision' : ''}`}
                    style={{
                      ...getCanvasFootprint(item.type, item.scale ?? 1, roomDimensions),
                      left: `${item.x ?? 18}%`,
                      top: `${item.y ?? 24}%`,
                      transform: `rotate(${item.rotation ?? 0}deg)`,
                    }}
                    onClick={(event) => {
                      handleSelectFurniture(item.id, { multi: event.ctrlKey || event.metaKey })
                      setStatusMessage(`${item.name} 가구를 캔버스에서 선택했습니다.`)
                    }}
                    onPointerDown={(event) => {
                      event.currentTarget.setPointerCapture(event.pointerId)
                      pushHistory()
                      setDraggingFurnitureId(item.id)
                      handleSelectFurniture(item.id, { multi: event.ctrlKey || event.metaKey })
                    }}
                    onPointerMove={(event) => {
                      if (draggingFurnitureId !== item.id) return
                      const canvasBounds = event.currentTarget.parentElement?.getBoundingClientRect()
                      if (!canvasBounds) return
                      const nextX = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 100 - 8
                      const nextY = ((event.clientY - canvasBounds.top) / canvasBounds.height) * 100 - 8
                      updateFurniturePosition(item.id, nextX, nextY)
                    }}
                    onPointerUp={(event) => {
                      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
                      if (draggingFurnitureId === item.id) {
                        setDraggingFurnitureId(null)
                        setAlignmentGuides({ vertical: null, horizontal: null })
                        setStatusMessage(`${item.name} 가구 위치를 업데이트했습니다.`)
                      }
                    }}
                    onPointerCancel={(event) => {
                      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
                      setDraggingFurnitureId(null)
                      setAlignmentGuides({ vertical: null, horizontal: null })
                    }}
                    aria-label={`${item.name} 선택`}
                  >
                    {selectedFurnitureSet.has(item.id) ? (
                      <>
                        <span className="object-handle handle-top" />
                        <span className="object-handle handle-right" />
                        <span className="object-handle handle-bottom" />
                        <span className="object-handle handle-left" />
                      </>
                    ) : null}
                    {showMeasurements && selectedFurnitureSet.has(item.id) ? (() => {
                      const base = furnitureMetricMap[item.type] ?? furnitureMetricMap.chair
                      const scale = item.scale ?? 1
                      const wCm = Math.round(base.width * scale * 100)
                      const dCm = Math.round(base.depth * scale * 100)
                      return (
                        <>
                          <span className="measurement-label measurement-label-width">{wCm}cm</span>
                          <span className="measurement-label measurement-label-depth">{dCm}cm</span>
                        </>
                      )
                    })() : null}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside className="pro-right pro-pane-shell">
          <div className="pro-panel-section pro-panel-card pro-panel-card-overview">
            <div className="pro-panel-head">
              <div className="pro-pane-title">
                <span className="pro-pane-kicker">Overview</span>
                <span>상태</span>
              </div>
              <strong>{layoutStatus}</strong>
            </div>
            <div className="pro-layout-health">
              <div><span>방 크기</span><strong>{roomDimensions.width.toFixed(1)}m × {roomDimensions.depth.toFixed(1)}m</strong></div>
              <div><span>가구 수</span><strong>{placedFurniture.length}개</strong></div>
              <div><span>선택 수</span><strong>{selectedFurnitureCount}개</strong></div>
              <div><span>충돌 수</span><strong>{collisionCount}개</strong></div>
            </div>
            <p className="pro-layout-note">
              {layoutStatusDescription}
              {selectedFurnitureCount > 1 ? ' 현재는 선택된 가구 묶음을 기준으로 정렬합니다.' : ' 여러 가구를 Ctrl/Cmd 클릭하면 선택한 가구만 정렬할 수 있습니다.'}
            </p>
            <div className="pro-layout-actions">
              <button type="button" className="pro-quick-place-btn" onClick={() => handleAutoArrangeFurniture('align-left')}>좌측 정렬</button>
              <button type="button" className="pro-quick-place-btn" onClick={() => handleAutoArrangeFurniture('align-top')}>상단 정렬</button>
              <button type="button" className="pro-quick-place-btn" onClick={duplicateSelectedFurniture} disabled={!hasSelectedFurniture}>선택 복제</button>
              <button type="button" className="pro-quick-place-btn is-danger" onClick={deleteSelectedFurniture} disabled={!hasSelectedFurniture}>선택 삭제</button>
            </div>
          </div>

          <div className="pro-panel-section pro-panel-card pro-ai-recommend-card">
            <div className="pro-panel-head">
              <div className="pro-pane-title">
                <span className="pro-pane-kicker">AI Pick</span>
                <span>추천 가구</span>
              </div>
              <strong>{furnitureRecommendations.length}개</strong>
            </div>
            <p className="pro-ai-recommend-intro">
              {roomDiagnosis.summary}
            </p>
            <div className="pro-ai-diagnosis">
              <strong>{roomDiagnosis.label}</strong>
              {roomDiagnosis.issues.map((issue) => (
                <span key={issue}>{issue}</span>
              ))}
            </div>
            <div className="pro-ai-recommend-list">
              {furnitureRecommendations.map((recommendation) => (
                <article key={recommendation.type} className="pro-ai-recommend-item">
                  <div>
                    <strong>{recommendation.title}</strong>
                    <span>{recommendation.reason}</span>
                    <small>검색어: {recommendation.keyword}</small>
                  </div>
                  <div className="pro-ai-recommend-actions">
                    <button type="button" className="pro-quick-place-btn" onClick={() => handleApplyRecommendation(recommendation)}>
                      배치
                    </button>
                    <a href={recommendation.coupangUrl} target="_blank" rel="noreferrer" className="pro-coupang-link">
                      쿠팡 검색
                    </a>
                  </div>
                </article>
              ))}
            </div>
            <p className="pro-ai-disclaimer">
              쿠팡 파트너스 API 키가 없어서 실시간 가격/순위는 표시하지 않습니다.
            </p>
          </div>

          <div className="pro-panel-section pro-panel-card">
            <div className="pro-panel-head">
              <div className="pro-pane-title">
                <span className="pro-pane-kicker">Room</span>
                <span>공간 구조</span>
              </div>
            </div>
            <div className="pro-dim-row">
              <div className="pro-dim-label"><span>가로</span><strong>{roomDimensions.width.toFixed(1)}m</strong></div>
              <input type="range" min="3.6" max="8.5" step="0.1" value={roomDimensions.width} onChange={(e) => handleRoomDimensionChange('width', e.target.value)} />
            </div>
            <div className="pro-dim-row">
              <div className="pro-dim-label"><span>세로</span><strong>{roomDimensions.depth.toFixed(1)}m</strong></div>
              <input type="range" min="3.2" max="8.5" step="0.1" value={roomDimensions.depth} onChange={(e) => handleRoomDimensionChange('depth', e.target.value)} />
            </div>
            <div className="pro-dim-area">나만의 원룸 · {roomAreaLabel} · {roomDimensions.width.toFixed(1)} × {roomDimensions.depth.toFixed(1)}m</div>

            <div className="pro-structure-block">
              <div className="pro-structure-head">
                <span>창문</span>
                <button type="button" className={`pro-chip-toggle ${planElements?.window?.enabled !== false ? 'active' : ''}`} onClick={() => handlePlanElementToggle('window')}>
                  {planElements?.window?.enabled !== false ? '보임' : '숨김'}
                </button>
              </div>
              <div className="pro-side-toggle-row">
                {['top', 'right', 'bottom', 'left'].map((side) => (
                  <button
                    key={`window-${side}`}
                    type="button"
                    className={`pro-side-toggle ${planElements?.window?.side === side ? 'active' : ''}`}
                    onClick={() => handlePlanElementSideChange('window', side)}
                  >
                    {{ top: '상단', right: '오른쪽', bottom: '하단', left: '왼쪽' }[side]}
                  </button>
                ))}
              </div>
              <div className="pro-dim-row compact">
                <div className="pro-dim-label"><span>위치</span><strong>{Number(planElements?.window?.offset ?? 58).toFixed(0)}%</strong></div>
                <input type="range" min="10" max="90" step="1" value={planElements?.window?.offset ?? 58} onChange={(e) => handlePlanElementOffsetChange('window', e.target.value)} />
              </div>
            </div>

            <div className="pro-structure-block">
              <div className="pro-structure-head">
                <span>문</span>
                <button type="button" className={`pro-chip-toggle ${planElements?.door?.enabled !== false ? 'active' : ''}`} onClick={() => handlePlanElementToggle('door')}>
                  {planElements?.door?.enabled !== false ? '보임' : '숨김'}
                </button>
              </div>
              <div className="pro-side-toggle-row">
                {['top', 'right', 'bottom', 'left'].map((side) => (
                  <button
                    key={`door-${side}`}
                    type="button"
                    className={`pro-side-toggle ${planElements?.door?.side === side ? 'active' : ''}`}
                    onClick={() => handlePlanElementSideChange('door', side)}
                  >
                    {{ top: '상단', right: '오른쪽', bottom: '하단', left: '왼쪽' }[side]}
                  </button>
                ))}
              </div>
              <div className="pro-dim-row compact">
                <div className="pro-dim-label"><span>위치</span><strong>{Number(planElements?.door?.offset ?? 18).toFixed(0)}%</strong></div>
                <input type="range" min="8" max="92" step="1" value={planElements?.door?.offset ?? 18} onChange={(e) => handlePlanElementOffsetChange('door', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="pro-panel-section pro-panel-card">
            <div className="pro-panel-head">
              <div className="pro-pane-title">
                <span className="pro-pane-kicker">Objects</span>
                <span>배치된 가구</span>
              </div>
              <strong>{placedFurniture.length}개</strong>
            </div>
            <div className="pro-obj-list">
              {placedFurniture.length > 0 ? placedFurniture.map((item) => (
                <div
                  key={item.id}
                  className={`pro-obj-row ${selectedFurnitureSet.has(item.id) ? 'active' : ''} ${furnitureCollisions.has(item.id) ? 'warning' : ''}`}
                >
                  <button
                    type="button"
                    className="pro-obj-row-main"
                    onClick={(event) => {
                      handleSelectFurniture(item.id, { multi: event.ctrlKey || event.metaKey })
                      setStatusMessage(`${item.name} 선택`)
                    }}
                  >
                    <span className={`pro-obj-dot type-${item.type}`} />
                    <span className="pro-obj-name">{item.name}</span>
                    <span className="pro-obj-type">{item.type}</span>
                  </button>
                  <div className="pro-obj-row-actions">
                    <button
                      type="button"
                      className="pro-obj-icon-btn"
                      onClick={() => {
                        handleSelectFurniture(item.id)
                        window.setTimeout(() => duplicateSelectedFurniture(), 0)
                      }}
                      title="이 가구 복제"
                    >
                      복제
                    </button>
                    <button
                      type="button"
                      className="pro-obj-icon-btn is-danger"
                      onClick={() => {
                        handleSelectFurniture(item.id)
                        window.setTimeout(() => deleteSelectedFurniture(), 0)
                      }}
                      title="이 가구 삭제"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              )) : (
                <p className="pro-obj-empty">배치된 가구가 없습니다.</p>
              )}
            </div>
          </div>

          {hasSelectedFurniture ? (
            <div className="pro-panel-section pro-panel-card pro-panel-card-inspector">
              <div className="pro-panel-head">
                <div className="pro-pane-title">
                  <span className="pro-pane-kicker">Inspector</span>
                  <span>선택 속성</span>
                </div>
              </div>
              {hasMultipleSelectedFurniture ? (
                <>
                  <div className="pro-sel-group-badge">{selectedFurnitureCount}개 가구 선택 중</div>
                  <div className="pro-prop-grid">
                    <span>대표 가구</span><span>{selectedFurnitureLabel}</span>
                    <span>그룹 상태</span><span>{selectedCollisionCount > 0 ? `${selectedCollisionCount}개 충돌` : '정상'}</span>
                    <span>이동 방식</span><span>묶음 이동</span>
                    <span>복제 방식</span><span>같은 간격으로 복제</span>
                  </div>
                  <p className="pro-sel-note">선택한 가구들은 함께 이동하고, 정렬과 복제도 현재 선택 묶음을 기준으로 적용됩니다.</p>
                  <div className="pro-group-actions">
                    <button type="button" className="pro-quick-place-btn" onClick={duplicateSelectedFurniture}>선택 복제</button>
                    <button type="button" className="pro-quick-place-btn is-danger" onClick={deleteSelectedFurniture}>선택 삭제</button>
                    <button type="button" className="pro-quick-place-btn" onClick={() => handleAutoArrangeFurniture('align-left')}>좌측 정렬</button>
                    <button type="button" className="pro-quick-place-btn" onClick={() => handleAutoArrangeFurniture('align-top')}>상단 정렬</button>
                    <button type="button" className="pro-quick-place-btn" onClick={() => handleAutoArrangeFurniture('distribute-horizontal')}>가로</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="pro-sel-name">{selectedFurniture?.name}</div>
                  {selectedFurnitureCatalog ? (
                    <div className="pro-sel-meta">
                      <span>{selectedFurnitureCatalog.finish}</span>
                    </div>
                  ) : null}
                  <div className="pro-prop-grid">
                    <span>위치</span><span>{selectedFurniture?.position ?? '--'}</span>
                    <span>회전</span><span>{selectedFurniture?.rotation ?? 0}도</span>
                    <span>크기</span><span>{selectedFurniture?.scale ?? 1}배</span>
                    <span>충돌</span><span>{furnitureCollisions.has(selectedFurniture?.id) ? '감지됨' : '없음'}</span>
                  </div>
                  <div className="pro-precision-grid">
                    <label>
                      <span>X (%)</span>
                      <input type="number" min="0" max="90" value={Math.round(selectedFurniture?.x ?? 0)} onChange={(e) => handleUpdateSelectedFurnitureField('x', e.target.value)} />
                    </label>
                    <label>
                      <span>Y (%)</span>
                      <input type="number" min="0" max="90" value={Math.round(selectedFurniture?.y ?? 0)} onChange={(e) => handleUpdateSelectedFurnitureField('y', e.target.value)} />
                    </label>
                    <label>
                      <span>회전 (도)</span>
                      <input type="number" min="0" max="359" value={Math.round(selectedFurniture?.rotation ?? 0)} onChange={(e) => handleUpdateSelectedFurnitureField('rotation', e.target.value)} />
                    </label>
                  </div>
                  {selectedFurnitureMetricSize ? (
                    <div className="pro-size-inputs">
                      <label>
                        <span>가로 (cm)</span>
                        <input type="number" min="30" max="500" value={selectedFurnitureMetricSize.widthCm} onChange={(e) => handleFurnitureSizeChange('width', e.target.value)} />
                      </label>
                      <label>
                        <span>세로 (cm)</span>
                        <input type="number" min="20" max="400" value={selectedFurnitureMetricSize.depthCm} onChange={(e) => handleFurnitureSizeChange('depth', e.target.value)} />
                      </label>
                    </div>
                  ) : null}
                  <div className="pro-nudge-row">
                    <button type="button" className="pro-nudge-btn" onClick={() => resizeSelectedFurniture(-0.1)}>축소</button>
                    <button type="button" className="pro-nudge-btn" onClick={() => resizeSelectedFurniture(0.1)}>확대</button>
                    <button type="button" className="pro-nudge-btn" onClick={() => rotateSelectedFurniture(-15)}>좌로 15도</button>
                    <button type="button" className="pro-nudge-btn" onClick={() => rotateSelectedFurniture(15)}>우로 15도</button>
                  </div>
                </>
              )}
              <div className="pro-dpad">
                <button type="button" className="pro-dpad-btn forward" onClick={() => moveSelectedFurniture(0, -4)}>↑</button>
                <button type="button" className="pro-dpad-btn left" onClick={() => moveSelectedFurniture(-4, 0)}>←</button>
                <button type="button" className="pro-dpad-btn right" onClick={() => moveSelectedFurniture(4, 0)}>→</button>
                <button type="button" className="pro-dpad-btn backward" onClick={() => moveSelectedFurniture(0, 4)}>↓</button>
              </div>
              <div className="pro-selection-shortcuts">`Ctrl/Cmd + D` · `Delete`</div>
              <button type="button" className="pro-secondary-btn" onClick={duplicateSelectedFurniture}>선택 복제</button>
              <button type="button" className="pro-delete-btn" onClick={deleteSelectedFurniture}>선택 삭제</button>
            </div>
          ) : null}
        </aside>
      </div>
    </main>
  )


  // ??? renderPanel ??????????????????????????????????????????????????????????????
  const renderPanel = () => {
    if (activeTab === 'projects') {
      const selectedProjectLayout = selectedProject ? projectLayouts[selectedProject.id] : null
      const recentProjects = projects.slice(0, 4)
      const projectStarterCards = [
        ...studioStarterOptions.map((starter) => ({
          id: starter.id,
          title: `${starter.pyeongValue}평 원룸`,
          detail: '내 취향대로 바로 꾸미기 시작',
          meta: 'My Room',
          action: () => handleCreateProject(starter),
        })),
      ]

      return (
        <section className="dashboard-panel project-studio-panel">
          <div className="project-studio-main">
            <div className="project-studio-topbar">
              <div className="project-studio-topbar-copy">
                <p className="section-kicker">My One Room</p>
                <strong>{projects.length}개의 내 원룸</strong>
              </div>
              <div className="project-studio-topbar-actions">
                <button type="button" className="project-studio-primary" onClick={openStarterPicker}>
                  <span>+</span>
                  새 원룸 만들기
                </button>
              </div>
            </div>

            <section className="project-start-panel">
              <div className="project-section-heading">
                <div>
                  <p className="section-kicker">Start</p>
                  <h3>나만의 원룸을 시작해볼까요?</h3>
                </div>
                <div className="project-filter-row" aria-hidden="true">
                  <span>원룸</span>
                  <span>바로 시작</span>
                </div>
              </div>

              <div className="project-starter-grid">
                {projectStarterCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    className="project-starter-card"
                    onClick={card.action}
                  >
                    <div className="project-starter-copy">
                      <p>{card.meta}</p>
                      <strong>{card.title}</strong>
                      <span>{card.detail}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="project-recent-panel">
              <div className="project-section-heading">
                <div>
                  <p className="section-kicker">Recent</p>
                  <h3>최근 꾸민 원룸</h3>
                </div>
              </div>

              <div className="project-recent-grid">
                {recentProjects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={`project-recent-card ${project.id === selectedProjectId ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProjectId(project.id)
                      loadProjectWorkspace(project.id)
                      setStatusMessage(`${project.name} 원룸을 불러왔습니다.`)
                    }}
                  >
                    <span
                      role="button"
                      tabIndex={0}
                      className="project-recent-delete"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDeleteProjectWithConfirm(project.id, project.name)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          event.stopPropagation()
                          handleDeleteProjectWithConfirm(project.id, project.name)
                        }
                      }}
                    >
                      삭제
                    </span>
                    <Suspense fallback={<div className="project-thumb project-thumb-loading" />}>
                      <ProjectThumbnail layout={projectLayouts[project.id]} variant="recent" />
                    </Suspense>
                    <div className="project-recent-copy">
                      <strong>{project.name}</strong>
                      <span>{project.summary}</span>
                      <small>{project.updatedAtISO ? formatRelativeTime(project.updatedAtISO) : (project.updatedAt ?? '방금 전')}</small>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            <section className="project-manage-panel">
              <div className="project-section-heading">
                <div>
                  <p className="section-kicker">Selected Room</p>
                  <h3>{selectedProject?.name}</h3>
                </div>
              </div>

              <div className="project-manage-grid">
                <article className="project-manage-summary">
                  <Suspense fallback={<div className="project-thumb project-thumb-loading" />}>
                    <ProjectThumbnail layout={selectedProjectLayout} variant="detail" />
                  </Suspense>
                  <div className="project-manage-summary-copy">
                    <strong>{selectedProject?.name}</strong>
                    <span>{selectedProject?.summary}</span>
                  </div>
                  <div className="project-manage-meta">
                    <span>{selectedProject?.spaceType ?? '원룸'}</span>
                    <span>{selectedProject?.status ?? '대기'}</span>
                    <span>{selectedProject?.updatedAtISO ? formatRelativeTime(selectedProject.updatedAtISO) : (selectedProject?.updatedAt ?? '방금 전')}</span>
                  </div>
                  <button
                    type="button"
                    className="project-studio-primary project-studio-primary-wide"
                    onClick={() => handleOpenEditor(selectedProject?.id)}
                  >
                    <span>+</span>
                    꾸미기 시작
                  </button>
                </article>

                <article className="project-manage-form">
                  <label className="project-manage-field">
                    <span>원룸 이름</span>
                    <input
                      type="text"
                      value={projectNameDraft}
                      onChange={(e) => setProjectNameDraft(e.target.value)}
                      placeholder="내 원룸 이름 입력"
                    />
                  </label>

                  <div className="project-manage-field-grid">
                    <label className="project-manage-field">
                      <span>방 타입</span>
                      <input type="text" value="원룸" readOnly />
                    </label>

                    <label className="project-manage-field">
                      <span>평수</span>
                      <select value={currentRoomPyeong} onChange={(e) => handleRoomPyeongChange(e.target.value)}>
                        {studioStarterOptions.map((starter) => (
                          <option key={starter.id} value={starter.pyeongValue}>{starter.pyeongLabel}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="project-manage-field">
                    <span>원룸 소개</span>
                    <textarea
                      rows="4"
                      value={projectDescriptionDraft}
                      onChange={(e) => setProjectDescriptionDraft(e.target.value)}
                      placeholder="이 원룸을 어떻게 꾸미고 싶은지 적어보세요"
                    />
                  </label>

                  <div className="project-manage-form-actions">
                    <button type="button" className="project-studio-utility" onClick={handleRenameProject}>저장</button>
                    <button type="button" className="project-studio-primary" onClick={() => handleOpenEditor(selectedProject?.id)}>
                      <span>+</span>
                      꾸미기 계속하기
                    </button>
                  </div>
                </article>
              </div>
            </section>
          </div>
        </section>
      )
    }

    if (activeTab === 'account') {
      const workspaceSteps = (
        <Suspense fallback={<AppSectionFallback className="workspace-steps-loading" title="안내를 불러오는 중입니다." description="계정 화면을 준비하고 있습니다." />}>
          <WorkspaceSteps steps={tabStepsById.account} />
        </Suspense>
      )

      return (
        <AccountPanel
          currentUser={currentUser}
          profileForm={profileForm}
          onProfileFormChange={handleProfileFormChange}
          onProfileSubmit={handleProfileSubmit}
          onAddressLookup={handleAddressLookup}
          profileSaving={profileSaving}
          addressLookupLoading={addressLookupLoading}
          accountActionLoading={accountActionLoading}
          onRefreshAccount={() => setStatusMessage('계정 정보를 다시 확인했습니다.')}
          onOpenDeleteModal={() => {
            setDeleteAccountConfirmText('')
            setShowDeleteAccountModal(true)
          }}
          workspaceSteps={workspaceSteps}
        />
      )
    }

    // Home tab
    if (activeTab === 'home') {
      return (
        <HomePanel
          heroImage={stylePresets[0].image}
          projectCount={projects.length}
          furnitureCount={placedFurniture.length}
          onOpenStarterPicker={openStarterPicker}
          onResumeProject={() => handleOpenEditor(selectedProject?.id)}
        />
      )
    }

    return null
  }

  // ??? Full render ??????????????????????????????????????????????????????????????
  if (authLoading && !currentUser) {
    return (
      <div className="auth-shell auth-shell-loading">
        <div className="auth-loading-card">
          <p className="auth-kicker">My One Room</p>
          <strong>로그인 상태를 확인하고 있습니다.</strong>
          <span>계정 정보를 불러오는 중입니다.</span>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <Suspense fallback={<AppSectionFallback className="auth-shell auth-shell-loading" title="로그인 화면을 준비하고 있습니다." description="카카오 또는 네이버로 바로 시작할 수 있습니다." />}>
        <AuthScreen
          loading={authLoading}
          message={authMessage}
          onAuthSuccess={handleAuthSuccess}
          onSocialLogin={handleSocialLogin}
        />
      </Suspense>
    )
  }

  if (currentView === 'editor') {
    return (
      <>
        {renderEditor()}
        {toastMessage ? <div className="toast-message" role="status" aria-live="polite">{toastMessage}</div> : null}
      </>
    )
  }

  return (
    <>
      <div className={`landing-shell tab-${activeTab}${activeTab === 'home' ? ' home-glass' : ''}`}>
        <header className={`site-header${activeTab === 'home' ? ' is-home' : ''}`}>
          <div className="brand-lockup">
            <button
              type="button"
              className="brand-button"
              onClick={() => { setActiveTab('home'); setCurrentView('home') }}
            >
              <div>
                <p className="brand-kicker">나만의 원룸 꾸미기</p>
                <strong>My One Room</strong>
              </div>
            </button>
          </div>
          <nav className="site-nav">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={activeTab === tab.id ? 'active' : ''}
                onClick={() => { setActiveTab(tab.id); setCurrentView('home'); setStatusMessage(`${tab.label} 화면으로 이동했습니다.`) }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="header-actions">
            <button type="button" className="header-user-chip" onClick={() => { setActiveTab('account'); setStatusMessage('내 정보 화면으로 이동했습니다.') }}>
              <strong>{currentUser.name}</strong>
              <span>{currentUser.email}</span>
            </button>
            <button type="button" className="header-ghost" onClick={handleResetDemoData}>데모 초기화</button>
            <button type="button" className="header-primary" onClick={openStarterPicker}>
              <span className="btn-icon">+</span>새 원룸
            </button>
            <button type="button" className="header-ghost" onClick={handleLogout}>로그아웃</button>
          </div>
        </header>

        {renderPanel()}
      </div>

      {showOnboarding ? (
        <OnboardingModal
          steps={onboardingSteps}
          onClose={() => {
            setShowOnboarding(false)
            setStatusMessage('시작 안내를 닫았습니다.')
          }}
          onStart={() => {
            setShowOnboarding(false)
            setShowStarterPicker(true)
          }}
        />
      ) : null}

      {showStarterPicker ? (
        <StarterPickerModal
          starters={studioStarterOptions}
          onCreateProject={handleCreateProject}
          onClose={() => {
            setShowStarterPicker(false)
            setStatusMessage('원룸 시작 창을 닫았습니다.')
          }}
        />
      ) : null}

      {currentUser && !currentUser.profileComplete ? (
        <ProfileSetupModal
          profileForm={profileForm}
          onProfileFormChange={handleProfileFormChange}
          onProfileSubmit={handleProfileSubmit}
          onAddressLookup={handleAddressLookup}
          profileSaving={profileSaving}
          addressLookupLoading={addressLookupLoading}
        />
      ) : null}

      {showDeleteAccountModal ? (
        <DeleteAccountModal
          confirmText={deleteAccountConfirmText}
          onConfirmTextChange={setDeleteAccountConfirmText}
          onCancel={() => {
            setShowDeleteAccountModal(false)
            setDeleteAccountConfirmText('')
            setStatusMessage('회원탈퇴가 취소되었습니다.')
          }}
          onDelete={handleDeleteAccount}
          loading={accountActionLoading}
        />
      ) : null}

      {shareProjectId ? (
        <ShareProjectModal
          project={shareProject}
          shareLink={buildShareLink(shareProjectId)}
          onClose={handleCloseShare}
          onCopy={handleCopyShareLink}
          onInvite={() => setStatusMessage(`${shareProject?.name} 프로젝트 초대 메일 발송을 준비했습니다.`)}
        />
      ) : null}

      {toastMessage ? <div className="toast-message" role="status" aria-live="polite">{toastMessage}</div> : null}
    </>
  )
}

export default App
