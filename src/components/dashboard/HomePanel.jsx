export default function HomePanel({
  projectCount,
  furnitureCount,
  onOpenStarterPicker,
  onResumeProject,
}) {
  return (
    <div className="ap-home">
      <section className="ap-stage">
        <article className="ap-stage-main">
          <div className="ap-stage-copy">
            <p className="ap-eyebrow">마이 원룸</p>
            <h1 className="ap-h1">내 원룸을 다시 꺼내, 차분하게 완성하세요.</h1>
            <p className="ap-hero-sub">
              저장한 배치와 가구 목록을 한 화면에서 이어보고, 필요할 때 바로 2D와 3D로 확인할 수 있습니다.
            </p>
            <div className="ap-hero-ctas">
              <button type="button" className="ap-btn-primary" onClick={onOpenStarterPicker}>새 원룸 시작하기</button>
              <button type="button" className="ap-btn-ghost" onClick={onResumeProject}>최근 원룸 이어하기</button>
            </div>
          </div>
          <div className="ap-home-summary" aria-hidden="true">
            <span>원룸 {projectCount}개</span>
            <span>가구 {furnitureCount}개</span>
          </div>
        </article>
      </section>
    </div>
  )
}
