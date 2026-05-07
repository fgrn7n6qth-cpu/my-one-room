export const MODEL_ASSETS = {
  'lounge-chair': {
    path: '/models/lounge-chair.glb',
    scale: 1,
    rotationY: 0,
    offsetY: 0,
  },
  'slim-bookcase': {
    path: '/models/slim-bookcase.glb',
    scale: 1,
    rotationY: 0,
    offsetY: 0,
  },
  'cube-shelf': {
    path: '/models/cube-shelf.glb',
    scale: 1,
    rotationY: 0,
    offsetY: 0,
  },
  'utility-trolley': {
    path: '/models/utility-trolley.glb',
    scale: 1,
    rotationY: 0,
    offsetY: 0,
  },
}

export function getModelAsset(catalogId) {
  return MODEL_ASSETS[catalogId] ?? null
}
