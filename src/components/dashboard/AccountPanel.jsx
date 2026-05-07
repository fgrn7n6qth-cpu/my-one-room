import ProfileForm from '../ProfileForm.jsx'

export default function AccountPanel({
  currentUser,
  profileForm,
  onProfileFormChange,
  onProfileSubmit,
  onAddressLookup,
  profileSaving,
  addressLookupLoading,
  accountActionLoading,
  onRefreshAccount,
  onOpenDeleteModal,
  workspaceSteps,
}) {
  const providerLabel = currentUser?.authProvider === 'kakao'
    ? '카카오'
    : currentUser?.authProvider === 'naver'
      ? '네이버'
      : '이메일'

  return (
    <section className="dashboard-panel account-panel">
      <div className="panel-header">
        <p className="section-kicker">내 계정</p>
        <h2>내 정보</h2>
        <p>현재 로그인한 계정 정보를 확인하고 필요한 내용을 바로 수정할 수 있습니다.</p>
      </div>

      {workspaceSteps}

      <div className="account-grid">
        <article className="account-card account-card-primary">
          <div className="account-card-head">
            <div>
              <p className="section-kicker">프로필</p>
              <strong>{currentUser?.name}</strong>
            </div>
            <span className="account-badge">로그인 중</span>
          </div>
          <div className="account-meta">
            <div>
              <span>이메일</span>
              <strong>{currentUser?.email}</strong>
            </div>
            <div>
              <span>전화번호</span>
              <strong>{currentUser?.phone || '미등록'}</strong>
            </div>
            <div>
              <span>주소</span>
              <strong>{currentUser?.address || '미등록'}</strong>
            </div>
            <div>
              <span>회원 번호</span>
              <strong>{currentUser?.id}</strong>
            </div>
            <div>
              <span>가입 시각</span>
              <strong>{currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleString('ko-KR') : '방금 가입'}</strong>
            </div>
            <div>
              <span>가입 방식</span>
              <strong>{providerLabel}</strong>
            </div>
          </div>
        </article>

        <article className="account-card">
          <p className="section-kicker">정보 수정</p>
          <h3>내 정보 수정</h3>
          <ProfileForm
            profileForm={profileForm}
            onProfileFormChange={onProfileFormChange}
            onSubmit={onProfileSubmit}
            onAddressLookup={onAddressLookup}
            profileSaving={profileSaving}
            addressLookupLoading={addressLookupLoading}
            submitLabel="내 정보 저장"
          />
        </article>

        <article className="account-card">
          <p className="section-kicker">계정 관리</p>
          <h3>회원탈퇴</h3>
          <p className="account-danger-copy">
            회원탈퇴를 진행하면 현재 로그인 세션이 종료되고 계정 정보가 삭제됩니다.
            저장된 원룸 프로젝트는 데모 저장소 상태에 따라 남아 있을 수 있으니 필요한 내용은 먼저 확인해 주세요.
          </p>
          <div className="account-actions">
            <button type="button" className="header-ghost" onClick={onRefreshAccount}>정보 새로 확인</button>
            <button
              type="button"
              className="account-danger-button"
              onClick={onOpenDeleteModal}
              disabled={accountActionLoading}
            >
              {accountActionLoading ? '처리 중...' : '회원탈퇴'}
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}
