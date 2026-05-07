import fs from 'node:fs'
import path from 'node:path'
import PptxGenJS from 'pptxgenjs'

const rootDir = process.cwd()
const outDir = path.join(rootDir, 'artifacts')
const mediaDir = path.join(outDir, 'ppt-media')
const outFile = path.join(outDir, 'MyOneRoom_Portfolio_v4_screen-by-screen.pptx')

const shots = {
  login: 'image-6-1.png',
  signup: 'image-6-2.png',
  reset: 'image-6-3.png',
  signupDone: 'image-5-1.png',
  infoSave: 'image-7-1.png',
  main: 'image-2-1.png',
  projectSmall: 'image-3-1.png',
  project: 'image-9-1.png',
  account: 'image-17-1.png',
  withdraw: 'image-18-1.png',
  empty2d: 'image-11-1.png',
  placement: 'image-10-1.png',
  complete3d: 'image-13-1.png',
  viewer: 'image-14-1.png',
  aiPick: 'image-15-1.png',
  coupang: 'image-16-1.png',
}

for (const [key, file] of Object.entries(shots)) {
  shots[key] = path.join(mediaDir, file)
  if (!fs.existsSync(shots[key])) {
    throw new Error(`Missing screenshot "${key}": ${shots[key]}`)
  }
}

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'My One Room'
pptx.subject = 'My One Room Portfolio'
pptx.title = 'My One Room Portfolio - Screen by Screen'
pptx.lang = 'ko-KR'
pptx.theme = {
  headFontFace: 'Malgun Gothic',
  bodyFontFace: 'Malgun Gothic',
  lang: 'ko-KR',
}

const C = {
  bg: 'F7F9FC',
  card: 'FFFFFF',
  ink: '13161A',
  muted: '66707D',
  sub: '98A2B3',
  line: 'DDE5EF',
  blue: '0B7BEA',
  blueSoft: 'E9F4FF',
  cream: 'F7F2EA',
  dark: '20242A',
  red: 'EA5261',
  green: '15C46F',
}

function imageSize(file) {
  const buffer = fs.readFileSync(file)
  return {
    w: buffer.readUInt32BE(16),
    h: buffer.readUInt32BE(20),
  }
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
    rectRadius: opt.radius ?? 0.16,
    fill: { color: opt.fill ?? C.card, transparency: opt.transparency ?? 0 },
    line: { color: opt.line ?? C.line, pt: opt.pt ?? 0.75, transparency: opt.lineTrans ?? 0 },
    shadow: opt.shadow === false ? undefined : {
      type: 'outer',
      color: 'CAD4E0',
      opacity: 0.12,
      blur: 2,
      angle: 45,
      distance: 1,
    },
  })
}

function pill(slide, value, x, y, w, opt = {}) {
  card(slide, x, y, w, 0.32, {
    fill: opt.fill ?? C.blueSoft,
    lineTrans: 100,
    shadow: false,
    radius: 0.12,
  })
  text(slide, value, x, y + 0.08, w, 0.12, {
    size: 7.2,
    bold: true,
    color: opt.color ?? C.blue,
    align: 'center',
  })
}

function base(slide, no, title, subtitle = '') {
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.12,
    fill: { color: C.blue },
    line: { transparency: 100 },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0.12, w: 13.333, h: 0.66,
    fill: { color: 'FFFFFF', transparency: 6 },
    line: { transparency: 100 },
  })
  text(slide, 'MY ONE ROOM', 0.6, 0.33, 2.0, 0.16, {
    size: 6.8,
    bold: true,
    color: C.sub,
    charSpace: 1.4,
  })
  text(slide, title, 0.6, 0.58, 7.8, 0.38, {
    size: 18.5,
    bold: true,
  })
  if (subtitle) {
    text(slide, subtitle, 0.62, 1.05, 7.5, 0.22, {
      size: 8.2,
      color: C.muted,
    })
  }
  text(slide, String(no).padStart(2, '0'), 12.0, 0.52, 0.68, 0.18, {
    size: 10.2,
    bold: true,
    color: C.blue,
    align: 'center',
  })
}

function fitImage(slide, file, x, y, w, h, opt = {}) {
  const size = imageSize(file)
  const scale = Math.min(w / size.w, h / size.h)
  const iw = size.w * scale
  const ih = size.h * scale
  if (opt.frame !== false) {
    card(slide, x, y, w, h, {
      fill: opt.fill ?? C.card,
      radius: opt.radius ?? 0.18,
    })
  }
  slide.addImage({
    path: file,
    x: x + (w - iw) / 2,
    y: y + (h - ih) / 2,
    w: iw,
    h: ih,
  })
}

function bullets(slide, items, x, y, w, h, opt = {}) {
  const runs = items.map((item, index) => ({
    text: item,
    options: {
      bullet: { type: 'ul' },
      breakLine: index < items.length - 1,
    },
  }))
  slide.addText(runs, {
    x, y, w, h,
    fontFace: 'Malgun Gothic',
    fontSize: opt.size ?? 9.4,
    color: opt.color ?? C.ink,
    margin: 0,
    fit: 'shrink',
    paraSpaceAfterPt: 8,
  })
}

function screenSlide(no, title, subtitle, file, points, tags = []) {
  const slide = pptx.addSlide()
  base(slide, no, title, subtitle)
  fitImage(slide, file, 0.58, 1.42, 8.2, 5.38)
  card(slide, 9.16, 1.42, 3.46, 5.38, { fill: 'FFFFFF', radius: 0.18 })
  text(slide, '화면 설명', 9.48, 1.78, 1.4, 0.22, {
    size: 10.2,
    bold: true,
    color: C.blue,
  })
  bullets(slide, points, 9.5, 2.24, 2.66, 2.64, { size: 9.1 })
  text(slide, '구현 포인트', 9.48, 5.22, 1.4, 0.2, {
    size: 8.4,
    bold: true,
    color: C.muted,
  })
  tags.forEach((tag, index) => {
    const row = Math.floor(index / 2)
    const col = index % 2
    pill(slide, tag, 9.48 + col * 1.35, 5.58 + row * 0.43, 1.18, {
      fill: index % 2 === 0 ? C.blueSoft : C.cream,
      color: index % 2 === 0 ? C.blue : C.dark,
    })
  })
}

function flowArrow(slide, x, y, w) {
  slide.addShape(pptx.ShapeType.line, {
    x, y, w, h: 0,
    line: { color: C.line, pt: 1.2, endArrowType: 'triangle' },
  })
}

function titleSlide() {
  const slide = pptx.addSlide()
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.12,
    fill: { color: C.blue },
    line: { transparency: 100 },
  })
  text(slide, 'MY ONE ROOM', 0.86, 1.0, 2.2, 0.2, {
    size: 8,
    bold: true,
    color: C.blue,
    charSpace: 1.5,
  })
  text(slide, '원룸 인테리어\n플래너 서비스', 0.86, 1.5, 5.2, 1.4, {
    size: 31,
    bold: true,
  })
  text(slide, '화면 하나하나를 크게 보여주는 포트폴리오용 상세 구성', 0.9, 3.36, 4.8, 0.34, {
    size: 12.2,
    color: C.muted,
  })
  pill(slide, 'Screen by Screen', 0.9, 4.32, 1.52, { fill: C.blue, color: 'FFFFFF' })
  pill(slide, '2D / 3D Editor', 2.6, 4.32, 1.34)
  pill(slide, 'AI Pick', 4.08, 4.32, 0.92, { fill: C.cream, color: C.dark })
  fitImage(slide, shots.viewer, 6.44, 0.84, 5.94, 5.12)
  text(slide, 'Portfolio · React · Spring Boot · Three.js', 0.9, 6.96, 4.2, 0.18, {
    size: 7.6,
    color: C.sub,
  })
}

function overviewSlide() {
  const slide = pptx.addSlide()
  base(slide, 2, '프로젝트 개요', '서비스가 해결하려는 문제와 전체 방향')
  card(slide, 0.78, 1.7, 3.62, 4.8)
  text(slide, '서비스 정의', 1.08, 2.02, 1.4, 0.24, { size: 12, bold: true, color: C.blue })
  text(slide, '원룸 사용자가 가구 배치, 공간감 확인, 추천 가구 탐색을 한 번에 처리할 수 있는 웹 기반 인테리어 플래너입니다.', 1.08, 2.54, 2.92, 0.9, { size: 13, bold: true })
  bullets(slide, [
    '작은 공간의 배치 실패 비용을 줄임',
    '2D와 3D를 오가며 빠르게 검토',
    'AI Pick으로 다음 구매 후보까지 제안',
  ], 1.12, 4.02, 2.72, 1.3)
  card(slide, 4.78, 1.7, 7.72, 4.8)
  ;[
    ['01', '인증', '로그인/회원가입/비밀번호 재설정'],
    ['02', '프로젝트', '원룸 생성/저장/이어하기'],
    ['03', '편집', '2D 배치와 3D 시각화'],
    ['04', '추천', 'AI Pick과 쿠팡 검색 연결'],
  ].forEach(([num, head, body], i) => {
    const x = 5.18 + (i % 2) * 3.42
    const y = 2.12 + Math.floor(i / 2) * 1.58
    card(slide, x, y, 2.86, 1.1, { fill: i === 2 ? C.blueSoft : 'FFFFFF', shadow: false })
    text(slide, num, x + 0.22, y + 0.22, 0.36, 0.18, { size: 8.8, bold: true, color: C.blue })
    text(slide, head, x + 0.72, y + 0.2, 1.6, 0.2, { size: 11, bold: true })
    text(slide, body, x + 0.72, y + 0.56, 1.8, 0.22, { size: 7.6, color: C.muted })
  })
}

function flowSlide() {
  const slide = pptx.addSlide()
  base(slide, 3, '사용자 플로우', '포트폴리오에서 보여줄 핵심 사용자 여정')
  const items = [
    ['로그인', '계정 진입'],
    ['정보 저장', '프로필 보완'],
    ['홈', '시작/이어하기'],
    ['프로젝트', '원룸 관리'],
    ['2D 편집', '가구 배치'],
    ['3D/뷰어', '공간 확인'],
    ['AI Pick', '추천/검색'],
  ]
  items.forEach(([head, desc], i) => {
    const x = 0.8 + i * 1.75
    card(slide, x, 2.3, 1.28, 1.26, { fill: i === 5 ? C.blueSoft : C.card, radius: 0.16 })
    text(slide, String(i + 1), x, 2.58, 1.28, 0.18, { size: 10, bold: true, color: C.blue, align: 'center' })
    text(slide, head, x + 0.08, 2.96, 1.12, 0.16, { size: 8.8, bold: true, align: 'center' })
    text(slide, desc, x + 0.08, 3.22, 1.12, 0.14, { size: 6.6, color: C.muted, align: 'center' })
    if (i < items.length - 1) flowArrow(slide, x + 1.36, 2.92, 0.3)
  })
  card(slide, 1.0, 4.62, 11.3, 1.0, { fill: 'FFFFFF' })
  text(slide, '구성 원칙', 1.34, 4.92, 1.1, 0.2, { size: 10, bold: true, color: C.blue })
  text(slide, '각 화면을 하나의 슬라이드로 분리해 UI 의도, 구현 기능, 사용자 행동을 명확하게 보여줍니다.', 2.42, 4.92, 8.9, 0.22, { size: 10.6, color: C.muted })
}

function sectionSlide(no, title, subtitle) {
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.12,
    fill: { color: C.blue },
    line: { transparency: 100 },
  })
  text(slide, String(no).padStart(2, '0'), 0.86, 1.92, 1.0, 0.28, { size: 15, bold: true, color: C.blue })
  text(slide, title, 0.86, 2.42, 6.4, 0.62, { size: 30, bold: true, color: 'FFFFFF' })
  text(slide, subtitle, 0.9, 3.42, 6.4, 0.34, { size: 12.2, color: 'CBD5E1' })
  card(slide, 8.6, 1.56, 2.86, 2.86, { fill: '2B3138', line: '38414A', radius: 0.24 })
  text(slide, 'MY\nONE\nROOM', 9.22, 2.1, 1.56, 1.14, { size: 24, bold: true, color: 'FFFFFF', align: 'center' })
}

function techSlide(no) {
  const slide = pptx.addSlide()
  base(slide, no, '구현 포인트', '화면 뒤에서 동작하는 주요 구현 요소')
  ;[
    ['Frontend', 'React, Vite, CSS 기반 컴포넌트 화면 구성'],
    ['3D Rendering', 'React Three Fiber와 Three.js로 방/가구 시각화'],
    ['State', '가구 배치, 선택 상태, 프로젝트 데이터를 하나의 흐름으로 관리'],
    ['Backend', 'Spring Boot 기반 회원, 인증, 프로젝트 API 구성'],
    ['UX', '미니멀 톤, 명확한 CTA, 상태 안내를 화면 전체에 통일'],
    ['Recommendation', '방 상태 기반 추천 문구와 쿠팡 검색 URL 연결'],
  ].forEach(([head, body], i) => {
    const x = 0.82 + (i % 2) * 5.86
    const y = 1.68 + Math.floor(i / 2) * 1.62
    card(slide, x, y, 5.26, 1.08, { fill: i === 1 || i === 5 ? C.blueSoft : C.card })
    text(slide, head, x + 0.26, y + 0.22, 1.6, 0.2, { size: 11.4, bold: true, color: C.blue })
    text(slide, body, x + 1.78, y + 0.22, 3.05, 0.38, { size: 8.8, color: C.muted })
  })
}

function troubleSlide(no) {
  const slide = pptx.addSlide()
  base(slide, no, '트러블슈팅', '개발 중 직접 개선한 문제들')
  ;[
    ['가구 공중 부양', '3D 배치에서 가구가 바닥에서 뜨는 문제를 타입별 높이와 지지면 계산으로 보정했습니다.'],
    ['뷰어 모드 미동작', '투어 카메라가 실제 렌더링 카메라로 등록되도록 연결 구조를 수정했습니다.'],
    ['화면 톤 불일치', '로그인 화면에서 시작한 미니멀 톤을 홈, 프로젝트, 내 정보, 에디터까지 확장했습니다.'],
    ['PPT 구성 개선', '화면을 여러 개 섞지 않고 한 슬라이드에 하나씩 분리해 포트폴리오 가독성을 높였습니다.'],
  ].forEach(([head, body], i) => {
    card(slide, 1.0, 1.72 + i * 1.18, 11.22, 0.84, { fill: i === 1 ? C.blueSoft : C.card })
    text(slide, head, 1.34, 1.96 + i * 1.18, 2.2, 0.18, { size: 10.5, bold: true, color: i === 1 ? C.blue : C.ink })
    text(slide, body, 3.72, 1.96 + i * 1.18, 7.7, 0.2, { size: 8.5, color: C.muted })
  })
}

function closingSlide(no) {
  const slide = pptx.addSlide()
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.12,
    fill: { color: C.blue },
    line: { transparency: 100 },
  })
  text(slide, '결과와 회고', 0.86, 0.8, 4.0, 0.48, { size: 25, bold: true })
  text(slide, '단순한 CRUD를 넘어 사용자가 직접 방을 꾸미고, 3D로 확인하고, 추천까지 받을 수 있는 인터랙티브 서비스로 확장했습니다.', 0.9, 1.62, 5.7, 0.58, { size: 12.2, color: C.muted })
  ;[
    ['완성도', '로그인부터 프로젝트 저장, 2D/3D 편집까지 한 흐름 완성'],
    ['확장성', 'AI 추천과 쇼핑 검색으로 서비스 경험 확장'],
    ['개선 방향', '실제 상품 API, 정교한 3D 모델, 반응형 고도화'],
  ].forEach(([head, body], i) => {
    card(slide, 0.94, 2.78 + i * 1.08, 5.54, 0.74, { fill: i === 1 ? C.blueSoft : C.card })
    text(slide, head, 1.22, 3.0 + i * 1.08, 1.08, 0.18, { size: 10.2, bold: true, color: C.blue })
    text(slide, body, 2.46, 3.0 + i * 1.08, 3.46, 0.18, { size: 8.4, color: C.muted })
  })
  fitImage(slide, shots.viewer, 7.02, 1.2, 5.1, 4.4)
  text(slide, 'Thank you', 8.66, 6.28, 2.0, 0.3, { size: 18, bold: true, color: C.blue, align: 'center' })
}

titleSlide()
overviewSlide()
flowSlide()
sectionSlide(4, '01. 인증 화면', '로그인, 회원가입, 비밀번호 재설정, 가입 완료')
screenSlide(5, '로그인 화면', '이메일 로그인과 소셜 로그인 진입점', shots.login, [
  '중앙 정렬 폼으로 입력 집중도를 높임',
  '카카오/네이버 소셜 로그인 CTA 제공',
  '비밀번호 재설정과 회원가입 경로를 같은 화면에서 연결',
], ['Auth', 'Social', 'Minimal'])
screenSlide(6, '회원가입 화면', '이메일 인증 기반 계정 생성', shots.signup, [
  '이름, 이메일, 인증코드, 비밀번호 입력 흐름 구성',
  '이메일 중복 확인과 인증코드 전송 버튼 제공',
  '로그인 화면과 동일한 레이아웃으로 일관성 유지',
], ['Signup', 'Email', 'Verification'])
screenSlide(7, '비밀번호 재설정 화면', '계정 복구 플로우', shots.reset, [
  '이메일로 재설정 코드를 받고 새 비밀번호 입력',
  '로그인으로 돌아가기 링크 제공',
  '로그인/회원가입과 같은 톤으로 복구 화면 통일',
], ['Reset', 'Recovery'])
screenSlide(8, '회원가입 완료 화면', '계정 생성 후 다음 행동 안내', shots.signupDone, [
  '계정 생성 완료 상태를 명확히 안내',
  '계속하기 버튼으로 서비스 진입을 자연스럽게 연결',
  '다시 시작하려면 소셜 로그인이 필요하다는 안내 문구 제공',
], ['Complete', 'Onboarding'])
sectionSlide(9, '02. 홈과 계정 정보', '홈, 기본 정보 저장, 내 정보, 회원탈퇴')
screenSlide(10, '기본 정보 저장 화면', '최초 로그인 후 프로필 보완', shots.infoSave, [
  '이름, 전화번호, 주소를 한 번에 등록',
  '카카오 우편번호 검색 팝업과 연동',
  '원룸 저장에 필요한 기본 정보를 선등록하도록 설계',
], ['Profile', 'Address'])
screenSlide(11, '메인 화면', '서비스 진입 허브', shots.main, [
  '새 원룸 시작과 최근 원룸 이어하기를 핵심 CTA로 배치',
  '홈/프로젝트/내 정보 탭으로 주요 영역 이동',
  '원룸 개수와 가구 개수를 작은 상태 정보로 제공',
], ['Home', 'CTA'])
screenSlide(12, '내 정보 화면', '계정 확인과 수정', shots.account, [
  '프로필 정보와 수정 폼을 좌우로 분리',
  '주소 검색과 정보 저장 버튼 제공',
  '회원탈퇴 영역을 별도 카드로 분리해 위험 행동을 구분',
], ['Account', 'Edit'])
screenSlide(13, '회원탈퇴 화면', '위험 행동 보호 장치', shots.withdraw, [
  '탈퇴 즉시 실행 대신 확인 화면으로 이동',
  '지정 문구 입력 후 탈퇴를 진행하도록 설계',
  '계정 삭제 시 저장 공간도 지워진다는 내용을 명확히 안내',
], ['Danger', 'Confirm'])
sectionSlide(14, '03. 프로젝트 관리', '원룸 생성, 목록, 상세 편집')
screenSlide(15, '원룸 선택 화면', '새 프로젝트 시작 템플릿', shots.projectSmall, [
  '7평부터 10평까지 원룸 템플릿 제공',
  '새 원룸 만들기 버튼으로 프로젝트 생성 시작',
  '방 타입과 평수 중심으로 빠르게 선택 가능',
], ['Template', 'Start'])
screenSlide(16, '프로젝트 화면', '저장된 원룸 관리', shots.project, [
  '최근 꾸민 원룸 목록을 카드 형태로 표시',
  '선택된 원룸의 이름, 타입, 평수, 소개 수정 가능',
  '꾸미기 시작/계속하기 버튼으로 편집 화면 연결',
], ['Project', 'Save'])
sectionSlide(17, '04. 2D 편집 화면', '가구 선택과 배치 중심의 작업 화면')
screenSlide(18, '2D 빈 배치 화면', '배치 전 상태 안내', shots.empty2d, [
  '가구가 없을 때 안내 메시지를 중앙에 표시',
  '왼쪽 카탈로그에서 가구를 선택하도록 유도',
  '오른쪽 AI Pick이 현재 상태에 맞는 추천을 제공',
], ['2D', 'Empty State'])
screenSlide(19, '2D 가구 배치 화면', '선택과 조작 중심 편집', shots.placement, [
  '선택된 가구에 외곽선과 조작 핸들을 표시',
  '상단에서 2D/3D 모드를 전환하고 저장/완료 가능',
  '오른쪽 패널에서 선택 수, 충돌 수, 정렬/삭제 기능 제공',
], ['Placement', 'Editor'])
screenSlide(20, 'AI Pick 패널', '현재 방 상태 기반 추천', shots.aiPick, [
  '방 상태를 진단하고 부족한 가구를 추천',
  '추천 사유와 검색어를 카드 안에 함께 제공',
  '배치 버튼과 쿠팡 검색 버튼으로 다음 행동을 연결',
], ['AI Pick', 'Recommend'])
sectionSlide(21, '05. 3D와 뷰어', '배치 결과를 공간감 있게 확인')
screenSlide(22, '3D 편집 화면', '배치를 입체 공간으로 확인', shots.complete3d, [
  '2D 배치 데이터를 3D 방 구조와 가구 모델로 렌더링',
  '벽, 창문, 바닥, 조명으로 실제 공간감을 구성',
  '가구 접지와 높이 보정을 통해 공중 부양 문제를 개선',
], ['3D', 'Three.js'])
screenSlide(23, '뷰어 모드 화면', '사용자 시점 둘러보기', shots.viewer, [
  '사용자 시점 카메라로 방 안을 직접 둘러보는 경험 제공',
  'WASD/방향키와 드래그 시선 이동을 지원',
  '편집 모드와 체험 모드를 분리해 결과 확인에 집중',
], ['Viewer', 'Camera'])
screenSlide(24, '쿠팡 검색 연결', '추천에서 구매 탐색으로', shots.coupang, [
  '추천 키워드를 쿠팡 검색 URL로 연결',
  'API 키 없이도 실제 쇼핑 탐색 흐름을 검증',
  '향후 파트너스 API 승인 시 상품 정보 자동 노출로 확장 가능',
], ['Search', 'Coupang'])
sectionSlide(25, '06. 구현 정리', '기술, 문제 해결, 회고')
techSlide(26)
troubleSlide(27)
closingSlide(28)

await pptx.writeFile({ fileName: outFile })
console.log(outFile)
