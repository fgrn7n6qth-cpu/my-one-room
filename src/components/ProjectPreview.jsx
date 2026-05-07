import { defaultDecorVisibility, getDecorTheme, getStylePresetById, stylePresets } from '../data/styles.js'

export function ProjectThumbnail({ layout, variant = 'default' }) {
  const room = layout?.roomDimensions ?? { width: 5.6, depth: 4.2 }
  const furniture = layout?.placedFurniture ?? []
  const styleId = layout?.selectedStyleId ?? stylePresets[0].id
  const stylePreset = getStylePresetById(styleId)
  const decorTheme = getDecorTheme(styleId)
  const decorVisibility = { ...defaultDecorVisibility, ...(layout?.decorVisibility ?? {}) }
  const thumbMetrics = {
    default: { widthMin: 58, widthMax: 80, widthScale: 10.5, depthMin: 54, depthMax: 76, depthScale: 11.5, topMin: 12, bottomMin: 10 },
    hero: { widthMin: 64, widthMax: 86, widthScale: 11.8, depthMin: 60, depthMax: 82, depthScale: 13.2, topMin: 10, bottomMin: 10 },
    feature: { widthMin: 68, widthMax: 88, widthScale: 12.4, depthMin: 62, depthMax: 84, depthScale: 14.2, topMin: 8, bottomMin: 8 },
    recent: { widthMin: 68, widthMax: 88, widthScale: 12.4, depthMin: 62, depthMax: 84, depthScale: 14.2, topMin: 8, bottomMin: 8 },
    list: { widthMin: 70, widthMax: 88, widthScale: 12.8, depthMin: 64, depthMax: 86, depthScale: 14.6, topMin: 8, bottomMin: 8 },
    detail: { widthMin: 66, widthMax: 86, widthScale: 12, depthMin: 60, depthMax: 82, depthScale: 13.4, topMin: 10, bottomMin: 10 },
  }
  const metrics = thumbMetrics[variant] ?? thumbMetrics.default
  const widthPercent = Math.min(metrics.widthMax, Math.max(metrics.widthMin, room.width * metrics.widthScale))
  const depthPercent = Math.min(metrics.depthMax, Math.max(metrics.depthMin, room.depth * metrics.depthScale))
  const horizontalInset = (100 - widthPercent) / 2
  const topInset = Math.max(metrics.topMin, (100 - depthPercent) / 2)
  const bottomInset = Math.max(metrics.bottomMin, 100 - depthPercent - topInset)

  return (
    <div
      className={`project-thumb project-thumb-${variant} style-${styleId}`}
      style={{
        '--thumb-accent': decorTheme.accent,
        '--thumb-dark': decorTheme.dark,
        '--thumb-upholstery': decorTheme.upholstery,
        '--thumb-stone': decorTheme.stone,
      }}
    >
      <div className="project-thumb-style-badge">{stylePreset.name}</div>
      <div
        className="project-thumb-room"
        style={{ left: `${horizontalInset}%`, right: `${horizontalInset}%`, top: `${topInset}%`, bottom: `${bottomInset}%` }}
      >
        <div className="project-thumb-grid" />
        {decorVisibility.living ? <div className="project-thumb-zone thumb-zone-living" /> : null}
        {decorVisibility.dining ? <div className="project-thumb-zone thumb-zone-dining" /> : null}
        {decorVisibility.kitchen ? <div className="project-thumb-zone thumb-zone-kitchen" /> : null}
        {decorVisibility.entry ? <div className="project-thumb-zone thumb-zone-entry" /> : null}
        {decorVisibility.bath ? <div className="project-thumb-zone thumb-zone-bath" /> : null}
        {furniture.slice(0, 4).map((item) => (
          <span
            key={item.id}
            className={`project-thumb-item thumb-${item.type}`}
            style={{
              left: `${item.x ?? 18}%`,
              top: `${item.y ?? 24}%`,
              transform: `rotate(${item.rotation ?? 0}deg) scale(${Math.min(item.scale ?? 1, 1.2)})`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export function ProjectPreviewCard({ project, layout }) {
  const room = layout?.roomDimensions
  const furnitureCount = layout?.placedFurniture?.length ?? 0
  return (
    <div className="empty-state project-preview-card">
      <div className="project-preview-head">
        <div>
          <p className="section-kicker">편집 화면 미리보기</p>
          <strong>{project?.name}</strong>
        </div>
        <span className="project-preview-count">{furnitureCount}개 배치</span>
      </div>
      <ProjectThumbnail layout={layout} variant="detail" />
      <div className="project-preview-meta">
        <span>{project?.spaceType ?? '원룸'} 프로젝트</span>
        <span>{room ? `${room.width.toFixed(1)}m × ${room.depth.toFixed(1)}m` : '크기 준비됨'}</span>
        <span>{project?.privacy ?? '읽기 전용 링크'}</span>
      </div>
    </div>
  )
}

export function WorkspaceSteps({ steps = [] }) {
  return (
    <section className="workspace-steps" aria-label="화면 사용 순서">
      {steps.map((item) => (
        <article key={item.step} className="workspace-step-card">
          <span className="workspace-step-number">{item.step}</span>
          <div className="workspace-step-copy">
            <strong>{item.title}</strong>
            <p>{item.body}</p>
          </div>
        </article>
      ))}
    </section>
  )
}
