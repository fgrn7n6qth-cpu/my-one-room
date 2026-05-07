export default function OnboardingModal({
  steps,
  onClose,
  onStart,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="onboarding-modal" role="dialog" aria-modal="true" aria-label="시작 안내">
        <p className="section-kicker">시작하기</p>
        <h2>룸 플래너 사용 방법</h2>
        <p>방 크기를 설정하고 가구를 배치해 원하는 공간을 완성해보세요. 총 3단계로 구성되어 있습니다.</p>
        <div className="onboarding-list">
          {steps.map((step, index) => (
            <article key={step} className="onboarding-step">
              <span>{index + 1}</span>
              <strong>{step}</strong>
            </article>
          ))}
        </div>
        <div className="detail-actions">
          <button type="button" className="panel-ghost" onClick={onClose}>나중에 보기</button>
          <button type="button" className="panel-primary" onClick={onStart}>바로 시작하기</button>
        </div>
      </section>
    </div>
  )
}
