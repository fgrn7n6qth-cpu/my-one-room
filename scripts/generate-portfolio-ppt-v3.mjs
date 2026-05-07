import path from 'node:path'
import PptxGenJS from 'pptxgenjs'

const rootDir = process.cwd()
const outFile = path.join(rootDir, 'artifacts', 'MyOneRoom_Portfolio_22slides_v3_minimal.pptx')

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'My One Room'
pptx.subject = 'My One Room Portfolio'
pptx.title = 'My One Room Portfolio Minimal'
pptx.lang = 'ko-KR'
pptx.theme = {
  headFontFace: 'Malgun Gothic',
  bodyFontFace: 'Malgun Gothic',
  lang: 'ko-KR',
}

const C = {
  bg: 'F8FAFC',
  panel: 'FFFFFF',
  ink: '121417',
  muted: '68717D',
  sub: '9AA4AF',
  line: 'DDE5EE',
  blue: '0B7BEA',
  blueSoft: 'EAF4FF',
  cream: 'F6F1EA',
  dark: '20242A',
  green: '20C167',
  yellow: 'FFD900',
  red: 'E8505B',
  grid: 'E9EEF4',
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

function shape(slide, type, x, y, w, h, opt = {}) {
  slide.addShape(type, {
    x, y, w, h,
    rectRadius: opt.radius ?? 0.12,
    fill: { color: opt.fill ?? C.panel, transparency: opt.transparency ?? 0 },
    line: { color: opt.line ?? C.line, pt: opt.pt ?? 0.8, transparency: opt.lineTrans ?? 0 },
    rotate: opt.rotate,
    shadow: opt.shadow === false ? undefined : {
      type: 'outer',
      color: 'C8D2DD',
      opacity: 0.11,
      blur: 2,
      angle: 45,
      distance: 1,
    },
  })
}

function card(slide, x, y, w, h, opt = {}) {
  shape(slide, pptx.ShapeType.roundRect, x, y, w, h, opt)
}

function base(slide, no, title, subtitle = '') {
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.12, fill: { color: C.blue }, line: { transparency: 100 } })
  slide.addShape(pptx.ShapeType.rect, { x: 9.7, y: 0.12, w: 3.633, h: 7.38, fill: { color: 'EEF6FF', transparency: 8 }, line: { transparency: 100 } })
  text(slide, 'MY ONE ROOM', 0.62, 0.34, 2.6, 0.2, { size: 7.2, bold: true, color: C.muted, charSpace: 1.5 })
  text(slide, title, 0.62, 0.72, 8.8, 0.48, { size: 22, bold: true })
  if (subtitle) text(slide, subtitle, 0.64, 1.22, 7.8, 0.22, { size: 8.6, color: C.muted })
  text(slide, String(no).padStart(2, '0'), 11.74, 0.52, 0.8, 0.22, { size: 11, bold: true, color: C.blue, align: 'center' })
  slide.addShape(pptx.ShapeType.line, { x: 0.62, y: 1.55, w: 12.08, h: 0, line: { color: C.line, pt: 0.7 } })
  text(slide, 'Portfolio · Room Planner', 0.62, 7.12, 2.8, 0.18, { size: 6.8, color: C.sub })
}

function pill(slide, value, x, y, w, fill = C.blueSoft, color = C.blue) {
  shape(slide, pptx.ShapeType.roundRect, x, y, w, 0.32, { fill, lineTrans: 100, shadow: false, radius: 0.12 })
  text(slide, value, x, y + 0.08, w, 0.13, { size: 7.2, bold: true, color, align: 'center' })
}

function bullets(slide, items, x, y, w, h) {
  const runs = items.map((item, index) => ({
    text: item,
    options: { bullet: { type: 'ul' }, breakLine: index < items.length - 1 },
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

function browserMock(slide, x, y, w, h, title = 'My One Room') {
  card(slide, x, y, w, h, { fill: C.panel, radius: 0.16 })
  shape(slide, pptx.ShapeType.rect, x, y, w, 0.38, { fill: 'F1F5F9', line: C.line, shadow: false })
  ;['E8505B', 'F5C542', '20C167'].forEach((color, i) => {
    shape(slide, pptx.ShapeType.ellipse, x + 0.18 + i * 0.18, y + 0.13, 0.08, 0.08, { fill: color, lineTrans: 100, shadow: false })
  })
  text(slide, title, x + 0.62, y + 0.12, w - 0.85, 0.12, { size: 6.8, color: C.sub })
}

function authMock(slide, x, y, w, h) {
  browserMock(slide, x, y, w, h, 'Auth')
  text(slide, '마이 원룸에 로그인', x + w * 0.36, y + 0.82, w * 0.34, 0.2, { size: 8.2, bold: true, align: 'center' })
  ;[0, 1].forEach((i) => card(slide, x + w * 0.26, y + 1.32 + i * 0.42, w * 0.48, 0.28, { fill: 'FFFFFF', radius: 0.1, shadow: false, line: '9FA7B2' }))
  card(slide, x + w * 0.26, y + 2.22, w * 0.48, 0.34, { fill: C.blue, line: C.blue, radius: 0.12 })
  text(slide, '로그인', x + w * 0.26, y + 2.33, w * 0.48, 0.1, { size: 6.4, bold: true, color: 'FFFFFF', align: 'center' })
  card(slide, x + w * 0.25, y + 3.12, w * 0.5, 0.32, { fill: 'FFFFFF', radius: 0.14, shadow: false })
  card(slide, x + w * 0.25, y + 3.56, w * 0.5, 0.32, { fill: 'FFFFFF', radius: 0.14, shadow: false })
  shape(slide, pptx.ShapeType.ellipse, x + w * 0.29, y + 3.18, 0.18, 0.18, { fill: C.yellow, lineTrans: 100, shadow: false })
  shape(slide, pptx.ShapeType.ellipse, x + w * 0.29, y + 3.62, 0.18, 0.18, { fill: C.green, lineTrans: 100, shadow: false })
}

function planMock(slide, x, y, w, h, mode = '2d') {
  browserMock(slide, x, y, w, h, mode === '3d' ? '3D Editor' : '2D Editor')
  card(slide, x + 0.22, y + 0.58, w * 0.18, h - 0.82, { fill: C.dark, line: '343A40', radius: 0.14 })
  card(slide, x + w * 0.74, y + 0.58, w * 0.22, h - 0.82, { fill: mode === '3d' ? 'FFFFFF' : 'FAFCFF', radius: 0.14 })
  card(slide, x + w * 0.24, y + 0.58, w * 0.46, h - 0.82, { fill: mode === '3d' ? 'DFEAF4' : '07182C', radius: 0.14 })
  if (mode === '2d') {
    for (let i = 0; i < 11; i++) {
      slide.addShape(pptx.ShapeType.line, { x: x + w * 0.27 + i * (w * 0.04), y: y + 0.8, w: 0, h: h - 1.25, line: { color: '18314F', pt: 0.45 } })
      slide.addShape(pptx.ShapeType.line, { x: x + w * 0.27, y: y + 0.8 + i * ((h - 1.25) / 10), w: w * 0.4, h: 0, line: { color: '18314F', pt: 0.45 } })
    }
    card(slide, x + w * 0.38, y + 1.62, w * 0.16, 0.46, { fill: 'DDD2BF', radius: 0.11, shadow: false })
    card(slide, x + w * 0.44, y + 2.9, w * 0.11, 0.34, { fill: 'F2EEE7', radius: 0.11, shadow: false })
  } else {
    shape(slide, pptx.ShapeType.rect, x + w * 0.28, y + 1.02, w * 0.36, 1.05, { fill: 'B8B2A8', lineTrans: 100, shadow: false })
    shape(slide, pptx.ShapeType.rect, x + w * 0.28, y + 2.02, w * 0.36, h * 0.34, { fill: '2D2C2A', lineTrans: 100, shadow: false })
    card(slide, x + w * 0.36, y + 2.36, w * 0.1, 0.38, { fill: 'E6E3DD', radius: 0.06, shadow: false })
    card(slide, x + w * 0.5, y + 2.2, w * 0.12, 0.34, { fill: '111111', radius: 0.05, shadow: false })
  }
}

function aiMock(slide, x, y, w, h) {
  browserMock(slide, x, y, w, h, 'AI Pick')
  text(slide, 'AI PICK', x + 0.34, y + 0.72, 1.2, 0.18, { size: 7.5, bold: true, color: C.muted, charSpace: 1 })
  card(slide, x + 0.34, y + 1.18, w - 0.68, 0.76, { fill: 'F8FAFD', radius: 0.12, shadow: false })
  pill(slide, '보완 추천', x + 0.52, y + 1.38, 0.86, C.blue, 'FFFFFF')
  ;['슬림 수납 선반', '이동식 트롤리', '무드 조명'].forEach((name, i) => {
    card(slide, x + 0.34, y + 2.2 + i * 0.9, w - 0.68, 0.68, { fill: 'FFFFFF', radius: 0.12, shadow: false })
    text(slide, name, x + 0.58, y + 2.38 + i * 0.9, 1.8, 0.16, { size: 8.3, bold: true })
    card(slide, x + w - 1.74, y + 2.38 + i * 0.9, 0.56, 0.22, { fill: 'FFFFFF', radius: 0.08, shadow: false })
    card(slide, x + w - 1.08, y + 2.38 + i * 0.9, 0.56, 0.22, { fill: 'FFFFFF', radius: 0.08, shadow: false })
  })
}

function diagramMock(slide, x, y, w, h, labels) {
  const gap = w / labels.length
  labels.forEach((label, i) => {
    const cx = x + i * gap + gap * 0.5
    shape(slide, pptx.ShapeType.ellipse, cx - 0.34, y + 0.56, 0.68, 0.68, { fill: i === 2 ? C.blue : C.panel, line: i === 2 ? C.blue : C.line, shadow: true })
    text(slide, String(i + 1), cx - 0.34, y + 0.78, 0.68, 0.16, { size: 9, bold: true, color: i === 2 ? 'FFFFFF' : C.blue, align: 'center' })
    text(slide, label, cx - gap * 0.38, y + 1.46, gap * 0.76, 0.32, { size: 9.4, bold: true, align: 'center' })
    if (i < labels.length - 1) slide.addShape(pptx.ShapeType.line, { x: cx + 0.45, y: y + 0.9, w: gap - 0.9, h: 0, line: { color: C.line, pt: 1.2, beginArrowType: 'none', endArrowType: 'triangle' } })
  })
}

function content(no, title, headline, items, visual) {
  const slide = pptx.addSlide()
  base(slide, no, title)
  card(slide, 0.78, 1.88, 4.45, 4.5)
  text(slide, headline, 1.08, 2.16, 3.72, 0.42, { size: 16.2, bold: true })
  bullets(slide, items, 1.1, 2.86, 3.62, 2.52)
  visual(slide, 5.72, 1.88, 6.32, 4.5)
}

function titleSlide() {
  const slide = pptx.addSlide()
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.14, fill: { color: C.blue }, line: { transparency: 100 } })
  text(slide, 'MY ONE ROOM', 0.86, 1.08, 2.5, 0.22, { size: 8, bold: true, color: C.blue, charSpace: 1.6 })
  text(slide, '원룸 인테리어\n플래너 서비스', 0.86, 1.56, 5.0, 1.38, { size: 31, bold: true })
  text(slide, '2D 배치, 3D 둘러보기, AI 가구 추천을 하나의 흐름으로 연결한 개인 맞춤 원룸 꾸미기 웹 서비스', 0.88, 3.34, 4.9, 0.52, { size: 12.4, color: C.muted })
  pill(slide, 'React', 0.88, 4.38, 0.8)
  pill(slide, 'Spring Boot', 1.82, 4.38, 1.22)
  pill(slide, 'Three.js', 3.18, 4.38, 1.0)
  pill(slide, 'AI Pick', 4.32, 4.38, 0.92, C.cream, C.dark)
  card(slide, 6.56, 0.88, 5.86, 5.0, { fill: 'FFFFFF', radius: 0.24 })
  planMock(slide, 6.86, 1.22, 5.26, 4.26, '3d')
  ;[['22', 'slides'], ['2D/3D', 'editor'], ['AI', 'recommend']].forEach(([a, b], i) => {
    card(slide, 0.9 + i * 1.54, 5.78, 1.26, 0.62, { fill: 'FFFFFF', shadow: false })
    text(slide, a, 0.9 + i * 1.54, 5.91, 1.26, 0.18, { size: 12.2, bold: true, color: C.blue, align: 'center' })
    text(slide, b, 0.9 + i * 1.54, 6.16, 1.26, 0.12, { size: 6.5, color: C.sub, align: 'center' })
  })
}

titleSlide()
content(2, '프로젝트 개요', '서비스 한 줄 정의', [
  '작은 원룸에서도 가구 배치와 동선을 빠르게 검토하는 웹 기반 플래너',
  '프로젝트 저장, 2D 편집, 3D 확인을 한 흐름으로 제공',
  'AI Pick과 쇼핑 검색 연결로 구매 탐색까지 확장',
], (s, x, y, w, h) => { planMock(s, x, y, w, h, '3d') })
content(3, '문제 정의', '사용자가 겪는 불편', [
  '좁은 원룸은 가구 하나만 잘못 배치해도 동선이 크게 무너짐',
  '구매 전 크기감과 배치감을 판단하기 어려움',
  '배치, 추천, 쇼핑 검색이 분리되어 반복 탐색 비용이 큼',
], (s, x, y, w, h) => {
  card(s, x, y, w, h)
  ;['공간 부족', '동선 막힘', '구매 불안'].forEach((v, i) => {
    shape(s, pptx.ShapeType.ellipse, x + 0.8 + i * 1.65, y + 1.2, 1.0, 1.0, { fill: i === 1 ? C.blue : C.blueSoft, line: i === 1 ? C.blue : C.blueSoft })
    text(s, v, x + 0.56 + i * 1.65, y + 2.46, 1.48, 0.24, { size: 11, bold: true, align: 'center' })
  })
})
content(4, '해결 방향', '하나의 흐름으로 연결', [
  '원룸 선택에서 가구 배치까지 진입 단계를 줄임',
  '2D와 3D가 같은 데이터를 공유해 확인 비용 감소',
  '추천과 검색 연결로 다음 행동을 바로 제안',
], (s, x, y, w, h) => { card(s, x, y, w, h); diagramMock(s, x + 0.2, y + 1.0, w - 0.4, h - 1.8, ['선택', '배치', '확인', '추천']) })
content(5, '사용자 플로우', '가입부터 구매 탐색까지', [
  '회원가입/로그인 후 기본 정보를 저장',
  '원룸 프로젝트를 만들고 2D/3D로 배치',
  'AI 추천과 쿠팡 검색으로 구매 후보 탐색',
], (s, x, y, w, h) => { card(s, x, y, w, h); diagramMock(s, x + 0.1, y + 0.9, w - 0.2, h - 1.6, ['로그인', '정보 저장', '프로젝트', '편집', '검색']) })
content(6, '인증 화면', '미니멀한 진입 경험', [
  '로그인, 회원가입, 비밀번호 재설정을 같은 톤으로 구성',
  '카카오/네이버 소셜 진입을 하단 CTA로 제공',
  '불필요한 장식을 줄여 입력 폼에 집중',
], (s, x, y, w, h) => { authMock(s, x + 0.3, y, w - 0.6, h) })
content(7, '온보딩과 정보 저장', '서비스 이용 전 필수 정보 보완', [
  '이름, 전화번호, 주소를 한 번에 등록',
  '주소 검색 팝업으로 실제 서비스형 입력 흐름 구현',
  '저장 정보는 마이페이지와 프로젝트 관리에서 재사용',
], (s, x, y, w, h) => {
  browserMock(s, x, y, w, h, 'Profile Setup')
  ;['이름', '전화번호', '주소'].forEach((v, i) => {
    text(s, v, x + 0.7, y + 1.0 + i * 0.68, 1.2, 0.16, { size: 8.2, color: C.muted })
    card(s, x + 0.7, y + 1.22 + i * 0.68, w - 1.4, 0.34, { shadow: false })
  })
  card(s, x + 0.7, y + 3.55, 1.1, 0.34, { fill: C.blue, line: C.blue, shadow: false })
  text(s, '등록 완료', x + 0.7, y + 3.66, 1.1, 0.1, { size: 6.4, bold: true, color: 'FFFFFF', align: 'center' })
})
content(8, '홈 화면', '프로젝트 진입을 단순화', [
  '새 원룸 시작과 최근 원룸 이어하기를 중심 CTA로 배치',
  '상단 탭으로 홈, 프로젝트, 내 정보 이동',
  '큰 여백과 정돈된 카드로 서비스 톤 통일',
], (s, x, y, w, h) => {
  browserMock(s, x, y, w, h, 'Home')
  text(s, '내 원룸을 다시 꺼내,\n차분하게 완성하세요.', x + 0.7, y + 1.26, w - 1.4, 0.72, { size: 18, bold: true })
  pill(s, '새 원룸 시작하기', x + 1.62, y + 2.58, 1.34, C.blue, 'FFFFFF')
  pill(s, '최근 원룸 이어하기', x + 3.12, y + 2.58, 1.42, 'FFFFFF', C.dark)
})
content(9, '프로젝트 관리', '저장된 원룸을 다시 이어가기', [
  '최근 꾸민 원룸과 선택된 원룸 상세를 한 화면에 표시',
  '원룸 이름, 타입, 평수, 소개를 수정하고 저장',
  '선택 후 바로 편집 화면으로 이어지는 구조',
], (s, x, y, w, h) => {
  browserMock(s, x, y, w, h, 'Projects')
  ;[0, 1].forEach((i) => card(s, x + 0.5 + i * 2.7, y + 0.9, 2.18, 1.22, { fill: 'FAFCFF', shadow: false }))
  card(s, x + 0.5, y + 2.6, 2.2, 1.26, { fill: C.blueSoft, shadow: false })
  ;[0, 1, 2].forEach((i) => card(s, x + 3.15, y + 2.6 + i * 0.42, 2.36, 0.28, { shadow: false }))
})
content(10, '에디터 전체 구조', '3분할 작업 환경', [
  '왼쪽은 가구 카탈로그와 빠른 배치 버튼',
  '중앙은 2D/3D 캔버스와 저장, 완료, 모드 전환',
  '오른쪽은 상태 요약과 AI Pick 추천 패널',
], (s, x, y, w, h) => { planMock(s, x, y, w, h, '2d') })
content(11, '2D 배치 모드', '배치 전 상태도 안내', [
  '가구가 없을 때 다음 행동을 안내하는 메시지 제공',
  '방 크기와 창문, 문 정보를 기준으로 배치 영역 구성',
  '선택, 정렬, 삭제, AI 추천으로 편집 흐름 보조',
], (s, x, y, w, h) => { planMock(s, x, y, w, h, '2d') })
content(12, '가구 배치 기능', '선택과 조작 중심 편집', [
  '카탈로그에서 가구를 선택하고 캔버스에 추가',
  '선택된 가구는 외곽선과 핸들로 조작 대상 표시',
  '정렬, 선택 삭제, 전체 삭제 기능 제공',
], (s, x, y, w, h) => { planMock(s, x, y, w, h, '2d') })
content(13, '3D 시각화', '배치를 공간감으로 확인', [
  '2D 배치를 3D 방 구조로 변환',
  '벽, 바닥, 창문, 조명, 가구 모델을 조합',
  '가구 높이와 바닥 접지를 조정해 공중 부양 개선',
], (s, x, y, w, h) => { planMock(s, x, y, w, h, '3d') })
content(14, '뷰어 모드', '사용자 시점 둘러보기', [
  '편집용 카메라와 사용자 시점 카메라를 분리',
  'WASD/방향키와 화면 드래그로 이동 및 시선 조작',
  '배치 결과를 실제 방 안에 들어간 느낌으로 확인',
], (s, x, y, w, h) => { planMock(s, x, y, w, h, '3d') })
content(15, 'AI Pick 추천', '현재 방 상태 기반 제안', [
  '현재 배치 상태를 진단하고 부족한 가구를 추천',
  '추천 사유와 검색어를 함께 제공',
  'API 키 없이 검색 URL 기반으로 쇼핑 탐색 연결',
], (s, x, y, w, h) => { aiMock(s, x + 0.58, y, w - 1.16, h) })
content(16, '쿠팡 검색 연결', '추천에서 구매 탐색으로', [
  '추천 카드에서 쿠팡 검색 버튼으로 키워드 검색 페이지 이동',
  '파트너스 API 없이 검색 URL 연결 방식으로 MVP 구현',
  '향후 상품명, 가격, 이미지 자동 노출로 확장 가능',
], (s, x, y, w, h) => {
  browserMock(s, x, y, w, h, 'Shopping Search')
  card(s, x + 0.65, y + 0.95, w - 1.3, 0.46, { shadow: false })
  text(s, '10평 무드등 테이블 램프 원룸 침대 협탁', x + 0.88, y + 1.1, w - 1.76, 0.12, { size: 7.4, color: C.muted })
  ;[0, 1, 2].forEach((i) => {
    card(s, x + 0.7 + i * 1.62, y + 2.0, 1.22, 1.36, { fill: 'FFFFFF', shadow: false })
    shape(s, pptx.ShapeType.rect, x + 0.82 + i * 1.62, y + 2.18, 0.98, 0.52, { fill: i === 0 ? C.cream : C.blueSoft, lineTrans: 100, shadow: false })
    text(s, `${i + 1}`, x + 0.76 + i * 1.62, y + 1.9, 0.22, 0.14, { size: 8, bold: true, color: C.red })
  })
})
content(17, '내 정보 관리', '계정 정보 확인과 수정', [
  '이메일, 연락처, 주소, 가입 방식 정보를 표시',
  '프로필 수정과 주소 검색을 같은 화면에서 처리',
  '위험 행동은 별도 영역으로 분리',
], (s, x, y, w, h) => {
  browserMock(s, x, y, w, h, 'My Account')
  ;[0, 1, 2].forEach((i) => card(s, x + 0.52 + i * 1.78, y + 0.86, 1.42, 0.52, { fill: C.cream, shadow: false }))
  card(s, x + 0.52, y + 1.78, 2.28, 2.32, { shadow: false })
  card(s, x + 3.02, y + 1.78, 2.28, 2.32, { shadow: false })
})
content(18, '회원탈퇴 플로우', '위험 행동 보호 장치', [
  '탈퇴 버튼 즉시 실행 대신 확인 화면을 거침',
  '지정 문구 입력 후 탈퇴가 진행되는 안전장치 적용',
  '계정 삭제 시 저장 공간도 지워진다는 안내 제공',
], (s, x, y, w, h) => {
  browserMock(s, x + 0.8, y + 0.42, w - 1.6, h - 0.84, 'Danger Zone')
  text(s, '정말 계정을 삭제할까요?', x + 1.18, y + 1.28, w - 2.36, 0.32, { size: 16, bold: true })
  card(s, x + 1.18, y + 2.2, w - 2.36, 0.42, { shadow: false })
  pill(s, '취소', x + 1.2, y + 3.08, 0.72, 'FFFFFF', C.dark)
  pill(s, '회원탈퇴 진행', x + 2.08, y + 3.08, 1.18, C.red, 'FFFFFF')
})
content(19, '데이터 흐름', '하나의 배치 데이터를 공유', [
  '사용자 입력은 React 상태로 즉시 반영',
  '2D와 3D는 같은 가구 데이터를 공유',
  '계정 정보와 프로젝트 정보를 분리해 관리',
], (s, x, y, w, h) => { card(s, x, y, w, h); diagramMock(s, x + 0.1, y + 0.92, w - 0.2, h - 1.6, ['사용자', 'React', '상태', 'API', '저장']) })
content(20, '구현 포인트', '기술별 역할 분리', [
  'React/Vite로 화면과 인터랙션 구성',
  'React Three Fiber로 3D 방과 가구 렌더링',
  'Spring Boot로 회원, 인증, 프로젝트 API 처리',
], (s, x, y, w, h) => {
  card(s, x, y, w, h)
  ;[['Frontend', 'React'], ['3D', 'Three.js'], ['Backend', 'Spring Boot'], ['UX', 'Minimal UI']].forEach(([a, b], i) => {
    const px = x + 0.55 + (i % 2) * 2.62
    const py = y + 0.88 + Math.floor(i / 2) * 1.42
    card(s, px, py, 2.22, 0.9, { fill: i === 1 ? C.blueSoft : 'FFFFFF', shadow: false })
    text(s, a, px + 0.2, py + 0.18, 0.92, 0.18, { size: 9.4, bold: true, color: C.blue })
    text(s, b, px + 0.2, py + 0.5, 1.7, 0.18, { size: 8.4, color: C.muted })
  })
})
content(21, '트러블슈팅', '체감 문제 중심 개선', [
  '가구 공중 부양: 타입별 높이와 지지면 계산 개선',
  '뷰어 모드 미동작: 투어 카메라 등록 구조 수정',
  '화면 톤 불일치: 로그인 화면의 미니멀 톤을 전체로 확장',
], (s, x, y, w, h) => {
  card(s, x, y, w, h)
  ;['가구 접지', '카메라 연결', 'UI 통일'].forEach((v, i) => {
    card(s, x + 0.72, y + 0.9 + i * 0.92, w - 1.44, 0.54, { fill: i === 1 ? C.blueSoft : 'FFFFFF', shadow: false })
    text(s, v, x + 1.0, y + 1.08 + i * 0.92, w - 2, 0.14, { size: 10.2, bold: true })
  })
})
const last = pptx.addSlide()
last.background = { color: C.bg }
last.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.14, fill: { color: C.blue }, line: { transparency: 100 } })
text(last, '결과와 회고', 0.86, 0.8, 4.2, 0.42, { size: 24, bold: true })
text(last, '단순한 CRUD를 넘어 사용자가 직접 방을 꾸미고, 3D로 확인하고, 추천까지 받을 수 있는 인터랙티브 서비스로 확장했습니다.', 0.88, 1.58, 5.58, 0.62, { size: 12.4, color: C.muted })
;[
  ['완성도', '로그인부터 프로젝트 저장, 2D/3D 편집까지 한 흐름 완성'],
  ['확장성', 'AI 추천과 쇼핑 검색으로 서비스 경험 확장'],
  ['개선점', '상품 API, 정교한 3D 모델, 반응형 고도화 예정'],
].forEach(([a, b], i) => {
  card(last, 0.9, 2.82 + i * 1.08, 5.25, 0.72, { fill: i === 1 ? C.blueSoft : 'FFFFFF' })
  text(last, a, 1.18, 3.03 + i * 1.08, 1.0, 0.18, { size: 10.2, bold: true, color: C.blue })
  text(last, b, 2.28, 3.03 + i * 1.08, 3.48, 0.18, { size: 8.4, color: C.muted })
})
card(last, 7.0, 1.16, 4.8, 4.55)
planMock(last, 7.32, 1.48, 4.16, 3.9, '3d')
text(last, 'Thank you', 8.78, 6.22, 1.8, 0.3, { size: 18, bold: true, color: C.blue, align: 'center' })

await pptx.writeFile({ fileName: outFile })
console.log(outFile)
