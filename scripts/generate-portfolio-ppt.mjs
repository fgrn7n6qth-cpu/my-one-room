import fs from 'node:fs'
import path from 'node:path'
import PptxGenJS from 'pptxgenjs'

const rootDir = process.cwd()
const outDir = path.join(rootDir, 'artifacts')
const outFile = path.join(outDir, 'MyOneRoom_Portfolio_22slides_v2.pptx')
const desktopDir = 'C:\\Users\\TJ-BU-702-P12\\Desktop'

fs.mkdirSync(outDir, { recursive: true })

const img = {
  main: path.join(desktopDir, '메인화면.PNG'),
  login: path.join(desktopDir, '로그인화면.PNG'),
  signup: path.join(desktopDir, '회원가입.PNG'),
  signupDone: path.join(desktopDir, '회원가입 완료.PNG'),
  reset: path.join(desktopDir, '비밀번호 재설정.PNG'),
  saveInfo: path.join(desktopDir, '정보저장.PNG'),
  project1: path.join(desktopDir, '프로젝트1.PNG'),
  project2: path.join(desktopDir, '프로젝트2.PNG'),
  account: path.join(desktopDir, '내정보.PNG'),
  withdraw: path.join(desktopDir, '탈퇴.PNG'),
  editorEmpty: path.join(desktopDir, '2d프로젝트.PNG'),
  placement: path.join(desktopDir, '가구배치.PNG'),
  aiPick: path.join(desktopDir, 'ai픽.PNG'),
  complete: path.join(desktopDir, '프로젝트 완성.PNG'),
  viewer: path.join(desktopDir, '뷰어모드.PNG'),
  coupang: path.join(desktopDir, '쿠팡.PNG'),
}

for (const [name, file] of Object.entries(img)) {
  if (!fs.existsSync(file)) {
    throw new Error(`Missing screenshot "${name}": ${file}`)
  }
}

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'My One Room'
pptx.company = 'Portfolio'
pptx.subject = '원룸 인테리어 플래너 포트폴리오'
pptx.title = 'My One Room Portfolio'
pptx.lang = 'ko-KR'
pptx.theme = {
  headFontFace: 'Malgun Gothic',
  bodyFontFace: 'Malgun Gothic',
  lang: 'ko-KR',
}
pptx.defineLayout({ name: 'CUSTOM_WIDE', width: 13.333, height: 7.5 })
pptx.layout = 'CUSTOM_WIDE'
pptx.author = 'My One Room'

const C = {
  bg: 'F4F7FA',
  ink: '14171A',
  muted: '6E7781',
  sub: '8B949E',
  blue: '0B7BEA',
  blue2: 'D9ECFF',
  navy: '07182C',
  line: 'DDE3EA',
  card: 'FFFFFF',
  warm: 'F7F2EA',
  dark: '1E1B18',
  red: 'EB5967',
}

function pngSize(file) {
  const buffer = fs.readFileSync(file)
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  }
}

function addBg(slide) {
  slide.background = { color: 'F7F9FC' }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 7.5,
    fill: { color: 'F7F9FC' },
    line: { transparency: 100 },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 9.55, y: 0, w: 3.783, h: 7.5,
    fill: { color: 'EEF5FC', transparency: 10 },
    line: { transparency: 100 },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.12,
    fill: { color: C.blue },
    line: { transparency: 100 },
  })
}

function addHeader(slide, no, title, eyebrow = 'MY ONE ROOM') {
  addBg(slide)
  slide.addText(eyebrow, {
    x: 0.62, y: 0.32, w: 3.3, h: 0.28,
    fontSize: 7.4, bold: true, charSpace: 1.6, color: C.muted,
    margin: 0,
  })
  slide.addText(title, {
    x: 0.62, y: 0.68, w: 8.9, h: 0.54,
    fontSize: 22, bold: true, color: C.ink, margin: 0,
  })
  slide.addText(String(no).padStart(2, '0'), {
    x: 11.8, y: 0.5, w: 0.92, h: 0.38,
    fontSize: 12, bold: true, align: 'center', color: C.blue,
    margin: 0,
  })
  slide.addShape(pptx.ShapeType.line, {
    x: 0.62, y: 1.42, w: 12.1, h: 0,
    line: { color: C.line, pt: 0.8 },
  })
}

function addFooter(slide) {
  slide.addShape(pptx.ShapeType.line, {
    x: 0.62, y: 7.03, w: 12.1, h: 0,
    line: { color: 'E7ECF2', pt: 0.6 },
  })
  slide.addText('My One Room Portfolio', {
    x: 0.62, y: 7.12, w: 2.5, h: 0.18,
    fontSize: 6.8, color: 'A0A8B2', margin: 0,
  })
}

function addText(slide, text, x, y, w, h, opt = {}) {
  slide.addText(text, {
    x, y, w, h,
    fontFace: 'Malgun Gothic',
    fontSize: opt.size ?? 12,
    bold: opt.bold ?? false,
    color: opt.color ?? C.ink,
    breakLine: opt.breakLine ?? false,
    fit: opt.fit ?? 'shrink',
    valign: opt.valign ?? 'top',
    margin: opt.margin ?? 0,
    align: opt.align ?? 'left',
    paraSpaceAfterPt: opt.paraSpaceAfterPt ?? 0,
    bullet: opt.bullet,
  })
}

function addPill(slide, text, x, y, w, color = C.blue, fill = C.blue2) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.38,
    rectRadius: 0.13,
    fill: { color: fill },
    line: { color: fill, transparency: 100 },
  })
  addText(slide, text, x, y + 0.1, w, 0.16, { size: 7.6, bold: true, color, align: 'center' })
}

function addCard(slide, x, y, w, h, opt = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: opt.radius ?? 0.16,
    fill: { color: opt.fill ?? C.card, transparency: opt.transparency ?? 0 },
    line: { color: opt.line ?? C.line, pt: opt.pt ?? 0.8 },
    shadow: opt.shadow === false ? undefined : {
      type: 'outer',
      color: 'CFD8E3',
      opacity: 0.13,
      blur: 2,
      angle: 45,
      distance: 1,
    },
  })
}

function addImageFit(slide, file, x, y, w, h, opt = {}) {
  const size = pngSize(file)
  const scale = Math.min(w / size.width, h / size.height)
  const iw = size.width * scale
  const ih = size.height * scale
  const ix = x + (w - iw) / 2
  const iy = y + (h - ih) / 2
  if (opt.card !== false) addCard(slide, x, y, w, h, { fill: opt.fill ?? C.card, radius: opt.radius ?? 0.18 })
  slide.addImage({ path: file, x: ix, y: iy, w: iw, h: ih })
}

function addImageCover(slide, file, x, y, w, h) {
  const size = pngSize(file)
  const scale = Math.max(w / size.width, h / size.height)
  const iw = size.width * scale
  const ih = size.height * scale
  const ix = x + (w - iw) / 2
  const iy = y + (h - ih) / 2
  slide.addImage({ path: file, x: ix, y: iy, w: iw, h: ih })
}

function addBullets(slide, items, x, y, w, h, opt = {}) {
  const runs = []
  items.forEach((item, index) => {
    runs.push({
      text: item,
      options: {
        bullet: { type: 'ul' },
        breakLine: index < items.length - 1,
        hanging: 3,
      },
    })
  })
  slide.addText(runs, {
    x, y, w, h,
    fontFace: 'Malgun Gothic',
    fontSize: opt.size ?? 11.4,
    color: opt.color ?? C.ink,
    fit: 'shrink',
    margin: 0,
    breakLine: false,
    paraSpaceAfterPt: 8,
  })
}

function metric(slide, value, label, x, y, w = 1.48) {
  addCard(slide, x, y, w, 0.74, { fill: 'FAFCFF', radius: 0.18, shadow: false })
  addText(slide, value, x, y + 0.14, w, 0.26, { size: 14, bold: true, color: C.blue, align: 'center' })
  addText(slide, label, x, y + 0.46, w, 0.16, { size: 7.2, color: C.muted, align: 'center' })
}

function titleSlide() {
  const slide = pptx.addSlide()
  addBg(slide)
  addCard(slide, 6.58, 0.86, 5.9, 4.82, { fill: C.card, radius: 0.22 })
  addImageFit(slide, img.viewer, 6.82, 1.1, 5.42, 4.34, { card: false })
  addText(slide, 'MY ONE ROOM', 0.78, 1.08, 2.3, 0.22, { size: 8, bold: true, charSpace: 1.6, color: C.blue })
  addText(slide, '원룸 인테리어\n플래너 서비스', 0.78, 1.52, 5.25, 1.45, { size: 32, bold: true, color: C.ink })
  addText(slide, '2D 배치부터 3D 둘러보기, AI 가구 추천과 쇼핑 검색까지 연결한 개인 맞춤 원룸 꾸미기 웹 서비스입니다.', 0.82, 3.3, 4.84, 0.62, { size: 13, color: C.muted })
  addPill(slide, 'React', 0.82, 4.42, 0.88)
  addPill(slide, 'Spring Boot', 1.86, 4.42, 1.28)
  addPill(slide, 'Three.js', 3.3, 4.42, 1.04)
  addPill(slide, 'Portfolio', 4.5, 4.42, 1.08, C.dark, 'F2EDE5')
  metric(slide, '22', 'slides', 0.82, 5.72)
  metric(slide, '2D/3D', 'editor', 2.48, 5.72)
  metric(slide, 'AI Pick', 'recommend', 4.14, 5.72)
  addFooter(slide)
}

function twoColumnSlide(no, title, leftTitle, bullets, imageFile, imageCaption) {
  const slide = pptx.addSlide()
  addHeader(slide, no, title)
  addCard(slide, 0.74, 1.82, 4.45, 4.65, { fill: C.card })
  addText(slide, leftTitle, 1.04, 2.1, 3.75, 0.42, { size: 17, bold: true })
  addBullets(slide, bullets, 1.05, 2.82, 3.72, 2.95)
  addImageFit(slide, imageFile, 5.6, 1.82, 6.95, 4.65)
  addText(slide, imageCaption, 5.82, 6.62, 6.35, 0.24, { size: 8.5, color: C.muted, align: 'center' })
  addFooter(slide)
}

function createSlides() {
  titleSlide()

  twoColumnSlide(2, '프로젝트 개요', '서비스 한 줄 정의', [
    '작은 원룸에서도 가구 배치와 동선을 빠르게 검토할 수 있는 웹 기반 플래너',
    '초기 원룸 선택, 프로젝트 저장, 2D 편집, 3D 확인을 한 흐름으로 제공',
    'AI Pick과 쿠팡 검색 연결로 배치 이후 구매 탐색까지 확장',
  ], img.main, '메인 화면: 프로젝트 진입과 이어하기 중심의 단순한 홈 구조')

  twoColumnSlide(3, '문제 정의', '사용자가 겪는 불편', [
    '원룸은 면적이 좁아 가구 하나만 잘못 배치해도 동선과 수납 효율이 크게 떨어짐',
    '구매 전 실제 방 안에서의 크기감과 배치감을 판단하기 어려움',
    '가구 추천, 배치, 쇼핑 검색이 각각 분리되어 반복 탐색 비용이 큼',
  ], img.project1, '사용자의 원룸 프로젝트를 저장하고 다시 이어갈 수 있도록 설계')

  const slide4 = pptx.addSlide()
  addHeader(slide4, 4, '해결 방향')
  addText(slide4, '“배치 → 확인 → 추천 → 구매 탐색”을 한 서비스 안에서 이어지게 만들었습니다.', 0.78, 1.82, 8.8, 0.46, { size: 18, bold: true })
  const steps = [
    ['01', '원룸 선택', '평수와 기본 방 구조를 선택해 프로젝트를 시작합니다.'],
    ['02', '2D 배치', '가구를 선택하고 위치, 정렬, 삭제를 빠르게 조정합니다.'],
    ['03', '3D 확인', '실제 방처럼 배치감을 확인하고 둘러보기 모드로 체감합니다.'],
    ['04', 'AI 추천', '현재 방 상태를 분석해 필요한 가구와 쇼핑 검색어를 제안합니다.'],
  ]
  steps.forEach(([num, head, body], i) => {
    const x = 0.78 + i * 3.05
    addCard(slide4, x, 2.68, 2.65, 2.38, { fill: i % 2 ? 'FFFFFF' : 'F8FBFF' })
    addText(slide4, num, x + 0.24, 2.95, 0.54, 0.3, { size: 12, bold: true, color: C.blue })
    addText(slide4, head, x + 0.24, 3.38, 1.9, 0.28, { size: 15, bold: true })
    addText(slide4, body, x + 0.24, 3.9, 2.08, 0.58, { size: 9.6, color: C.muted })
  })
  addImageFit(slide4, img.complete, 1.24, 5.44, 10.86, 1.05, { card: false })
  addFooter(slide4)

  const slide5 = pptx.addSlide()
  addHeader(slide5, 5, '사용자 플로우')
  const flow = [
    ['회원가입/로그인', '이메일 인증과 소셜 로그인으로 진입'],
    ['기본 정보 저장', '이름, 연락처, 주소 등 계정 정보 보관'],
    ['원룸 프로젝트 생성', '평수 기반 템플릿에서 시작'],
    ['가구 배치/저장', '2D와 3D를 오가며 배치 완성'],
    ['추천/검색', 'AI Pick과 쿠팡 검색으로 구매 탐색'],
  ]
  flow.forEach(([head, body], i) => {
    const x = 0.72 + i * 2.52
    addCard(slide5, x, 2.18, 2.05, 2.78, { fill: i === 3 ? 'F5FAFF' : C.card })
    addText(slide5, String(i + 1), x + 0.2, 2.44, 0.28, 0.24, { size: 10, bold: true, color: C.blue })
    addText(slide5, head, x + 0.2, 2.88, 1.58, 0.42, { size: 12.8, bold: true })
    addText(slide5, body, x + 0.2, 3.58, 1.62, 0.58, { size: 8.8, color: C.muted })
    if (i < flow.length - 1) {
      addText(slide5, '→', x + 2.15, 3.18, 0.28, 0.24, { size: 16, bold: true, color: C.blue })
    }
  })
  addImageFit(slide5, img.signupDone, 0.98, 5.48, 5.35, 1.1, { card: false })
  addImageFit(slide5, img.main, 7.02, 5.34, 5.18, 1.28, { card: false })
  addFooter(slide5)

  const slide6 = pptx.addSlide()
  addHeader(slide6, 6, '인증 화면')
  addImageFit(slide6, img.login, 0.74, 1.84, 3.84, 4.34)
  addImageFit(slide6, img.signup, 4.75, 1.84, 3.84, 4.34)
  addImageFit(slide6, img.reset, 8.76, 1.84, 3.84, 4.34)
  addText(slide6, '로그인, 회원가입, 비밀번호 재설정을 동일한 미니멀 레이아웃으로 구성해 진입 흐름의 일관성을 확보했습니다.', 0.84, 6.42, 11.65, 0.36, { size: 10.5, color: C.muted, align: 'center' })
  addFooter(slide6)

  twoColumnSlide(7, '온보딩과 정보 저장', '계정 정보를 한 번에 정리', [
    '소셜 로그인 후 부족한 기본 정보를 별도 모달에서 보완',
    '주소 검색 팝업을 사용해 실제 서비스형 입력 흐름을 구현',
    '저장 이후 마이페이지와 프로젝트 관리 화면에서 계정 정보를 재사용',
  ], img.saveInfo, '최초 로그인/재로그인 시 기본 정보 저장 플로우')

  twoColumnSlide(8, '홈 화면', '프로젝트 진입을 단순화', [
    '가장 중요한 행동인 새 원룸 시작과 최근 원룸 이어하기를 중앙에 배치',
    '상단 탭으로 홈, 프로젝트, 내 정보를 빠르게 이동',
    '전체 화면은 로그인 화면과 같은 여백과 톤으로 통일',
  ], img.main, '홈: 큰 여백과 명확한 CTA 중심의 랜딩 화면')

  twoColumnSlide(9, '프로젝트 관리', '저장된 원룸을 다시 이어가기', [
    '최근 꾸민 원룸과 선택된 원룸 상세를 같은 화면에서 확인',
    '원룸 이름, 타입, 평수, 소개를 수정하고 저장 가능',
    '프로젝트를 선택하면 바로 편집 화면으로 이어지는 구조',
  ], img.project2, '프로젝트 탭: 카드 목록과 상세 편집 영역')

  twoColumnSlide(10, '에디터 전체 구조', '3분할 작업 환경', [
    '왼쪽: 가구 카탈로그와 빠른 배치 버튼',
    '중앙: 2D/3D 캔버스와 저장, 완료, 모드 전환',
    '오른쪽: 상태 요약, 정렬/삭제, AI Pick 추천 패널',
  ], img.placement, '가구 배치 화면: 카탈로그, 캔버스, 컨트롤 패널을 한눈에 배치')

  twoColumnSlide(11, '2D 배치 모드', '배치 전 상태와 안내 UX', [
    '가구가 없을 때는 빈 화면 대신 다음 행동을 안내하는 메시지 제공',
    '방 크기와 벽/창문/문 정보를 기준으로 배치 영역 구성',
    '선택, 정렬, 삭제, AI 추천으로 편집 흐름을 보조',
  ], img.editorEmpty, '2D 모드: 배치 전 상태에서도 사용자가 다음 행동을 알 수 있게 설계')

  twoColumnSlide(12, '가구 배치 기능', '선택과 조작 중심의 편집 경험', [
    '카탈로그에서 가구를 선택하고 배치 버튼으로 캔버스에 추가',
    '선택된 가구는 외곽선과 핸들로 현재 조작 대상을 명확히 표시',
    '정렬, 선택 삭제, 전체 삭제 같은 반복 편집 기능을 제공',
  ], img.placement, '가구 배치: 선택 상태와 편집 컨트롤을 시각적으로 표시')

  twoColumnSlide(13, '3D 시각화', '배치를 공간감으로 확인', [
    '2D에서 만든 배치를 3D 방 구조로 변환',
    '벽, 바닥, 창문, 조명, 가구 모델을 조합해 실제 방 분위기 구현',
    '가구 높이와 바닥 접지를 조정해 공중에 뜨는 문제를 개선',
  ], img.complete, '3D 모드: 원룸 안에서 배치감을 시각적으로 확인')

  twoColumnSlide(14, '뷰어 모드', '사용자 시점 둘러보기', [
    '편집용 카메라와 별도로 사용자 시점 카메라를 제공',
    'WASD/방향키와 화면 드래그로 이동 및 시선 조작 가능',
    '배치 결과를 단순 화면이 아니라 실제 방 안에 들어간 느낌으로 확인',
  ], img.viewer, '둘러보기 모드: 배치 결과를 1인칭 시점으로 체감')

  twoColumnSlide(15, 'AI Pick 추천', '현재 방 상태 기반 가구 제안', [
    '현재 배치 상태를 진단하고 부족한 가구를 우선순위로 추천',
    '추천 사유와 검색어를 함께 제공해 사용자가 판단하기 쉽게 구성',
    'API 키 없이도 검색 URL 기반으로 쇼핑 탐색까지 연결',
  ], img.aiPick, 'AI Pick: 부족한 가구와 추천 이유를 카드 형태로 제공')

  twoColumnSlide(16, '쿠팡 검색 연결', '추천에서 구매 탐색으로 확장', [
    '추천 카드에서 쿠팡 검색 버튼을 누르면 키워드 기반 검색 페이지로 이동',
    '실제 구매 API 대신 검색 URL 연결 방식으로 빠르게 검증 가능한 MVP 구현',
    '향후 파트너스 API 승인 시 상품명, 가격, 이미지 자동 노출로 확장 가능',
  ], img.coupang, '쿠팡 검색 연동: 추천 키워드를 실제 쇼핑 탐색으로 연결')

  twoColumnSlide(17, '내 정보 관리', '계정 정보 확인과 수정', [
    '로그인한 사용자의 이메일, 연락처, 주소, 가입 방식 정보를 표시',
    '프로필 수정과 주소 검색을 같은 화면에서 처리',
    '계정 관련 위험 행동은 별도 영역으로 분리해 실수 가능성을 줄임',
  ], img.account, '내 정보 화면: 확인, 수정, 회원탈퇴 영역 분리')

  twoColumnSlide(18, '회원탈퇴 플로우', '위험 행동 보호 장치', [
    '탈퇴 버튼 즉시 실행 대신 확인 화면을 거치도록 설계',
    '사용자가 지정 문구를 입력해야 탈퇴가 진행되는 안전장치 적용',
    '계정 삭제 시 저장 공간도 함께 지워진다는 안내를 명확히 제공',
  ], img.withdraw, '회원탈퇴 확인: 실수 방지를 위한 입력 확인 절차')

  const slide19 = pptx.addSlide()
  addHeader(slide19, 19, '데이터 흐름')
  const nodes = [
    ['사용자', '로그인/입력/편집'],
    ['React UI', '화면 상태와 인터랙션'],
    ['Planner State', '가구, 방 크기, 선택 상태'],
    ['Spring Boot API', '인증/회원/프로젝트 처리'],
    ['Local/Server Data', '저장된 프로젝트와 계정 정보'],
  ]
  nodes.forEach(([head, body], i) => {
    const x = 0.76 + i * 2.5
    addCard(slide19, x, 2.12, 2.0, 2.25, { fill: i === 2 ? 'F5FAFF' : C.card })
    addText(slide19, head, x + 0.2, 2.48, 1.56, 0.32, { size: 13.2, bold: true, align: 'center' })
    addText(slide19, body, x + 0.18, 3.08, 1.62, 0.46, { size: 8.8, color: C.muted, align: 'center' })
    if (i < nodes.length - 1) addText(slide19, '→', x + 2.1, 2.94, 0.28, 0.24, { size: 15, bold: true, color: C.blue })
  })
  addBullets(slide19, [
    '사용자 입력은 React 상태로 즉시 반영되고, 프로젝트 저장 시 구조화된 레이아웃 데이터로 보관됩니다.',
    '2D와 3D는 같은 가구 데이터를 공유해 화면 전환 후에도 배치가 유지됩니다.',
    '계정 정보와 프로젝트 정보는 분리하여 관리해 유지보수성과 확장성을 고려했습니다.',
  ], 1.08, 5.12, 10.95, 0.95, { size: 10.2 })
  addFooter(slide19)

  const slide20 = pptx.addSlide()
  addHeader(slide20, 20, '구현 포인트')
  const techs = [
    ['Frontend', 'React, Vite, CSS\n컴포넌트 기반 화면 구성'],
    ['3D', 'Three.js, React Three Fiber\n원룸 공간과 가구 모델링'],
    ['Backend', 'Spring Boot\n회원/인증/프로젝트 API'],
    ['UX', '미니멀 레이아웃\n카드, CTA, 상태 안내 통일'],
  ]
  techs.forEach(([head, body], i) => {
    const x = 0.86 + (i % 2) * 5.95
    const y = 1.96 + Math.floor(i / 2) * 2.08
    addCard(slide20, x, y, 5.42, 1.54, { fill: i === 1 ? 'F5FAFF' : C.card })
    addText(slide20, head, x + 0.28, y + 0.28, 1.55, 0.26, { size: 13.5, bold: true, color: C.blue })
    addText(slide20, body, x + 2.04, y + 0.28, 2.92, 0.72, { size: 10.5, color: C.muted })
  })
  addText(slide20, '핵심은 “가구 배치 데이터 하나를 2D 편집, 3D 시각화, AI 추천, 프로젝트 저장에서 함께 쓰는 구조”입니다.', 1.08, 6.22, 10.92, 0.34, { size: 12.2, bold: true, color: C.ink, align: 'center' })
  addFooter(slide20)

  const slide21 = pptx.addSlide()
  addHeader(slide21, 21, '트러블슈팅')
  const issues = [
    ['가구가 공중에 뜨는 문제', '가구 타입별 높이와 지지면 계산을 조정해 바닥 접지감을 개선했습니다.'],
    ['뷰어 모드 미동작', '투어 전용 카메라가 실제 렌더링 카메라로 등록되도록 연결 구조를 수정했습니다.'],
    ['화면 톤 불일치', '로그인 화면의 미니멀 톤을 홈, 프로젝트, 내 정보, 에디터까지 확장했습니다.'],
  ]
  issues.forEach(([head, body], i) => {
    addCard(slide21, 0.9, 1.92 + i * 1.35, 5.35, 0.96, { fill: i === 1 ? 'F5FAFF' : C.card })
    addText(slide21, head, 1.18, 2.16 + i * 1.35, 2.72, 0.24, { size: 12.4, bold: true })
    addText(slide21, body, 1.18, 2.5 + i * 1.35, 4.42, 0.24, { size: 8.8, color: C.muted })
  })
  addImageFit(slide21, img.viewer, 6.75, 1.88, 5.76, 3.9)
  addText(slide21, '문제가 보일 때마다 화면과 코드를 함께 보며 “사용자가 체감하는 불편” 기준으로 수정했습니다.', 6.9, 6.08, 5.3, 0.36, { size: 10.2, color: C.muted, align: 'center' })
  addFooter(slide21)

  const slide22 = pptx.addSlide()
  addBg(slide22)
  addText(slide22, '결과와 회고', 0.86, 0.72, 4.2, 0.54, { size: 24, bold: true })
  addText(slide22, 'My One Room은 단순한 CRUD를 넘어, 사용자가 직접 방을 꾸미고 확인하고 추천까지 받을 수 있는 인터랙티브 서비스로 확장했습니다.', 0.88, 1.62, 5.48, 0.72, { size: 13.2, color: C.muted })
  const wins = [
    ['완성도', '로그인부터 프로젝트 저장, 2D/3D 편집까지 한 흐름 완성'],
    ['확장성', 'AI 추천과 쇼핑 검색으로 서비스 경험 확장'],
    ['개선점', '실제 상품 API, 더 정교한 3D 모델, 반응형 고도화 예정'],
  ]
  wins.forEach(([head, body], i) => {
    addCard(slide22, 0.9, 2.86 + i * 1.12, 5.28, 0.76, { fill: i === 1 ? 'F5FAFF' : C.card })
    addText(slide22, head, 1.18, 3.08 + i * 1.12, 1.1, 0.2, { size: 10.5, bold: true, color: C.blue })
    addText(slide22, body, 2.32, 3.08 + i * 1.12, 3.42, 0.2, { size: 8.8, color: C.muted })
  })
  addImageFit(slide22, img.complete, 6.82, 1.16, 5.76, 4.62)
  addText(slide22, 'Thank you', 8.66, 6.24, 2.2, 0.34, { size: 18, bold: true, color: C.blue, align: 'center' })
  addFooter(slide22)
}

createSlides()
await pptx.writeFile({ fileName: outFile })
console.log(outFile)
