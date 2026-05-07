export default function StarterPickerModal({
  starters,
  onCreateProject,
  onClose,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="starter-modal" role="dialog" aria-modal="true" aria-label="원룸 시작하기">
        <p className="section-kicker">New project</p>
        <h2>나만의 원룸을 시작하세요</h2>
        <p>원하는 분위기로 바로 내 공간 꾸미기를 시작할 수 있습니다.</p>
        <div className="starter-grid">
          {starters.map((starter) => (
            <button key={starter.id} type="button" className="starter-card" onClick={() => onCreateProject(starter)}>
              <strong>나만의 원룸</strong>
              <span>{starter.description}</span>
            </button>
          ))}
        </div>
        <div className="detail-actions">
          <button type="button" className="panel-ghost" onClick={onClose}>닫기</button>
        </div>
      </section>
    </div>
  )
}
