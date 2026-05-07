import ProfileForm from '../ProfileForm.jsx'

export default function ProfileSetupModal({
  profileForm,
  onProfileFormChange,
  onProfileSubmit,
  onAddressLookup,
  profileSaving,
  addressLookupLoading,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="profile-setup-modal" role="dialog" aria-modal="true" aria-label="회원 정보 등록">
        <p className="section-kicker">회원가입 완료하기</p>
        <h2>마지막으로 기본 정보를 확인해주세요</h2>
        <p>처음 로그인했거나 다시 가입한 계정이라서, 원룸 저장에 필요한 기본 정보를 한 번만 등록하면 됩니다.</p>

        <ProfileForm
          profileForm={profileForm}
          onProfileFormChange={onProfileFormChange}
          onSubmit={onProfileSubmit}
          onAddressLookup={onAddressLookup}
          profileSaving={profileSaving}
          addressLookupLoading={addressLookupLoading}
          submitLabel="등록 완료"
        />
      </section>
    </div>
  )
}
