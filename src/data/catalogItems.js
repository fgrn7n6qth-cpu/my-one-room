import { furnitureTypeLabels, furnitureSceneLabels } from './furniture.js'
import referenceRoomImage from '../assets/reference-room.jpg'

const rawCatalogItems = [
  { id: 1, name: '모듈 소파', category: '가구', type: 'sofa', brand: 'RoomPlanner', finish: '차콜 패브릭', image: referenceRoomImage, swatches: ['#232323', '#4d4d4d', '#b9b7b3'] },
  { id: 2, name: '원형 테이블', category: '가구', type: 'table', brand: 'RoomPlanner', finish: '월넛 우드', image: referenceRoomImage, swatches: ['#2d2b2a', '#7f7a74', '#d6d2cb'] },
  { id: 3, name: '라운지 의자', category: '가구', type: 'chair', brand: 'RoomPlanner', finish: '웜 그레이', image: referenceRoomImage, swatches: ['#272625', '#66615d', '#c9c4bc'] },
  { id: 4, name: '플랫폼 침대', category: '가구', type: 'bed', brand: 'RoomPlanner', finish: '스모크 우드', image: referenceRoomImage, swatches: ['#302c2a', '#756b64', '#d9d3cd'] },
  { id: 5, name: '슬림 서랍장', category: '수납', type: 'dresser', brand: 'RoomPlanner', finish: '매트 차콜', image: referenceRoomImage, swatches: ['#1f1f1f', '#5a5752', '#bdb7b0'] },
  { id: 6, name: '스탠드 조명', category: '조명', type: 'lamp', brand: 'RoomPlanner', finish: '브론즈', image: referenceRoomImage, swatches: ['#151515', '#4e4a46', '#d8d3cc'] },
  { id: 7, name: '오픈 책장', category: '수납', type: 'bookcase', brand: 'RoomPlanner', finish: '월넛 우드', image: referenceRoomImage, swatches: ['#222120', '#615d59', '#b8b2aa'] },
  { id: 8, name: '침대 협탁', category: '수납', type: 'bedside', brand: 'RoomPlanner', finish: '크림 베이지', image: referenceRoomImage, swatches: ['#262423', '#726d67', '#cec8c1'] },
  { id: 9, name: '작업 책상', category: '가구', type: 'desk', brand: 'RoomPlanner', finish: '월넛 상판', image: referenceRoomImage, swatches: ['#3b332d', '#d8cec1', '#9f7f5f'] },
  { id: 10, name: '데스크 의자', category: '가구', type: 'chair', brand: 'RoomPlanner', finish: '소프트 그레이', image: referenceRoomImage, swatches: ['#2a2928', '#d7d0c7', '#8d857c'] },
  { id: 11, name: '데스크탑 컴퓨터', category: '가전', type: 'computer', brand: 'RoomPlanner', finish: '실버 메탈', image: referenceRoomImage, swatches: ['#3a4048', '#d7dce2', '#7d8792'] },
  { id: 12, name: '와이드 서랍장', category: '수납', type: 'dresser', brand: 'RoomPlanner', finish: '웜 베이지', image: referenceRoomImage, swatches: ['#49423c', '#ddd3c6', '#a58a70'] },
  { id: 13, name: '웜톤 러그', category: '패브릭', type: 'rug', brand: 'RoomPlanner', finish: '샌드 베이지', image: referenceRoomImage, swatches: ['#c8beb1', '#e9dfd1', '#9d8b75'] },
  { id: 14, name: '이동식 TV', category: '가전', type: 'tv', brand: 'RoomPlanner', finish: '매트 화이트', image: referenceRoomImage, swatches: ['#f2eee8', '#ffffff', '#868f98'] },
  { id: 15, name: '미니 화장대', category: '가구', type: 'vanity', brand: 'RoomPlanner', finish: '크림 우드', image: referenceRoomImage, swatches: ['#cfc3b3', '#eee6db', '#9a8369'] },
  { id: 16, name: '원룸 냉장고', category: '가전', type: 'fridge', brand: 'RoomPlanner', finish: '오프화이트', image: referenceRoomImage, swatches: ['#dfe2e4', '#f6f7f7', '#aab1b7'] },
  { id: 17, name: '전자레인지', category: '가전', type: 'microwave', brand: 'RoomPlanner', finish: '실버', image: referenceRoomImage, swatches: ['#545d66', '#d9dde0', '#88919a'] },
  { id: 18, name: '행거', category: '수납', type: 'hanger', brand: 'RoomPlanner', finish: '아이보리 메탈', image: referenceRoomImage, swatches: ['#e8e1d7', '#f7f2eb', '#9f968d'] },
  { id: 19, name: '전신거울', category: '가구', type: 'mirror', brand: 'RoomPlanner', finish: '오크 프레임', image: referenceRoomImage, swatches: ['#9a7c5f', '#f2f0eb', '#d2c6b4'] },
  { id: 20, name: '2단 선반', category: '수납', type: 'shelf', brand: 'RoomPlanner', finish: '샌드 우드', image: referenceRoomImage, swatches: ['#7b6651', '#d9cbbd', '#b69f87'] },
  { id: 21, name: '작은 사이드 테이블', category: '가구', type: 'sideTable', brand: 'RoomPlanner', finish: '크림 스톤', image: referenceRoomImage, swatches: ['#d0c4b6', '#efe7dc', '#867767'] },
  { id: 22, name: '스툴', category: '가구', type: 'stool', brand: 'RoomPlanner', finish: '웜 베이지', image: referenceRoomImage, swatches: ['#bba892', '#e6d8c8', '#8c745f'] },
  { id: 23, name: '커튼', category: '패브릭', type: 'curtain', brand: 'RoomPlanner', finish: '아이보리 린넨', image: referenceRoomImage, swatches: ['#d7cec2', '#f7f2ea', '#b9ab9a'] },
  { id: 24, name: '블라인드', category: '패브릭', type: 'blind', brand: 'RoomPlanner', finish: '소프트 그레이지', image: referenceRoomImage, swatches: ['#bfb7ad', '#f0ebe3', '#938a7f'] },
  { id: 25, name: '세탁기', category: '가전', type: 'washer', brand: 'RoomPlanner', finish: '클린 화이트', image: referenceRoomImage, swatches: ['#dfe5ea', '#fafcff', '#aeb5bb'] },
  { id: 26, name: '전자레인지 수납장', category: '수납', type: 'microwaveStand', brand: 'RoomPlanner', finish: '내추럴 우드', image: referenceRoomImage, swatches: ['#7d6855', '#e8dccf', '#a48768'] },
  { id: 27, name: '모니터암', category: '가전', type: 'monitorArm', brand: 'RoomPlanner', finish: '매트 블랙', image: referenceRoomImage, swatches: ['#2a2c2f', '#9fa6ad', '#666c73'] },
  { id: 28, name: '노트북', category: '가전', type: 'laptop', brand: 'RoomPlanner', finish: '실버', image: referenceRoomImage, swatches: ['#b4bcc5', '#edf2f6', '#848c95'] },
  { id: 29, name: '탁상 조명', category: '조명', type: 'tableLamp', brand: 'RoomPlanner', finish: '브러시드 스틸', image: referenceRoomImage, swatches: ['#56606a', '#ece5da', '#9a856d'] },
  { id: 30, name: '빈백', category: '가구', type: 'beanbag', brand: 'RoomPlanner', finish: '오트밀 패브릭', image: referenceRoomImage, swatches: ['#b8aa98', '#ede3d6', '#8a7966'] },
  { id: 31, name: '오픈형 수납장', category: '수납', type: 'openShelf', brand: 'RoomPlanner', finish: '월넛 브라운', image: referenceRoomImage, swatches: ['#5f4f43', '#cfc3b7', '#977c63'] },
  { id: 32, name: '빨래바구니', category: '수납', type: 'laundryBasket', brand: 'RoomPlanner', finish: '내추럴 패브릭', image: referenceRoomImage, swatches: ['#b5ab9c', '#ece5da', '#877c71'] },
  { id: 33, name: '신발장', category: '수납', type: 'shoeCabinet', brand: 'RoomPlanner', finish: '웜 화이트', image: referenceRoomImage, swatches: ['#c9c0b5', '#f2ede7', '#95877a'] },
  { id: 34, name: '벽선반', category: '수납', type: 'wallShelf', brand: 'RoomPlanner', finish: '라이트 우드', image: referenceRoomImage, swatches: ['#9d8267', '#e8dccd', '#77614e'] },
  { id: 35, name: '사이드 트롤리', category: '수납', type: 'trolley', brand: 'RoomPlanner', finish: '소프트 화이트', image: referenceRoomImage, swatches: ['#d5d8da', '#f5f6f7', '#97a0a6'] },
  { id: 36, name: '공기청정기', category: '가전', type: 'airPurifier', brand: 'RoomPlanner', finish: '미스트 화이트', image: referenceRoomImage, swatches: ['#d9dee3', '#fafbfd', '#aab0b6'] },
  { id: 37, name: '식물', category: '데코', type: 'plant', brand: 'RoomPlanner', finish: '세이지 그린', image: referenceRoomImage, swatches: ['#6c7f65', '#bdcdb8', '#8b765a'] },
  { id: 38, name: '쿠션', category: '패브릭', type: 'cushion', brand: 'RoomPlanner', finish: '소프트 베이지', image: referenceRoomImage, swatches: ['#b7a493', '#e8ddd2', '#8a7868'] },
  { id: 39, name: '포스터', category: '데코', type: 'poster', brand: 'RoomPlanner', finish: '모던 아트', image: referenceRoomImage, swatches: ['#474342', '#f7f3ed', '#b69a7f'] },
  { id: 40, name: '벽시계', category: '데코', type: 'wallClock', brand: 'RoomPlanner', finish: '매트 아이보리', image: referenceRoomImage, swatches: ['#d5cabd', '#f7f3ed', '#7f7267'] },
  { id: 41, name: '미니 책장', category: '수납', type: 'miniBookcase', brand: 'RoomPlanner', finish: '샌드 우드', image: referenceRoomImage, swatches: ['#725f4b', '#d8ccb9', '#927962'] },
  { id: 42, name: '화장품 수납함', category: '데코', type: 'makeupOrganizer', brand: 'RoomPlanner', finish: '클리어', image: referenceRoomImage, swatches: ['#c9d2d8', '#f7fafc', '#9ea9b0'] },
  { id: 43, name: '휴지통', category: '생활', type: 'trashCan', brand: 'RoomPlanner', finish: '웜 그레이', image: referenceRoomImage, swatches: ['#8a8d91', '#dadbdd', '#63666a'] },
  { id: 44, name: '청소기 거치대', category: '생활', type: 'vacuumDock', brand: 'RoomPlanner', finish: '매트 화이트', image: referenceRoomImage, swatches: ['#d9dfe5', '#ffffff', '#99a3ad'] },
  { id: 45, name: '이동식 에어컨', category: '가전', type: 'portableAc', brand: 'RoomPlanner', finish: '오프화이트', image: referenceRoomImage, swatches: ['#dce3e8', '#f9fcff', '#9aa5ae'] },
  { id: 46, name: '선풍기', category: '가전', type: 'fan', brand: 'RoomPlanner', finish: '웜 화이트', image: referenceRoomImage, swatches: ['#d6d6d2', '#ffffff', '#93979d'] },
  { id: 47, name: '서큘레이터', category: '가전', type: 'circulator', brand: 'RoomPlanner', finish: '소프트 화이트', image: referenceRoomImage, swatches: ['#d7dcdf', '#ffffff', '#87919a'] },
  { id: 48, name: '미니 냉동고', category: '가전', type: 'freezer', brand: 'RoomPlanner', finish: '클린 화이트', image: referenceRoomImage, swatches: ['#dfe4e8', '#f9fbfd', '#a2a9af'] },
  { id: 49, name: '전기밥솥', category: '가전', type: 'riceCooker', brand: 'RoomPlanner', finish: '쿨 화이트', image: referenceRoomImage, swatches: ['#d7dfe5', '#fafcff', '#9ba3ab'] },
  { id: 50, name: '커피머신', category: '가전', type: 'coffeeMachine', brand: 'RoomPlanner', finish: '샌드 베이지', image: referenceRoomImage, swatches: ['#7f6a58', '#ddd0c0', '#ab9174'] },
  { id: 51, name: '스피커', category: '가전', type: 'speaker', brand: 'RoomPlanner', finish: '차콜', image: referenceRoomImage, swatches: ['#2a2a2a', '#5b5b5b', '#9d9d9d'] },
  { id: 52, name: '벽걸이 에어컨', category: '가전', type: 'wallMountedAc', brand: 'RoomPlanner', finish: '매트 화이트', image: referenceRoomImage, swatches: ['#edf1f4', '#ffffff', '#a6b1ba'] },
]

const catalogProductMeta = {}
const catalogImageOverrides = {}

export const catalogItems = rawCatalogItems.map((item) => ({
  ...item,
  ...(catalogImageOverrides[item.id] ?? {}),
  ...catalogProductMeta[item.id],
  typeLabel: furnitureTypeLabels[item.type] ?? item.category,
  sceneLabel: furnitureSceneLabels[item.type] ?? `${item.category} 추천`,
}))

export function getCatalogItemForFurniture(item) {
  if (!item) return null
  return (
    catalogItems.find((c) => c.id === item.catalogId) ??
    catalogItems.find((c) => c.name === item.name) ??
    null
  )
}

export function getFurniturePalette(item) {
  const catalogItem = getCatalogItemForFurniture(item)
  const swatches = catalogItem?.swatches ?? ['#d6d0c8', '#efe8df', '#7a5d42']
  return {
    catalogItem,
    shellColor: swatches[0] ?? '#d8d2c7',
    fabricColor: swatches[1] ?? '#f1ebe2',
    accentColor: swatches[2] ?? '#8b6b49',
    shadowRing: swatches[2] ?? '#8b6b49',
  }
}
