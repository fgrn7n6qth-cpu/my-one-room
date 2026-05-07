export default function DeleteAccountModal({
  confirmText,
  onConfirmTextChange,
  onCancel,
  onDelete,
  loading = false,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="delete-account-modal" role="dialog" aria-modal="true" aria-label="회원탈퇴 확인">
        <p className="section-kicker">회원탈퇴 확인</p>
        <h2>정말 계정을 삭제할까요?</h2>
        <p>계정을 삭제하면 현재 로그인 상태가 종료되고, 저장된 계정 작업 공간도 함께 지워집니다.</p>
        <p className="delete-account-instruction">계속하려면 아래 입력칸에 <strong>탈퇴</strong>를 입력해주세요.</p>

        <input
          type="text"
          className="delete-account-input"
          value={confirmText}
          onChange={(event) => onConfirmTextChange(event.target.value)}
          placeholder="탈퇴 입력"
        />

        <div className="detail-actions">
          <button type="button" className="panel-ghost" onClick={onCancel} disabled={loading}>취소</button>
          <button
            type="button"
            className="account-danger-button"
            onClick={onDelete}
            disabled={loading || confirmText !== '탈퇴'}
          >
            {loading ? '처리 중...' : '회원탈퇴 진행'}
          </button>
        </div>
      </section>
    </div>
  )
}
