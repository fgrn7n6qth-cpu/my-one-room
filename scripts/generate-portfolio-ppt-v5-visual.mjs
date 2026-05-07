import fs from 'node:fs'
import path from 'node:path'
import PptxGenJS from 'pptxgenjs'

const rootDir = process.cwd()
const mediaDir = path.join(rootDir, 'artifacts', 'ppt-media')
const outFile = path.join(rootDir, 'artifacts', 'MyOneRoom_Portfolio_v5_visual-focused.pptx')

const images = {
  login: 'image-6-1.png',
  signup: 'image-6-2.png',
  reset: 'image-6-3.png',
  signupDone: 'image-5-1.png',
  infoSave: 'image-7-1.png',
  main: 'image-2-1.png',
  projectStart: 'image-3-1.png',
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

for (const [key, file] of Object.entries(images)) {
  images[key] = path.join(mediaDir, file)
  if (!fs.existsSync(images[key])) throw new Error(`Missing image: ${images[key]}`)
}

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'My One Room'
pptx.title = 'My One Room Portfolio Visual Focused'
pptx.subject = 'Screen-focused portfolio'
pptx.lang = 'ko-KR'
pptx.theme = {
  headFontFace: 'Malgun Gothic',
  bodyFontFace: 'Malgun Gothic',
  lang: 'ko-KR',
}

const C = {
  bg: 'F6F8FB',
  ink: '101418',
  muted: '66707C',
  sub: '9AA4B2',
  line: 'DCE4EF',
  card: 'FFFFFF',
  blue: '0878E6',
  blueSoft: 'EAF4FF',
  dark: '20242A',
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
    fontSize: opt.size ?? 10,
    bold: opt.bold ?? false,
    color: opt.color ?? C.ink,
    align: opt.align ?? 'left',
    valign: opt.valign ?? 'top',
    margin: 0,
    fit: 'shrink',
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
      color: 'C8D2DE',
      opacity: 0.13,
      blur: 2,
      angle: 45,
      distance: 1,
    },
  })
}

function fitImage(slide, file, x, y, w, h, opt = {}) {
  const size = imageSize(file)
  const scale = Math.min(w / size.w, h / size.h)
  const iw = size.w * scale
  const ih = size.h * scale
  if (opt.frame !== false) card(slide, x, y, w, h, { fill: opt.fill ?? C.card, radius: opt.radius ?? 0.2 })
  slide.addImage({
    path: file,
    x: x + (w - iw) / 2,
    y: y + (h - ih) / 2,
    w: iw,
    h: ih,
  })
}

function pill(slide, value, x, y, w, opt = {}) {
  card(slide, x, y, w, 0.3, {
    fill: opt.fill ?? C.blueSoft,
    lineTrans: 100,
    shadow: false,
    radius: 0.12,
  })
  text(slide, value, x, y + 0.08, w, 0.11, {
    size: 6.8,
    bold: true,
    color: opt.color ?? C.blue,
    align: 'center',
  })
}

function addTop(slide, no, title, subtitle = '') {
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0, y: 0, w: 13.333, h: 0.1,
    fill: { color: C.blue },
    line: { transparency: 100 },
  })
  text(slide, 'MY ONE ROOM', 0.52, 0.28, 1.9, 0.16, {
    size: 6.6,
    bold: true,
    color: C.sub,
    charSpace: 1.3,
  })
  text(slide, title, 0.52, 0.52, 7.6, 0.34, {
    size: 17,
    bold: true,
  })
  if (subtitle) text(slide, subtitle, 0.54, 0.94, 7.7, 0.16, { size: 7.4, color: C.muted })
  text(slide, String(no).padStart(2, '0'), 12.1, 0.48, 0.54, 0.16, {
    size: 9,
    bold: true,
    color: C.blue,
    align: 'center',
  })
}

function bullets(slide, items, x, y, w, h) {
  const runs = items.map((item, index) => ({
    text: item,
    options: { bullet: { type: 'ul' }, breakLine: index < items.length - 1 },
  }))
  slide.addText(runs, {
    x, y, w, h,
    fontFace: 'Malgun Gothic',
    fontSize: 8.2,
    color: C.ink,
    margin: 0,
    fit: 'shrink',
    paraSpaceAfterPt: 4,
  })
}

function visualSlide(no, title, subtitle, file, points, tags = [], layout = 'wide') {
  const slide = pptx.addSlide()
  addTop(slide, no, title, subtitle)

  if (layout === 'tall') {
    fitImage(slide, file, 3.1, 1.18, 7.1, 5.55)
  } else if (layout === 'side') {
    fitImage(slide, file, 1.0, 1.16, 6.45, 5.48)
    card(slide, 7.84, 1.74, 3.95, 3.4, { fill: C.card })
    text(slide, '핵심 구현', 8.18, 2.04, 1.2, 0.18, { size: 9.4, bold: true, color: C.blue })
    bullets(slide, points, 8.22, 2.46, 2.9, 1.34)
    tags.slice(0, 4).forEach((tag, i) => pill(slide, tag, 8.22 + (i % 2) * 1.36, 4.26 + Math.floor(i / 2) * 0.42, 1.16))
    return
  } else {
    fitImage(slide, file, 0.62, 1.18, 12.08, 5.44)
  }

  card(slide, 1.12, 6.42, 11.08, 0.54, { fill: 'FFFFFF', radius: 0.14, shadow: false })
  text(slide, points.join(' · '), 1.38, 6.59, 8.3, 0.13, { size: 7.8, color: C.muted })
  tags.slice(0, 3).forEach((tag, i) => pill(slide, tag, 9.78 + i * 0.74, 6.54, 0.64, { fill: i === 0 ? C.blue : C.blueSoft, color: i === 0 ? 'FFFFFF' : C.blue }))
}

function titleSlide() {
  const slide = pptx.addSlide()
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.1, fill: { color: C.blue }, line: { transparency: 100 } })
  text(slide, 'MY ONE ROOM', 0.82, 0.92, 2.4, 0.18, { size: 7.6, bold: true, color: C.blue, charSpace: 1.6 })
  text(slide, '원룸 인테리어\n플래너 서비스', 0.82, 1.34, 4.9, 1.2, { size: 29, bold: true })
  text(slide, '화면이 한눈에 들어오도록 캡쳐를 크게 보여주는 포트폴리오 구성', 0.84, 3.08, 4.7, 0.3, { size: 11.4, color: C.muted })
  pill(slide, 'Screen Focused', 0.84, 4.0, 1.36, { fill: C.blue, color: 'FFFFFF' })
  pill(slide, '28 Slides', 2.36, 4.0, 0.86)
  pill(slide, '2D / 3D / AI', 3.38, 4.0, 1.18)
  fitImage(slide, images.viewer, 6.18, 0.82, 6.28, 5.34)
  text(slide, 'React · Spring Boot · Three.js', 0.84, 6.96, 3.4, 0.16, { size: 7.2, color: C.sub })
}

function overviewSlide() {
  const slide = pptx.addSlide()
  addTop(slide, 2, '프로젝트 개요', '서비스 목표와 핵심 기능')
  card(slide, 0.76, 1.45, 3.5, 4.84)
  text(slide, '서비스 정의', 1.08, 1.84, 1.2, 0.22, { size: 11.2, bold: true, color: C.blue })
  text(slide, '원룸 사용자가 가구 배치, 공간감 확인, 추천 가구 탐색을 한 번에 처리할 수 있는 웹 기반 인테리어 플래너입니다.', 1.08, 2.34, 2.82, 0.84, { size: 12.4, bold: true })
  bullets(slide, ['작은 공간의 배치 실패 비용 감소', '2D와 3D를 오가며 빠른 검토', 'AI Pick으로 구매 후보까지 제안'], 1.12, 3.76, 2.62, 1.24)
  fitImage(slide, images.main, 4.66, 1.44, 7.84, 4.86)
}

function flowSlide() {
  const slide = pptx.addSlide()
  addTop(slide, 3, '사용자 플로우', '포트폴리오에서 보여줄 화면 순서')
  const steps = ['로그인', '회원가입', '정보 저장', '메인', '프로젝트', '2D 편집', '3D/뷰어', 'AI 추천']
  steps.forEach((step, i) => {
    const x = 0.74 + (i % 4) * 3.06
    const y = 1.72 + Math.floor(i / 4) * 2.0
    card(slide, x, y, 2.48, 1.32, { fill: i >= 5 ? C.blueSoft : C.card })
    text(slide, String(i + 1), x + 0.18, y + 0.22, 0.28, 0.14, { size: 8.6, bold: true, color: C.blue })
    text(slide, step, x + 0.44, y + 0.58, 1.56, 0.22, { size: 13, bold: true, align: 'center' })
  })
  card(slide, 1.0, 6.02, 11.34, 0.5, { fill: C.card, shadow: false })
  text(slide, '화면 하나당 슬라이드 하나로 분리해 캡쳐를 크게 보여주고, 설명은 최소한만 남겼습니다.', 1.28, 6.18, 10.3, 0.12, { size: 8.6, color: C.muted, align: 'center' })
}

function sectionSlide(no, title, subtitle) {
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.1, fill: { color: C.blue }, line: { transparency: 100 } })
  text(slide, String(no).padStart(2, '0'), 0.88, 1.9, 0.8, 0.22, { size: 14, bold: true, color: C.blue })
  text(slide, title, 0.88, 2.38, 6.4, 0.54, { size: 29, bold: true, color: 'FFFFFF' })
  text(slide, subtitle, 0.92, 3.36, 6.5, 0.28, { size: 11.4, color: 'CBD5E1' })
}

titleSlide()
overviewSlide()
flowSlide()
sectionSlide(4, '01. 인증 화면', '로그인, 회원가입, 비밀번호 재설정, 가입 완료')
visualSlide(5, '로그인 화면', '이메일 로그인과 소셜 로그인 진입점', images.login, ['중앙 정렬 폼', '소셜 로그인 CTA', '회원가입/비밀번호 재설정 연결'], ['Auth', 'Social'], 'tall')
visualSlide(6, '회원가입 화면', '이메일 인증 기반 계정 생성', images.signup, ['이름/이메일/비밀번호 입력', '중복 확인과 인증코드 전송', '동일한 인증 화면 톤 유지'], ['Signup', 'Email'], 'tall')
visualSlide(7, '비밀번호 재설정 화면', '계정 복구 플로우', images.reset, ['이메일 기반 재설정', '인증코드와 새 비밀번호 입력', '로그인 복귀 경로 제공'], ['Reset'], 'tall')
visualSlide(8, '회원가입 완료 화면', '계정 생성 후 다음 행동 안내', images.signupDone, ['계정 생성 완료 안내', '계속하기 CTA', '로그인 필요 안내'], ['Complete'], 'tall')
sectionSlide(9, '02. 홈과 계정 정보', '기본 정보 저장, 메인, 내 정보, 회원탈퇴')
visualSlide(10, '기본 정보 저장 화면', '최초 로그인 후 프로필 보완', images.infoSave, ['이름/전화번호/주소 등록', '주소 검색 팝업 연동', '원룸 저장 전 기본 정보 보완'], ['Profile', 'Address'])
visualSlide(11, '메인 화면', '서비스 진입 허브', images.main, ['새 원룸 시작 CTA', '최근 원룸 이어하기', '프로젝트/내 정보 탭 이동'], ['Home', 'CTA'])
visualSlide(12, '내 정보 화면', '계정 확인과 수정', images.account, ['프로필 정보 확인', '수정 폼과 주소 검색', '회원탈퇴 영역 분리'], ['Account', 'Edit'])
visualSlide(13, '회원탈퇴 화면', '위험 행동 보호 장치', images.withdraw, ['즉시 탈퇴 방지', '지정 문구 입력 확인', '삭제 범위 안내'], ['Danger'], 'side')
sectionSlide(14, '03. 프로젝트 관리', '원룸 생성, 목록, 상세 편집')
visualSlide(15, '원룸 선택 화면', '새 프로젝트 시작 템플릿', images.projectStart, ['평수별 원룸 템플릿', '새 원룸 만들기', '빠른 프로젝트 시작'], ['Template'], 'side')
visualSlide(16, '프로젝트 화면', '저장된 원룸 관리', images.project, ['최근 꾸민 원룸 목록', '선택 프로젝트 상세 편집', '꾸미기 시작/계속하기'], ['Project', 'Save'])
sectionSlide(17, '04. 2D 편집 화면', '가구 선택과 배치 중심의 작업 화면')
visualSlide(18, '2D 빈 배치 화면', '배치 전 상태 안내', images.empty2d, ['빈 상태 안내 메시지', '왼쪽 카탈로그 선택 유도', 'AI Pick 추천 제공'], ['2D', 'Empty'])
visualSlide(19, '2D 가구 배치 화면', '선택과 조작 중심 편집', images.placement, ['선택 외곽선과 핸들', '2D/3D 모드 전환', '정렬/삭제 컨트롤'], ['Placement', 'Editor'])
visualSlide(20, 'AI Pick 패널', '현재 방 상태 기반 추천', images.aiPick, ['방 상태 진단', '추천 사유와 검색어', '배치/쿠팡 검색 연결'], ['AI', 'Recommend'], 'side')
sectionSlide(21, '05. 3D와 뷰어', '배치 결과를 공간감 있게 확인')
visualSlide(22, '3D 편집 화면', '배치를 입체 공간으로 확인', images.complete3d, ['2D 배치를 3D로 변환', '벽/바닥/창문/조명 구성', '가구 접지 보정'], ['3D', 'Three'])
visualSlide(23, '뷰어 모드 화면', '사용자 시점 둘러보기', images.viewer, ['사용자 시점 카메라', 'WASD/방향키와 드래그', '편집 모드와 체험 모드 분리'], ['Viewer', 'Camera'])
visualSlide(24, '쿠팡 검색 연결', '추천에서 구매 탐색으로', images.coupang, ['추천 키워드 검색 URL 연결', 'API 없이 MVP 검증', '파트너스 API 확장 가능'], ['Search', 'Coupang'])
sectionSlide(25, '06. 구현 정리', '기술, 문제 해결, 회고')

const tech = pptx.addSlide()
addTop(tech, 26, '구현 포인트', '화면 뒤에서 동작하는 주요 구현 요소')
;[
  ['Frontend', 'React, Vite, CSS 기반 컴포넌트 화면 구성'],
  ['3D Rendering', 'React Three Fiber와 Three.js로 방/가구 시각화'],
  ['State', '가구 배치, 선택 상태, 프로젝트 데이터를 하나의 흐름으로 관리'],
  ['Backend', 'Spring Boot 기반 회원, 인증, 프로젝트 API 구성'],
  ['UX', '미니멀 톤, 명확한 CTA, 상태 안내를 화면 전체에 통일'],
  ['Recommendation', '방 상태 기반 추천 문구와 쿠팡 검색 URL 연결'],
].forEach(([head, body], i) => {
  const x = 0.82 + (i % 2) * 5.86
  const y = 1.54 + Math.floor(i / 2) * 1.58
  card(tech, x, y, 5.28, 1.0, { fill: i === 1 || i === 5 ? C.blueSoft : C.card })
  text(tech, head, x + 0.26, y + 0.2, 1.6, 0.18, { size: 10.8, bold: true, color: C.blue })
  text(tech, body, x + 1.8, y + 0.2, 3.1, 0.34, { size: 8.4, color: C.muted })
})

const trouble = pptx.addSlide()
addTop(trouble, 27, '트러블슈팅', '개발 중 직접 개선한 문제들')
;[
  ['가구 공중 부양', '3D 배치에서 가구가 바닥에서 뜨는 문제를 타입별 높이와 지지면 계산으로 보정했습니다.'],
  ['뷰어 모드 미동작', '투어 카메라가 실제 렌더링 카메라로 등록되도록 연결 구조를 수정했습니다.'],
  ['화면 톤 불일치', '로그인 화면에서 시작한 미니멀 톤을 홈, 프로젝트, 내 정보, 에디터까지 확장했습니다.'],
].forEach(([head, body], i) => {
  card(trouble, 1.0, 1.62 + i * 1.22, 11.22, 0.88, { fill: i === 1 ? C.blueSoft : C.card })
  text(trouble, head, 1.34, 1.88 + i * 1.22, 2.2, 0.18, { size: 10.6, bold: true, color: i === 1 ? C.blue : C.ink })
  text(trouble, body, 3.72, 1.88 + i * 1.22, 7.7, 0.2, { size: 8.4, color: C.muted })
})

const closing = pptx.addSlide()
closing.background = { color: C.bg }
closing.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 0.1, fill: { color: C.blue }, line: { transparency: 100 } })
text(closing, '결과와 회고', 0.86, 0.82, 4.0, 0.44, { size: 24, bold: true })
text(closing, '단순한 CRUD를 넘어 사용자가 직접 방을 꾸미고, 3D로 확인하고, 추천까지 받을 수 있는 인터랙티브 서비스로 확장했습니다.', 0.9, 1.6, 5.7, 0.54, { size: 12, color: C.muted })
;[
  ['완성도', '로그인부터 프로젝트 저장, 2D/3D 편집까지 한 흐름 완성'],
  ['확장성', 'AI 추천과 쇼핑 검색으로 서비스 경험 확장'],
  ['개선 방향', '실제 상품 API, 정교한 3D 모델, 반응형 고도화'],
].forEach(([head, body], i) => {
  card(closing, 0.94, 2.74 + i * 1.06, 5.54, 0.72, { fill: i === 1 ? C.blueSoft : C.card })
  text(closing, head, 1.22, 2.96 + i * 1.06, 1.08, 0.18, { size: 10.2, bold: true, color: C.blue })
  text(closing, body, 2.46, 2.96 + i * 1.06, 3.46, 0.18, { size: 8.3, color: C.muted })
})
fitImage(closing, images.viewer, 7.02, 1.16, 5.1, 4.42)
text(closing, 'Thank you', 8.66, 6.28, 2.0, 0.28, { size: 18, bold: true, color: C.blue, align: 'center' })

await pptx.writeFile({ fileName: outFile })
console.log(outFile)
