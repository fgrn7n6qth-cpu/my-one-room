export function getCatalogGroup(item) {
  if (['desk', 'chair', 'computer', 'monitorArm', 'laptop', 'speaker', 'tableLamp'].includes(item.type)) return '작업'
  if (['bed', 'bedside', 'sofa', 'beanbag', 'rug', 'cushion', 'sideTable', 'stool', 'tv'].includes(item.type)) return '휴식'
  if (['dresser', 'wardrobe', 'bookcase', 'storage', 'shelf', 'openShelf', 'miniBookcase', 'shoeCabinet', 'hanger', 'wallShelf', 'trolley', 'microwaveStand', 'laundryBasket', 'vacuumDock'].includes(item.type)) return '수납'
  if (['fridge', 'microwave', 'washer', 'portableAc', 'wallMountedAc', 'fan', 'circulator', 'freezer', 'riceCooker', 'coffeeMachine', 'airPurifier'].includes(item.type)) return '가전'
  if (['lamp', 'curtain', 'blind', 'mirror', 'vanity', 'plant', 'poster', 'wallClock', 'makeupOrganizer'].includes(item.type)) return '분위기'
  return '기타'
}

export function getFilteredCatalogItems({
  items,
  query,
  catalogGroup,
  favoriteCatalogIds,
  styleRecommendation,
}) {
  const q = query.trim()
  const recIds = styleRecommendation.itemIds ?? []

  return items
    .filter((item) => {
      const match = q.length === 0
        ? true
        : item.name.includes(q) || item.finish.includes(q) || (item.brand ?? '').includes(q) || (item.materialLabel ?? '').includes(q)
      const groupMatch = catalogGroup === '전체'
        ? true
        : catalogGroup === '즐겨찾기'
          ? favoriteCatalogIds.includes(item.id)
          : getCatalogGroup(item) === catalogGroup
      return match && groupMatch
    })
    .sort((a, b) => {
      const scoreA =
        (a.category === styleRecommendation.category ? 4 : 0) +
        (recIds.includes(a.id) ? 10 - recIds.indexOf(a.id) : 0) +
        (favoriteCatalogIds.includes(a.id) ? 8 : 0)
      const scoreB =
        (b.category === styleRecommendation.category ? 4 : 0) +
        (recIds.includes(b.id) ? 10 - recIds.indexOf(b.id) : 0) +
        (favoriteCatalogIds.includes(b.id) ? 8 : 0)
      return scoreB - scoreA
    })
}
