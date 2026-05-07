import fs from 'node:fs'
import path from 'node:path'
import PptxGenJS from 'pptxgenjs'

const rootDir = process.cwd()
const outDir = path.join(rootDir, 'artifacts')
const mediaDir = path.join(outDir, 'ppt-media')
const outFile = path.join(outDir, 'MyOneRoom_Portfolio_22slides_v2.pptx')

const img = {
  viewer: 'image-14-1.png',
  main: 'image-2-1.png',
  project1: 'image-3-1.png',
  complete: 'image-13-1.png',
  signupDone: 'image-5-1.png',
  login: 'image-6-1.png',
  signup: 'image-6-2.png',
  reset: 'image-6-3.png',
  saveInfo: 'image-7-1.png',
  project2: 'image-9-1.png',
  placement: 'image-10-1.png',
  empty2d: 'image-11-1.png',
  aiPick: 'image-15-1.png',
  coupang: 'image-16-1.png',
  account: 'image-17-1.png',
  withdraw: 'image-18-1.png',
}

for (const [key, name] of Object.entries(img)) {
  img[key] = path.join(mediaDir, name)
  if (!fs.existsSync(img[key])) throw new Error(`Missing image: ${img[key]}`)
}

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'My One Room'
pptx.subject = 'My One Room Portfolio'
pptx.title = 'My One Room Portfolio'
pptx.lang = 'ko-KR'
pptx.theme = {
  headFontFace: 'Malgun Gothic',
  bodyFontFace: 'Malgun Gothic',
  lang: 'ko-KR',
}

const C = {
  bg: 'F7F9FC',
  card: 'FFFFFF',
  ink: '14171A',
  muted: '6B7280',
  sub: '9AA4B2',
  line: 'DEE5EE',
  blue: '0878E6',
  blueSoft: 'E7F2FF',
  dark: '1D1D1F',
  warm: 'F6F1EA',
  red: 'E8505B',
}

function imageSize(file) {
  const b = fs.readFileSync(file)
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }
}

function text(slide, value, x, y, w, h, opt = {}) {
  slide.addText(value, {
    x, y, w, h,
    fontFace: 'Malgun Gothic',
    fontSize: opt.size ?? 11,
    bold: opt.bold ?? false,
    color: opt.color ?? C.ink,
    align: opt.align ?? 'left',
    valign: opt.valign ?? 'top',
    margin: opt.margin ?? 0,
    fit: 'shrink',
    breakLine: opt.breakLine ?? false,
    charSpace: opt.charSpace,
  })
}

function card(slide, x, y, w, h, opt = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: opt.radius ?? 0.18,
    fill: { color: opt.fill ?? C.card, transparency: opt.transparency ?? 0 },
    line: { color: opt.line ?? C.line, pt: opt.pt ?? 0.75 },
    shadow: opt.shadow === false ? undefined : {
      type: 'outer',
      color: 'C9D3DF',
      opacity: 0.12,
      blur: 2,
      angle: 45,
      distance: 1,
    },
  })
}

function base(slide, no, title, label = 'MY ONE ROOM') {
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: C.blue }, line: { transparency: 100 } })
  slide.addShape(pptx.ShapeType.rect, { x: 9.65, y: 0.12, w: 3.683, h: 7.38, fill: { color: 'EDF5FD', transparency: 14 }, line: { transparency: 100 } })
  text(slide, label, 0.62, 0.34, 2.7, 0.2, { size: 7.5, bold: true, color: C.muted, charSpace: 1.4 })
  text(slide, title, 0.62, 0.72, 8.7, 0.48, { size: 22, bold: true })
  text(slide, String(no).padStart(2, '0'), 11.7, 0.52, 0.95, 0.24, { size: 11, bold: true, color: C.blue, align: 'center' })
  slide.addShape(pptx.ShapeType.line, { x: 0.62, y: 1.42, w: 12.08, h: 0, line: { color: C.line, pt: 0.7 } })
  text(slide, 'My One Room Portfolio', 0.62, 7.13, 2.6, 0.16, { size: 6.8, color: C.sub })
}

function fitImage(slide, file, x, y, w, h, opt = {}) {
  if (opt.frame !== false) card(slide, x, y, w, h, { fill: opt.fill ?? C.card, radius: opt.radius ?? 0.2 })
  const s = imageSize(file)
  const scale = Math.min(w / s.w, h / s.h)
  const iw = s.w * scale
  const ih = s.h * scale
  slide.addImage({ path: file, x: x + (w - iw) / 2, y: y + (h - ih) / 2, w: iw, h: ih })
}

function bullets(slide, items, x, y, w, h) {
  const runs = items.map((item, idx) => ({
    text: item,
    options: { bullet: { type: 'ul' }, breakLine: idx < items.length - 1 },
  }))
  slide.addText(runs, {
    x, y, w, h,
    fontFace: 'Malgun Gothic',
    fontSize: 10.7,
    color: C.ink,
    margin: 0,
    fit: 'shrink',
    paraSpaceAfterPt: 9,
  })
}

function pill(slide, value, x, y, w, fill = C.blueSoft, color = C.blue) {
  slide.addShape(pptx.ShapeType.roundRect, { x, y, w, h: 0.32, rectRadius: 0.12, fill: { color: fill }, line: { transparency: 100 } })
  text(slide, value, x, y + 0.08, w, 0.14, { size: 7.3, bold: true, color, align: 'center' })
}

function contentSlide(no, title, headline, items, image, caption) {
  const slide = pptx.addSlide()
  base(slide, no, title)
  card(slide, 0.74, 1.84, 4.28, 4.55)
  text(slide, headline, 1.04, 2.12, 3.48, 0.42, { size: 16.5, bold: true })
  bullets(slide, items, 1.06, 2.86, 3.5, 2.6)
  fitImage(slide, image, 5.42, 1.84, 7.08, 4.55)
  text(slide, caption, 5.62, 6.54, 6.7, 0.22, { size: 8.4, color: C.muted, align: 'center' })
}

function titleSlide() {
  const slide = pptx.addSlide()
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.14, fill: { color: C.blue }, line: { transparency: 100 } })
  card(slide, 6.58, 0.78, 5.94, 4.94, { radius: 0.22 })
  fitImage(slide, img.viewer, 6.86, 1.06, 5.38, 4.38, { frame: false })
  text(slide, 'MY ONE ROOM', 0.82, 1.08, 2.4, 0.22, { size: 8.2, bold: true, color: C.blue, charSpace: 1.5 })
  text(slide, '원룸 인테리어\n플래너 서비스', 0.82, 1.52, 5.26, 1.42, { size: 31, bold: true })
  text(slide, '2D 배치부터 3D 둘러보기, AI 가구 추천과 쇼핑 검색까지 연결한 개인 맞춤 원룸 꾸미기 웹 서비스입니다.', 0.84, 3.26, 4.98, 0.58, { size: 12.8, color: C.muted })
  pill(slide, 'React', 0.84, 4.38, 0.84)
  pill(slide, 'Spring Boot', 1.82, 4.38, 1.24)
  pill(slide, 'Three.js', 3.2, 4.38, 1.0)
  pill(slide, 'AI Pick', 4.34, 4.38, 0.98, C.warm, C.dark)
  ;[
    ['22', 'portfolio slides'],
    ['2D/3D', 'editor modes'],
    ['AI', 'recommendation'],
  ].forEach(([v, l], i) => {
    const x = 0.84 + i * 1.66
    card(slide, x, 5.68, 1.42, 0.72, { fill: 'FAFCFF', radius: 0.16, shadow: false })
    text(slide, v, x, 5.82, 1.42, 0.24, { size: 13.5, bold: true, color: C.blue, align: 'center' })
    text(slide, l, x, 6.12, 1.42, 0.14, { size: 6.8, color: C.sub, align: 'center' })
  })
  text(slide, 'Portfolio · 2026', 0.84, 7.1, 2.0, 0.16, { size: 7, color: C.sub })
}

function flowSlide() {
  const slide = pptx.addSlide()
  base(slide, 5, '사용자 플로우')
  const steps = [
    ['회원가입/로그인', '인증 후 서비스 진입'],
    ['정보 저장', '프로필과 주소 보완'],
    ['프로젝트 생성', '평수 기반 원룸 시작'],
    ['2D/3D 편집', '배치와 시각화'],
    ['추천/검색', 'AI Pick과 쿠팡 연결'],
  ]
  steps.forEach(([h, b], i) => {
    const x = 0.76 + i * 2.5
    card(slide, x, 2.08, 2.04, 2.48, { fill: i === 3 ? 'F4FAFF' : C.card })
    text(slide, `0${i + 1}`, x + 0.18, 2.34, 0.42, 0.18, { size: 9, bold: true, color: C.blue })
    text(slide, h, x + 0.18, 2.86, 1.6, 0.4, { size: 12.3, bold: true, align: 'center' })
    text(slide, b, x + 0.18, 3.54, 1.6, 0.34, { size: 8.4, color: C.muted, align: 'center' })
    if (i < steps.length - 1) text(slide, '→', x + 2.12, 3.08, 0.25, 0.22, { size: 14, bold: true, color: C.blue })
  })
  fitImage(slide, img.signupDone, 1.08, 5.22, 5.1, 1.2, { frame: false })
  fitImage(slide, img.main, 7.05, 5.08, 5.0, 1.42, { frame: false })
}

function authSlide() {
  const slide = pptx.addSlide()
  base(slide, 6, '인증 화면')
  fitImage(slide, img.login, 0.74, 1.82, 3.82, 4.38)
  fitImage(slide, img.signup, 4.76, 1.82, 3.82, 4.38)
  fitImage(slide, img.reset, 8.78, 1.82, 3.82, 4.38)
  text(slide, '로그인, 회원가입, 비밀번호 재설정을 동일한 미니멀 톤으로 맞춰 진입 경험의 일관성을 확보했습니다.', 0.96, 6.5, 11.35, 0.25, { size: 10.2, color: C.muted, align: 'center' })
}

function processSlide() {
  const slide = pptx.addSlide()
  base(slide, 4, '해결 방향')
  text(slide, '배치 → 확인 → 추천 → 구매 탐색까지 한 흐름으로 이어지는 원룸 플래너', 0.78, 1.86, 8.8, 0.36, { size: 17, bold: true })
  const cards = [
    ['01', '원룸 선택', '평수와 방 타입을 선택해 빠르게 시작'],
    ['02', '2D 배치', '가구 위치와 정렬을 직관적으로 조정'],
    ['03', '3D 확인', '실제 공간감과 동선을 시각적으로 확인'],
    ['04', 'AI 추천', '부족한 가구와 검색 키워드를 제안'],
  ]
  cards.forEach(([n, h, b], i) => {
    const x = 0.78 + i * 3.04
    card(slide, x, 2.66, 2.62, 2.42, { fill: i === 2 ? 'F4FAFF' : C.card })
    text(slide, n, x + 0.24, 2.94, 0.5, 0.22, { size: 10, bold: true, color: C.blue })
    text(slide, h, x + 0.24, 3.36, 1.92, 0.3, { size: 14.2, bold: true })
    text(slide, b, x + 0.24, 3.9, 2.04, 0.52, { size: 8.8, color: C.muted })
  })
  fitImage(slide, img.complete, 1.1, 5.55, 11.1, 0.92, { frame: false })
}

function techSlide() {
  const slide = pptx.addSlide()
  base(slide, 20, '구현 포인트')
  const techs = [
    ['Frontend', 'React, Vite, CSS\n컴포넌트 기반 화면 구성'],
    ['3D', 'Three.js, React Three Fiber\n방 구조와 가구 모델링'],
    ['Backend', 'Spring Boot\n회원/인증/프로젝트 API'],
    ['UX', '미니멀 화면 톤\n카드, CTA, 상태 안내 통일'],
  ]
  techs.forEach(([h, b], i) => {
    const x = 0.86 + (i % 2) * 5.88
    const y = 1.94 + Math.floor(i / 2) * 2.02
    card(slide, x, y, 5.35, 1.46, { fill: i === 1 ? 'F4FAFF' : C.card })
    text(slide, h, x + 0.28, y + 0.26, 1.45, 0.24, { size: 13.2, bold: true, color: C.blue })
    text(slide, b, x + 2.0, y + 0.26, 3.0, 0.62, { size: 10.1, color: C.muted })
  })
  text(slide, '가구 배치 데이터 하나를 2D 편집, 3D 시각화, AI 추천, 프로젝트 저장에서 함께 쓰는 구조로 설계했습니다.', 1.02, 6.18, 11.08, 0.32, { size: 11.5, bold: true, align: 'center' })
}

function dataSlide() {
  const slide = pptx.addSlide()
  base(slide, 19, '데이터 흐름')
  const nodes = ['사용자', 'React UI', 'Planner State', 'Spring Boot API', '저장 데이터']
  nodes.forEach((n, i) => {
    const x = 0.82 + i * 2.48
    card(slide, x, 2.12, 1.98, 2.12, { fill: i === 2 ? 'F4FAFF' : C.card })
    text(slide, n, x + 0.18, 2.78, 1.62, 0.3, { size: 12.6, bold: true, align: 'center' })
    if (i < nodes.length - 1) text(slide, '→', x + 2.08, 2.86, 0.26, 0.22, { size: 14, bold: true, color: C.blue })
  })
  bullets(slide, [
    '사용자 입력은 React 상태로 즉시 반영되고 저장 시 레이아웃 데이터로 보관됩니다.',
    '2D와 3D는 같은 가구 데이터를 공유해 화면 전환 후에도 배치가 유지됩니다.',
    '계정 정보와 프로젝트 정보를 분리해 유지보수성과 확장성을 고려했습니다.',
  ], 1.18, 5.08, 10.8, 0.92)
}

function troubleSlide() {
  const slide = pptx.addSlide()
  base(slide, 21, '트러블슈팅')
  const issues = [
    ['가구 공중 부양', '가구 타입별 높이와 지지면 계산을 조정해 바닥 접지감을 개선'],
    ['뷰어 모드 미동작', '투어 전용 카메라를 실제 렌더링 카메라로 등록하도록 수정'],
    ['화면 톤 불일치', '로그인 화면의 미니멀 톤을 전체 화면으로 확장'],
  ]
  issues.forEach(([h, b], i) => {
    card(slide, 0.9, 1.88 + i * 1.25, 5.25, 0.88, { fill: i === 1 ? 'F4FAFF' : C.card })
    text(slide, h, 1.18, 2.08 + i * 1.25, 2.45, 0.22, { size: 11.8, bold: true })
    text(slide, b, 1.18, 2.42 + i * 1.25, 4.4, 0.18, { size: 8.4, color: C.muted })
  })
  fitImage(slide, img.viewer, 6.7, 1.86, 5.84, 3.96)
  text(slide, '문제가 보일 때마다 사용자가 체감하는 불편을 기준으로 화면과 코드를 함께 개선했습니다.', 6.88, 6.12, 5.4, 0.28, { size: 9.8, color: C.muted, align: 'center' })
}

function closingSlide() {
  const slide = pptx.addSlide()
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.14, fill: { color: C.blue }, line: { transparency: 100 } })
  text(slide, '결과와 회고', 0.86, 0.74, 3.6, 0.42, { size: 24, bold: true })
  text(slide, '단순한 CRUD를 넘어 사용자가 직접 방을 꾸미고, 3D로 확인하고, 추천까지 받을 수 있는 인터랙티브 서비스로 확장했습니다.', 0.88, 1.58, 5.5, 0.64, { size: 12.5, color: C.muted })
  ;[
    ['완성도', '로그인부터 프로젝트 저장, 2D/3D 편집까지 한 흐름 완성'],
    ['확장성', 'AI 추천과 쇼핑 검색으로 서비스 경험 확장'],
    ['개선점', '상품 API, 정교한 3D 모델, 반응형 고도화 예정'],
  ].forEach(([h, b], i) => {
    card(slide, 0.9, 2.82 + i * 1.08, 5.25, 0.72, { fill: i === 1 ? 'F4FAFF' : C.card })
    text(slide, h, 1.18, 3.03 + i * 1.08, 1.0, 0.18, { size: 10.2, bold: true, color: C.blue })
    text(slide, b, 2.32, 3.03 + i * 1.08, 3.42, 0.18, { size: 8.4, color: C.muted })
  })
  fitImage(slide, img.complete, 6.78, 1.08, 5.82, 4.72)
  text(slide, 'Thank you', 8.72, 6.26, 2.2, 0.32, { size: 18, bold: true, color: C.blue, align: 'center' })
}

titleSlide()
contentSlide(2, '프로젝트 개요', '서비스 한 줄 정의', [
  '작은 원룸에서도 가구 배치와 동선을 빠르게 검토할 수 있는 웹 기반 플래너',
  '초기 원룸 선택, 프로젝트 저장, 2D 편집, 3D 확인을 한 흐름으로 제공',
  'AI Pick과 쿠팡 검색 연결로 배치 이후 구매 탐색까지 확장',
], img.main, '메인 화면: 프로젝트 진입과 이어하기 중심의 홈 구조')
contentSlide(3, '문제 정의', '사용자가 겪는 불편', [
  '원룸은 면적이 좁아 가구 하나만 잘못 배치해도 동선과 수납 효율이 크게 떨어짐',
  '구매 전 실제 방 안에서의 크기감과 배치감을 판단하기 어려움',
  '가구 추천, 배치, 쇼핑 검색이 각각 분리되어 반복 탐색 비용이 큼',
], img.project1, '프로젝트 시작 전 사용자의 공간 고민을 서비스로 연결')
processSlide()
flowSlide()
authSlide()
contentSlide(7, '온보딩과 정보 저장', '계정 정보를 한 번에 정리', [
  '소셜 로그인 후 부족한 기본 정보를 별도 화면에서 보완',
  '주소 검색 팝업을 사용해 실제 서비스형 입력 흐름 구현',
  '저장 이후 마이페이지와 프로젝트 관리 화면에서 계정 정보를 재사용',
], img.saveInfo, '최초 로그인/재로그인 시 기본 정보 저장 플로우')
contentSlide(8, '홈 화면', '프로젝트 진입을 단순화', [
  '새 원룸 시작과 최근 원룸 이어하기를 중앙에 배치',
  '상단 탭으로 홈, 프로젝트, 내 정보를 빠르게 이동',
  '로그인 화면과 같은 여백과 톤으로 전체 분위기 통일',
], img.main, '홈: 큰 여백과 명확한 CTA 중심의 랜딩 화면')
contentSlide(9, '프로젝트 관리', '저장된 원룸을 다시 이어가기', [
  '최근 꾸민 원룸과 선택된 원룸 상세를 같은 화면에서 확인',
  '원룸 이름, 타입, 평수, 소개를 수정하고 저장 가능',
  '프로젝트 선택 후 바로 편집 화면으로 이어지는 구조',
], img.project2, '프로젝트 탭: 카드 목록과 상세 편집 영역')
contentSlide(10, '에디터 전체 구조', '3분할 작업 환경', [
  '왼쪽: 가구 카탈로그와 빠른 배치 버튼',
  '중앙: 2D/3D 캔버스와 저장, 완료, 모드 전환',
  '오른쪽: 상태 요약, 정렬/삭제, AI Pick 추천 패널',
], img.placement, '가구 배치 화면: 카탈로그, 캔버스, 컨트롤 패널')
contentSlide(11, '2D 배치 모드', '배치 전 상태 안내', [
  '가구가 없을 때 다음 행동을 안내하는 메시지 제공',
  '방 크기와 벽, 창문, 문 정보를 기준으로 배치 영역 구성',
  '선택, 정렬, 삭제, AI 추천으로 편집 흐름 보조',
], img.empty2d, '2D 모드: 배치 전 상태에서도 다음 행동을 안내')
contentSlide(12, '가구 배치 기능', '선택과 조작 중심의 편집', [
  '카탈로그에서 가구를 선택하고 배치 버튼으로 캔버스에 추가',
  '선택된 가구는 외곽선과 핸들로 현재 조작 대상을 표시',
  '정렬, 선택 삭제, 전체 삭제 같은 반복 편집 기능 제공',
], img.placement, '가구 배치: 선택 상태와 편집 컨트롤을 시각적으로 표시')
contentSlide(13, '3D 시각화', '배치를 공간감으로 확인', [
  '2D에서 만든 배치를 3D 방 구조로 변환',
  '벽, 바닥, 창문, 조명, 가구 모델을 조합해 방 분위기 구현',
  '가구 높이와 바닥 접지를 조정해 공중에 뜨는 문제 개선',
], img.complete, '3D 모드: 원룸 안에서 배치감을 확인')
contentSlide(14, '뷰어 모드', '사용자 시점 둘러보기', [
  '편집용 카메라와 별도로 사용자 시점 카메라 제공',
  'WASD/방향키와 화면 드래그로 이동 및 시선 조작',
  '배치 결과를 실제 방 안에 들어간 느낌으로 확인',
], img.viewer, '둘러보기 모드: 배치 결과를 1인칭 시점으로 체감')
contentSlide(15, 'AI Pick 추천', '현재 방 상태 기반 가구 제안', [
  '현재 배치 상태를 진단하고 부족한 가구를 우선순위로 추천',
  '추천 사유와 검색어를 함께 제공해 판단 비용 감소',
  'API 키 없이도 검색 URL 기반으로 쇼핑 탐색까지 연결',
], img.aiPick, 'AI Pick: 부족한 가구와 추천 이유를 카드 형태로 제공')
contentSlide(16, '쿠팡 검색 연결', '추천에서 구매 탐색으로 확장', [
  '추천 카드에서 쿠팡 검색 버튼을 누르면 키워드 검색 페이지로 이동',
  '실제 구매 API 대신 검색 URL 연결 방식으로 MVP 구현',
  '향후 파트너스 API 승인 시 상품명, 가격, 이미지 자동 노출 가능',
], img.coupang, '쿠팡 검색 연동: 추천 키워드를 실제 쇼핑 탐색으로 연결')
contentSlide(17, '내 정보 관리', '계정 정보 확인과 수정', [
  '이메일, 연락처, 주소, 가입 방식 정보를 표시',
  '프로필 수정과 주소 검색을 같은 화면에서 처리',
  '위험 행동은 별도 영역으로 분리해 실수 가능성을 줄임',
], img.account, '내 정보 화면: 확인, 수정, 회원탈퇴 영역 분리')
contentSlide(18, '회원탈퇴 플로우', '위험 행동 보호 장치', [
  '탈퇴 버튼 즉시 실행 대신 확인 화면을 거치도록 설계',
  '지정 문구를 입력해야 탈퇴가 진행되는 안전장치 적용',
  '계정 삭제 시 저장 공간도 함께 지워진다는 안내 제공',
], img.withdraw, '회원탈퇴 확인: 실수 방지를 위한 입력 확인 절차')
dataSlide()
techSlide()
troubleSlide()
closingSlide()

await pptx.writeFile({ fileName: outFile })
console.log(outFile)
