import fs from 'node:fs'
import path from 'node:path'
import PptxGenJS from 'pptxgenjs'

const rootDir = process.cwd()
const mediaDir = path.join(rootDir, 'artifacts', 'ppt-media')
const docsFile = path.join(rootDir, 'docs', 'portfolio', 'MyOneRoom_Portfolio.pptx')
const fallbackDocsFile = path.join(rootDir, 'docs', 'portfolio', 'MyOneRoom_Portfolio_large_text.pptx')

const img = {
  hero: 'image-13-1.png',
  login: 'image-6-1.png',
  signup: 'image-6-2.png',
  profile: 'image-7-1.png',
  home: 'image-2-1.png',
  projectStart: 'image-3-1.png',
  projectManage: 'image-9-1.png',
  editor2d: 'image-10-1.png',
  editor3d: 'image-13-1.png',
  tour: 'image-21-1.png',
  aiPick: 'image-15-1.png',
  coupang: 'image-16-1.png',
}

for (const [key, file] of Object.entries(img)) {
  img[key] = path.join(mediaDir, file)
  if (!fs.existsSync(img[key])) throw new Error(`Missing image for ${key}: ${img[key]}`)
}

const pptx = new PptxGenJS()
pptx.layout = 'LAYOUT_WIDE'
pptx.author = 'Room Planner'
pptx.company = 'Room Planner'
pptx.subject = 'Room Planner portfolio'
pptx.title = 'Room Planner Portfolio'
pptx.lang = 'ko-KR'
pptx.theme = {
  headFontFace: 'Malgun Gothic',
  bodyFontFace: 'Malgun Gothic',
  lang: 'ko-KR',
}
pptx.defineLayout({ name: 'LAYOUT_WIDE', width: 13.333, height: 7.5 })

const C = {
  bg: 'F7F9FC',
  bg2: 'EEF4FB',
  ink: '111827',
  muted: '5F6B7A',
  sub: '8A97A8',
  line: 'D7E0EA',
  card: 'FFFFFF',
  blue: '0878E6',
  blueDark: '075CB4',
  blueSoft: 'EAF4FF',
  dark: '1F242B',
  navy: '102033',
  green: '10A37F',
  amber: 'F59E0B',
}

function imageSize(file) {
  const buffer = fs.readFileSync(file)
  return {
    w: buffer.readUInt32BE(16),
    h: buffer.readUInt32BE(20),
  }
}

function addText(slide, value, x, y, w, h, opt = {}) {
  slide.addText(value, {
    x,
    y,
    w,
    h,
    fontFace: 'Malgun Gothic',
    fontSize: opt.size ?? 14,
    bold: opt.bold ?? false,
    color: opt.color ?? C.ink,
    align: opt.align ?? 'left',
    valign: opt.valign ?? 'mid',
    margin: opt.margin ?? 0,
    fit: opt.fit ?? 'shrink',
    breakLine: false,
  })
}

function addCard(slide, x, y, w, h, opt = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: opt.radius ?? 0.14,
    fill: { color: opt.fill ?? C.card, transparency: opt.transparency ?? 0 },
    line: { color: opt.line ?? C.line, pt: opt.pt ?? 0.8, transparency: opt.lineTrans ?? 0 },
    shadow: opt.shadow === false
      ? undefined
      : {
          type: 'outer',
          color: 'BCC8D6',
          opacity: 0.15,
          blur: 2,
          angle: 45,
          distance: 1,
        },
  })
}

function addFitImage(slide, file, x, y, w, h, opt = {}) {
  const { w: iw0, h: ih0 } = imageSize(file)
  const scale = opt.cover ? Math.max(w / iw0, h / ih0) : Math.min(w / iw0, h / ih0)
  const iw = iw0 * scale
  const ih = ih0 * scale
  if (opt.frame !== false) addCard(slide, x, y, w, h, { fill: opt.fill ?? C.card, radius: opt.radius ?? 0.18 })
  slide.addImage({
    path: file,
    x: x + (w - iw) / 2,
    y: y + (h - ih) / 2,
    w: iw,
    h: ih,
  })
}

function header(slide, no, title, subtitle = '') {
  slide.background = { color: C.bg }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0.09,
    w: 13.333,
    h: 1.34,
    fill: { color: 'FFFFFF', transparency: 0 },
    line: { transparency: 100 },
  })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 0.09,
    fill: { color: C.blue },
    line: { transparency: 100 },
  })
  addText(slide, 'ROOM PLANNER', 0.52, 0.24, 2.4, 0.24, {
    size: 10,
    bold: true,
    color: C.blue,
  })
  addText(slide, title, 0.52, 0.52, 9.8, 0.54, {
    size: 28,
    bold: true,
  })
  if (subtitle) {
    addText(slide, subtitle, 0.56, 1.1, 9.4, 0.3, {
      size: 14,
      color: C.muted,
    })
  }
  addText(slide, String(no).padStart(2, '0'), 12.0, 0.44, 0.75, 0.28, {
    size: 14,
    bold: true,
    color: C.blue,
    align: 'center',
  })
  slide.addShape(pptx.ShapeType.line, {
    x: 0.52,
    y: 1.35,
    w: 12.2,
    h: 0,
    line: { color: C.line, pt: 1 },
  })
}

function pill(slide, value, x, y, w, opt = {}) {
  addCard(slide, x, y, w, 0.34, {
    fill: opt.fill ?? C.blueSoft,
    lineTrans: 100,
    shadow: false,
    radius: 0.12,
  })
  addText(slide, value, x, y + 0.02, w, 0.28, {
    size: 10,
    bold: true,
    color: opt.color ?? C.blue,
    align: 'center',
  })
}

function coverSlide() {
  const slide = pptx.addSlide()
  slide.background = { color: C.navy }
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    fill: { color: C.navy },
    line: { transparency: 100 },
  })
  addFitImage(slide, img.hero, 6.0, 0.58, 6.75, 5.78, { frame: false })
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 5.72,
    y: 0.48,
    w: 6.9,
    h: 6.02,
    rectRadius: 0.2,
    fill: { color: '000000', transparency: 88 },
    line: { color: 'FFFFFF', transparency: 72, pt: 1 },
  })
  slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.13, h: 7.5, fill: { color: C.blue }, line: { transparency: 100 } })
  slide.addShape(pptx.ShapeType.rect, { x: 0.13, y: 0, w: 0.05, h: 7.5, fill: { color: C.green }, line: { transparency: 100 } })
  addText(slide, 'ROOM PLANNER', 0.82, 0.86, 3.2, 0.28, {
    size: 14,
    bold: true,
    color: '77B9FF',
  })
  addText(slide, '원룸 배치\n2D/3D 플래너', 0.8, 1.34, 4.8, 1.55, {
    size: 42,
    bold: true,
    color: 'FFFFFF',
    valign: 'top',
  })
  addText(slide, '가구 배치, 3D 미리보기, 추천 검색 흐름까지 연결한 공간 배치 웹 서비스', 0.84, 3.35, 4.9, 0.62, {
    size: 18,
    color: 'D8E3F0',
    valign: 'top',
  })
  pill(slide, 'React', 0.84, 4.18, 0.9, { fill: C.blue, color: 'FFFFFF' })
  pill(slide, 'Spring Boot', 1.92, 4.18, 1.25)
  pill(slide, 'Three.js', 3.34, 4.18, 1.0)
  addCard(slide, 0.82, 5.02, 4.8, 0.86, { fill: '172B42', line: '2E4764', shadow: false })
  addText(slide, '핵심 흐름', 1.12, 5.2, 1.1, 0.22, { size: 12, bold: true, color: '77B9FF' })
  addText(slide, '프로젝트 생성 → 2D 편집 → 3D 확인 → 추천 검색', 2.18, 5.2, 3.1, 0.22, { size: 11.4, color: 'E5EEF8' })
}

function overviewSlide() {
  const slide = pptx.addSlide()
  header(slide, 2, '프로젝트 개요', '원룸 가구 배치를 빠르게 만들고 결과를 확인하는 서비스')

  const cards = [
    ['문제', '원룸은 공간이 좁아 가구 배치 실패 비용이 큽니다. 구매 전 배치와 동선을 먼저 확인할 수 있어야 합니다.'],
    ['해결', '사용자가 방 크기를 고르고, 가구를 배치한 뒤 2D와 3D로 같은 결과를 확인하게 만들었습니다.'],
    ['확장', '배치 상태를 분석해 부족한 가구를 추천하고, 상품 검색까지 이어지는 흐름을 구성했습니다.'],
  ]

  cards.forEach(([title, body], index) => {
    const x = 0.75 + index * 4.13
    addCard(slide, x, 1.72, 3.65, 2.05, { fill: index === 1 ? C.blueSoft : C.card, radius: 0.18 })
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.28,
      y: 1.95,
      w: 0.44,
      h: 0.44,
      fill: { color: index === 0 ? C.amber : index === 1 ? C.blue : C.green },
      line: { transparency: 100 },
    })
    addText(slide, String(index + 1), x + 0.28, 2.03, 0.44, 0.14, {
      size: 10,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    })
    addText(slide, title, x + 0.88, 2.0, 1.0, 0.25, {
      size: 20,
      bold: true,
      color: index === 1 ? C.blue : C.ink,
    })
    addText(slide, body, x + 0.32, 2.54, 2.95, 0.78, {
      size: 15,
      color: C.muted,
      valign: 'top',
    })
  })

  addFitImage(slide, img.projectManage, 1.05, 4.15, 11.1, 2.62)
}

function flowSlide() {
  const slide = pptx.addSlide()
  header(slide, 3, '사용자 흐름', '회원가입부터 배치 결과 확인까지 하나의 서비스 흐름으로 연결')

  const steps = [
    ['01', '로그인', '이메일 / 소셜 로그인'],
    ['02', '프로필', '사용자 정보 저장'],
    ['03', '원룸 생성', '평수 선택 후 시작'],
    ['04', '2D 편집', '가구 배치와 조작'],
    ['05', '3D 확인', '공간감 있는 미리보기'],
    ['06', '추천 검색', '부족한 가구 추천'],
  ]

  steps.forEach(([no, title, body], index) => {
    const x = 0.7 + (index % 3) * 4.15
    const y = 1.72 + Math.floor(index / 3) * 1.72
    addCard(slide, x, y, 3.55, 1.22, { fill: index >= 3 ? C.blueSoft : C.card, radius: 0.18 })
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + 0.22,
      y: y + 0.26,
      w: 0.58,
      h: 0.58,
      fill: { color: index >= 3 ? C.blue : C.navy },
      line: { transparency: 100 },
    })
    addText(slide, no, x + 0.22, y + 0.39, 0.58, 0.18, {
      size: 16,
      bold: true,
      color: 'FFFFFF',
      align: 'center',
    })
    addText(slide, title, x + 0.9, y + 0.2, 1.9, 0.32, { size: 20, bold: true })
    addText(slide, body, x + 0.9, y + 0.68, 2.25, 0.28, { size: 13, color: C.muted })
  })

  addCard(slide, 1.25, 6.05, 10.8, 0.55, { fill: C.card, shadow: false })
  addText(slide, '각 화면은 독립된 기능이 아니라, 실제 사용자가 원룸을 만들고 배치를 완성하는 흐름으로 이어집니다.', 1.55, 6.18, 10.2, 0.22, {
    size: 15,
    color: C.muted,
    align: 'center',
  })
}

function screenSlide(no, title, subtitle, file, points, options = {}) {
  const slide = pptx.addSlide()
  header(slide, no, title, subtitle)

  if (options.smallImage) {
    addCard(slide, 0.72, 1.58, 4.88, 5.22, { fill: 'FFFFFF', radius: 0.2, pt: 1.2 })
    addFitImage(slide, file, 0.9, 1.78, 4.52, 4.82, { frame: false })
    addCard(slide, 5.88, 1.9, 6.05, 4.05, { fill: C.card, radius: 0.2 })
    slide.addShape(pptx.ShapeType.rect, {
      x: 5.88,
      y: 1.9,
      w: 0.12,
      h: 4.05,
      fill: { color: C.blue },
      line: { transparency: 100 },
    })
    addText(slide, '구현 포인트', 6.32, 2.24, 2.6, 0.36, {
      size: 22,
      bold: true,
      color: C.blue,
    })
    points.forEach((point, index) => {
      slide.addShape(pptx.ShapeType.ellipse, {
        x: 6.34,
        y: 3.08 + index * 0.62,
        w: 0.16,
        h: 0.16,
        fill: { color: C.green },
        line: { transparency: 100 },
      })
      addText(slide, point, 6.62, 3.0 + index * 0.62, 4.8, 0.34, {
        size: 17,
        color: C.ink,
      })
    })
    return
  }

  addCard(slide, 0.5, 1.48, 12.32, 4.92, { fill: 'FFFFFF', radius: 0.2, pt: 1.2 })
  slide.addShape(pptx.ShapeType.rect, {
    x: 0.68,
    y: 1.66,
    w: 11.96,
    h: 0.25,
    fill: { color: C.bg2 },
    line: { transparency: 100 },
  })
  slide.addShape(pptx.ShapeType.ellipse, { x: 0.86, y: 1.75, w: 0.07, h: 0.07, fill: { color: 'FF5F57' }, line: { transparency: 100 } })
  slide.addShape(pptx.ShapeType.ellipse, { x: 1.02, y: 1.75, w: 0.07, h: 0.07, fill: { color: 'FFBD2E' }, line: { transparency: 100 } })
  slide.addShape(pptx.ShapeType.ellipse, { x: 1.18, y: 1.75, w: 0.07, h: 0.07, fill: { color: '28C840' }, line: { transparency: 100 } })
  addFitImage(slide, file, 0.7, 1.9, 11.92, 4.28, { frame: false })
  addCard(slide, 0.7, 6.5, 11.95, 0.6, { fill: C.navy, lineTrans: 100, shadow: false, radius: 0.14 })
  addText(slide, points.join('   ·   '), 1.0, 6.65, 11.35, 0.24, {
    size: 13.5,
    color: 'EAF4FF',
    align: 'center',
  })
}

function implementationSlide() {
  const slide = pptx.addSlide()
  header(slide, 13, '구현 포인트', '코드 설명에서 강조하기 좋은 기술적 선택')

  const items = [
    ['2D/3D 상태 공유', '가구 위치, 회전, 크기, 방 크기를 하나의 레이아웃 데이터로 관리해 화면 전환 시 상태가 유지됩니다.'],
    ['편집 로직 분리', '가구 추가, 이동, 삭제, 복제 같은 기능을 planner 모듈과 hook으로 분리했습니다.'],
    ['사용자별 저장', '로그인 사용자 기준으로 작업공간 상태를 저장하고 다시 불러오는 흐름을 구성했습니다.'],
    ['추천 흐름 구현', '배치 상태를 분석해 부족한 가구를 추천하고 외부 상품 검색으로 연결했습니다.'],
  ]

  items.forEach(([head, body], index) => {
    const x = 0.82 + (index % 2) * 5.95
    const y = 1.55 + Math.floor(index / 2) * 2.02
    addCard(slide, x, y, 5.35, 1.48, { fill: index === 0 || index === 3 ? C.blueSoft : C.card })
    addText(slide, head, x + 0.3, y + 0.24, 2.8, 0.28, {
      size: 20,
      bold: true,
      color: C.blue,
    })
    addText(slide, body, x + 0.3, y + 0.73, 4.65, 0.44, {
      size: 14.5,
      color: C.muted,
      valign: 'top',
    })
  })
}

function techSlide() {
  const slide = pptx.addSlide()
  header(slide, 14, '기술 스택', '프론트엔드, 백엔드, 3D 렌더링을 함께 구성')

  const groups = [
    ['Frontend', ['React', 'JavaScript', 'HTML', 'CSS', 'Vite']],
    ['3D / Canvas', ['Three.js', '@react-three/fiber', 'camera mode', 'tour view']],
    ['Backend', ['Java', 'Spring Boot', 'Spring Security', 'REST API']],
    ['Data / Auth', ['MySQL', 'JSON workspace', 'OAuth2', 'Email verification']],
  ]

  groups.forEach(([head, tags], index) => {
    const x = 0.9 + (index % 2) * 5.85
    const y = 1.55 + Math.floor(index / 2) * 2.1
    addCard(slide, x, y, 5.1, 1.52, { fill: index === 1 ? C.blueSoft : C.card })
    addText(slide, head, x + 0.32, y + 0.22, 2.5, 0.34, { size: 21, bold: true, color: C.blue })
    tags.forEach((tag, tagIndex) => {
      pill(slide, tag, x + 0.32 + (tagIndex % 3) * 1.45, y + 0.82 + Math.floor(tagIndex / 3) * 0.44, 1.18)
    })
  })
}

function closingSlide() {
  const slide = pptx.addSlide()
  slide.background = { color: C.dark }
  addFitImage(slide, img.tour, 6.6, 0.8, 5.7, 5.55, { frame: false })
  addText(slide, '결과', 0.85, 0.9, 1.8, 0.42, { size: 28, bold: true, color: '77B9FF' })
  addText(slide, '원룸 생성부터\n2D/3D 배치,\n추천 검색까지', 0.85, 1.55, 4.8, 1.65, {
    size: 38,
    bold: true,
    color: 'FFFFFF',
    valign: 'top',
  })
  addText(slide, '단순 CRUD가 아니라 사용자가 직접 배치하고 결과를 확인하는 인터랙티브 서비스 흐름을 구현했습니다.', 0.9, 3.75, 4.85, 0.58, {
    size: 17,
    color: 'D8E3F0',
    valign: 'top',
  })
  pill(slide, 'Project', 0.9, 5.0, 0.95, { fill: C.blue, color: 'FFFFFF' })
  pill(slide, 'Editor', 2.02, 5.0, 0.95)
  pill(slide, '3D View', 3.14, 5.0, 1.0)
  pill(slide, 'AI Pick', 4.32, 5.0, 1.0)
}

coverSlide()
overviewSlide()
flowSlide()
screenSlide(4, '로그인 / 회원가입', '이메일 인증과 소셜 로그인 진입 화면', img.login, ['이메일 로그인', '소셜 로그인 CTA', '회원가입 / 비밀번호 재설정 연결'], { smallImage: true })
screenSlide(5, '프로필 등록', '사용자 기본 정보 저장 및 주소 검색 흐름', img.profile, ['이름, 연락처, 주소 등록', '주소 검색 연동', '최초 로그인 후 정보 보완'])
screenSlide(6, '홈 화면', '새 원룸 시작과 최근 작업 이어가기', img.home, ['새 원룸 만들기', '최근 프로젝트 이어가기', '계정 / 프로젝트 이동'])
screenSlide(7, '원룸 프로젝트 생성', '7평부터 10평까지 템플릿 기반으로 빠르게 시작', img.projectStart, ['평수별 템플릿', '바로 시작', '프로젝트 생성'])
screenSlide(8, '프로젝트 관리', '최근 꾸민 원룸과 선택 프로젝트 상세 관리', img.projectManage, ['최근 프로젝트 목록', '프로젝트 정보 수정', '꾸미기 계속하기'])
screenSlide(9, '2D 배치 편집', '가구 선택, 이동, 회전, 크기 조절 중심의 편집 화면', img.editor2d, ['가구 카탈로그', '2D 배치 조작', '상태 요약 / AI Pick'])
screenSlide(10, '3D 미리보기', '2D 배치 데이터를 3D 공간으로 시각화', img.editor3d, ['같은 배치 데이터 사용', '3D 공간 확인', '가구 높이 보정'])
screenSlide(11, '투어 보기', '사용자 시점에서 원룸 내부를 둘러보는 화면', img.tour, ['투어 카메라', '사용자 시점', '편집 모드와 분리'])
screenSlide(12, 'AI Pick / 상품 검색', '배치 상태 기반 추천과 외부 상품 검색 연결', img.aiPick, ['부족한 가구 추천', '추천 사유 표시', '상품 검색 연결'], { smallImage: true })
implementationSlide()
techSlide()
closingSlide()

try {
  await pptx.writeFile({ fileName: docsFile })
  console.log(`Updated ${docsFile}`)
} catch (error) {
  if (error?.code !== 'EBUSY') throw error
  await pptx.writeFile({ fileName: fallbackDocsFile })
  console.log(`Target file is open. Wrote ${fallbackDocsFile}`)
}
