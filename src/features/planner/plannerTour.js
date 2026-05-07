export function getCameraPresetStatus(preset) {
  return {
    living: '소파 시점',
    bedroom: '침실 시점',
    editorial: '블로그 구도',
  }[preset]
}

export function getTourViewpointLabel(viewpoints, viewId) {
  return viewpoints.find((item) => item.id === viewId)?.label ?? '투어'
}
