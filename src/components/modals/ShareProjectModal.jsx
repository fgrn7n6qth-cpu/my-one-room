export default function ShareProjectModal({
  project,
  shareLink,
  onClose,
  onCopy,
  onInvite,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="share-modal" role="dialog" aria-modal="true" aria-label="프로젝트 공유">
        <div className="share-head">
          <div>
            <p className="section-kicker">Share project</p>
            <h2>{project?.name} 공유</h2>
          </div>
          <button type="button" className="panel-ghost" onClick={onClose}>닫기</button>
        </div>
        <div className="share-link-box">
          <span>공유 링크</span>
          <strong>{shareLink}</strong>
        </div>
        <div className="share-grid">
          <article className="share-card">
            <p className="section-kicker">Access</p>
            <strong>읽기 전용 링크</strong>
            <span>링크를 받은 사용자는 레이아웃을 보고 스타일을 확인할 수 있습니다.</span>
          </article>
          <article className="share-card">
            <p className="section-kicker">Members</p>
            <strong>2명 초대 완료</strong>
            <span>현재 리뷰어와 클라이언트가 이 프로젝트를 확인 중입니다.</span>
          </article>
        </div>
        <div className="detail-actions">
          <button type="button" className="panel-ghost" onClick={onCopy}>링크 복사</button>
          <button type="button" className="panel-primary" onClick={onInvite}>초대 보내기</button>
        </div>
      </section>
    </div>
  )
}
