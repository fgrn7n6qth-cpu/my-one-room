import referenceRoomImage from '../assets/reference-room.jpg'

export { defaultDecorVisibility } from './styleTokens.js'

export const stylePresets = [
  {
    id: 'minimal-living',
    name: '기본 구성',
    detail: '가구 배치와 동선을 안정적으로 시작하기 좋은 기본 구성입니다.',
    eyebrow: 'Layout',
    tag: '기본',
    summary: '소파와 테이블이 균형 있게 놓인 기본 구성',
    image: referenceRoomImage,
  },
  {
    id: 'natural-studio',
    name: '밝은 구성',
    detail: '조금 더 편안하고 밝은 톤으로 공간을 시작하는 구성입니다.',
    eyebrow: 'Layout',
    tag: '밝은 톤',
    summary: '차분한 톤과 부드러운 배치가 중심인 구성',
    image: referenceRoomImage,
  },
  {
    id: 'modern-dining',
    name: '진한 구성',
    detail: '대비감 있는 재질과 포인트가 보이는 구성입니다.',
    eyebrow: 'Layout',
    tag: '진한 톤',
    summary: '조명과 가구 대비가 살아있는 구성',
    image: referenceRoomImage,
  },
]

export const decorThemes = {
  'minimal-living': {
    accent: '#d8c46d',
    greenery: '#81906d',
    dark: '#1f1e1b',
    upholstery: '#efe7dc',
    wood: '#b48d63',
    stone: '#d7d0c6',
  },
  'natural-studio': {
    accent: '#b99162',
    greenery: '#718565',
    dark: '#28251f',
    upholstery: '#e7dece',
    wood: '#9c7751',
    stone: '#d5ccbf',
  },
  'modern-dining': {
    accent: '#aa9477',
    greenery: '#6f8062',
    dark: '#17181a',
    upholstery: '#f2ede5',
    wood: '#7f6247',
    stone: '#d8d2ca',
  },
}

export const styleCatalogRecommendations = {
  'minimal-living': { category: '거실', itemIds: [], label: '' },
  'natural-studio': { category: '침실', itemIds: [], label: '' },
  'modern-dining': { category: '다이닝', itemIds: [], label: '' },
}

export function getDecorTheme(styleId) {
  return decorThemes[styleId] ?? decorThemes['minimal-living']
}

export function getStylePresetById(styleId) {
  return stylePresets.find((style) => style.id === styleId) ?? stylePresets[0]
}

export function getDecorLayoutVariant(styleId) {
  if (styleId === 'natural-studio') {
    return {
      rugOffset: { x: -0.08, z: 0.06 },
      mediaWallShift: -0.16,
      plantShift: { x: -0.1, z: 0.04 },
      kitchenShift: { x: -0.1, z: 0.08 },
      entryShift: { x: 0, z: -0.08 },
      bathShift: { x: -0.05, z: 0.06 },
      chairSpread: 0.06,
    }
  }
  if (styleId === 'modern-dining') {
    return {
      rugOffset: { x: 0.12, z: 0.02 },
      mediaWallShift: 0.12,
      plantShift: { x: 0.08, z: -0.04 },
      kitchenShift: { x: 0.04, z: -0.1 },
      entryShift: { x: -0.04, z: 0.04 },
      bathShift: { x: 0.04, z: -0.06 },
      chairSpread: 0.1,
    }
  }
  return {
    rugOffset: { x: 0, z: 0 },
    mediaWallShift: 0,
    plantShift: { x: 0, z: 0 },
    kitchenShift: { x: 0, z: 0 },
    entryShift: { x: 0, z: 0 },
    bathShift: { x: 0, z: 0 },
    chairSpread: 0,
  }
}
