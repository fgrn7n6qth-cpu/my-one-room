export const ROOM_PRESETS = [
  {
    id: 'studio',
    name: '원룸',
    description: '작은 공간에 수납과 동선을 우선한 배치',
    room: {
      width: 4.2,
      depth: 4.8,
      height: 2.6,
    },
    placements: [
      { catalogId: 'lounge-chair', position: [-1.2, 0, -1.2], rotation: 0 },
      { catalogId: 'cube-shelf', position: [1.3, 0, -1.6], rotation: 0 },
      { catalogId: 'utility-trolley', position: [1.1, 0, 1.1], rotation: 0 },
    ],
  },
  {
    id: 'lounge',
    name: '라운지',
    description: '중앙 시야와 여유 있는 배치를 강조한 구성',
    room: {
      width: 6.8,
      depth: 5.6,
      height: 2.9,
    },
    placements: [
      { catalogId: 'lounge-chair', position: [-1.4, 0, -0.8], rotation: 0 },
      { catalogId: 'lounge-chair', position: [1.4, 0, -0.8], rotation: Math.PI },
      { catalogId: 'cube-shelf', position: [0, 0, 1.7], rotation: Math.PI },
      { catalogId: 'utility-trolley', position: [2, 0, 1], rotation: -Math.PI / 2 },
    ],
  },
  {
    id: 'study',
    name: '스터디',
    description: '벽면 수납과 작업 동선을 중심으로 한 배치',
    room: {
      width: 5.2,
      depth: 5.4,
      height: 2.7,
    },
    placements: [
      { catalogId: 'slim-bookcase', position: [-2, 0, 0], rotation: Math.PI / 2 },
      { catalogId: 'cube-shelf', position: [1.2, 0, -1.6], rotation: 0 },
      { catalogId: 'lounge-chair', position: [0.8, 0, 1.1], rotation: -Math.PI / 2 },
      { catalogId: 'utility-trolley', position: [1.8, 0, 1.4], rotation: 0 },
    ],
  },
]
