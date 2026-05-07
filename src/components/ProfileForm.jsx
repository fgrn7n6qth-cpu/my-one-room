export default function ProfileForm({
  profileForm,
  onProfileFormChange,
  onSubmit,
  onAddressLookup,
  profileSaving = false,
  addressLookupLoading = false,
  submitLabel = '저장',
}) {
  return (
    <form className="profile-setup-form" onSubmit={onSubmit}>
      <label className="project-manage-field">
        <span>이름</span>
        <input
          type="text"
          value={profileForm.name}
          onChange={(event) => onProfileFormChange('name', event.target.value)}
          placeholder="이름 입력"
        />
      </label>

      <label className="project-manage-field">
        <span>전화번호</span>
        <input
          type="tel"
          value={profileForm.phone}
          onChange={(event) => onProfileFormChange('phone', event.target.value)}
          placeholder="010-0000-0000"
        />
      </label>

      <label className="project-manage-field">
        <span>주소</span>
        <div className="profile-address-row">
          <input
            type="text"
            value={profileForm.address}
            onChange={(event) => onProfileFormChange('address', event.target.value)}
            placeholder="거주지 또는 배송지 주소 입력"
          />
          <button
            type="button"
            className="panel-ghost profile-address-search"
            onClick={onAddressLookup}
            disabled={addressLookupLoading}
          >
            {addressLookupLoading ? '검색 중...' : '주소 검색'}
          </button>
        </div>
      </label>

      <div className="detail-actions">
        <button type="submit" className="panel-primary" disabled={profileSaving}>
          {profileSaving ? '저장 중...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
