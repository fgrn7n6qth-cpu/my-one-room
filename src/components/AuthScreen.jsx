import { useEffect, useMemo, useState } from 'react'
import {
  checkEmailAvailability,
  login,
  requestPasswordResetEmailVerification,
  requestSignupEmailVerification,
  resetPassword,
  signup,
} from '../services/auth.js'

const socialButtons = [
  {
    id: 'kakao',
    label: '카카오로 계속하기',
    hint: '카카오 계정으로 빠르게 시작',
    badge: 'K',
    className: 'kakao',
  },
  {
    id: 'naver',
    label: '네이버로 계속하기',
    hint: '네이버 계정으로 빠르게 시작',
    badge: 'N',
    className: 'naver',
  },
]

const initialLoginForm = {
  email: '',
  password: '',
}

const initialSignupForm = {
  name: '',
  email: '',
  password: '',
  verificationCode: '',
}

const initialResetForm = {
  email: '',
  verificationCode: '',
  password: '',
}

function AuthScreen({
  loading = false,
  message = '',
  onAuthSuccess,
  onSocialLogin,
}) {
  const [mode, setMode] = useState('login')
  const [loginForm, setLoginForm] = useState(initialLoginForm)
  const [signupForm, setSignupForm] = useState(initialSignupForm)
  const [resetForm, setResetForm] = useState(initialResetForm)
  const [pendingAuth, setPendingAuth] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [sendingSignupCode, setSendingSignupCode] = useState(false)
  const [sendingResetCode, setSendingResetCode] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)
  const [localMessage, setLocalMessage] = useState('')
  const [signupCooldown, setSignupCooldown] = useState(0)
  const [resetCooldown, setResetCooldown] = useState(0)
  const [emailAvailability, setEmailAvailability] = useState({
    checkedEmail: '',
    available: null,
    message: '',
  })

  const activeMessage = useMemo(() => localMessage || message || ' ', [localMessage, message])
  const disabled = loading || submitting
  const title = mode === 'login'
    ? '마이 원룸에 로그인'
    : mode === 'signup'
      ? '새 계정 만들기'
      : mode === 'reset'
        ? '비밀번호 재설정'
        : '계정 준비 완료'

  useEffect(() => {
    if (!signupCooldown && !resetCooldown) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setSignupCooldown((current) => Math.max(0, current - 1))
      setResetCooldown((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [signupCooldown, resetCooldown])

  const openMode = (nextMode) => {
    setMode(nextMode)
    setLocalMessage('')
  }

  const handleLoginChange = (key, value) => {
    setLoginForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleSignupChange = (key, value) => {
    setSignupForm((current) => ({
      ...current,
      [key]: value,
    }))

    if (key === 'email') {
      setEmailAvailability((current) => ({
        ...current,
        available: current.checkedEmail === value ? current.available : null,
        message: current.checkedEmail === value ? current.message : '',
      }))
    }
  }

  const handleResetChange = (key, value) => {
    setResetForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  const handleCheckEmail = async () => {
    try {
      setCheckingEmail(true)
      setLocalMessage('')
      const result = await checkEmailAvailability({ email: signupForm.email })
      setEmailAvailability({
        checkedEmail: signupForm.email,
        available: result.available,
        message: result.message,
      })
      setLocalMessage(result.message)
    } catch (error) {
      const nextMessage = error.message || '이메일 확인 중 문제가 발생했습니다.'
      setEmailAvailability({
        checkedEmail: signupForm.email,
        available: false,
        message: nextMessage,
      })
      setLocalMessage(nextMessage)
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleLoginSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setLocalMessage('')
      const auth = await login(loginForm)
      onAuthSuccess(auth, '로그인되었습니다.')
    } catch (error) {
      setLocalMessage(error.message || '로그인 중 문제가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSendSignupCode = async () => {
    try {
      setSendingSignupCode(true)
      setLocalMessage('')
      await requestSignupEmailVerification({ email: signupForm.email })
      setSignupCooldown(30)
      setLocalMessage('인증코드를 보냈습니다. 30초 뒤 다시 요청할 수 있습니다.')
    } catch (error) {
      setLocalMessage(error.message || '인증코드 발송 중 문제가 발생했습니다.')
    } finally {
      setSendingSignupCode(false)
    }
  }

  const handleSendResetCode = async () => {
    try {
      setSendingResetCode(true)
      setLocalMessage('')
      await requestPasswordResetEmailVerification({ email: resetForm.email })
      setResetCooldown(30)
      setLocalMessage('재설정 코드를 보냈습니다. 30초 뒤 다시 요청할 수 있습니다.')
    } catch (error) {
      setLocalMessage(error.message || '재설정 코드 발송 중 문제가 발생했습니다.')
    } finally {
      setSendingResetCode(false)
    }
  }

  const handleSignupSubmit = async (event) => {
    event.preventDefault()

    if (emailAvailability.checkedEmail !== signupForm.email || emailAvailability.available !== true) {
      setLocalMessage('회원가입 전에 이메일 중복 확인을 먼저 진행해 주세요.')
      return
    }

    try {
      setSubmitting(true)
      setLocalMessage('')
      const auth = await signup(signupForm)
      setPendingAuth(auth)
      setMode('complete')
    } catch (error) {
      setLocalMessage(error.message || '회원가입 중 문제가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setLocalMessage('')
      await resetPassword(resetForm)
      setResetForm(initialResetForm)
      setMode('login')
      setLocalMessage('비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해 주세요.')
    } catch (error) {
      setLocalMessage(error.message || '비밀번호 재설정 중 문제가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell auth-shell-minimal">
      <main className="auth-minimal-page">
        <section id="signin" className="auth-minimal-card" aria-label={title}>
          <h2 id="signin-title">{title}</h2>

          {mode === 'complete' ? (
            <div className="auth-form-body auth-complete-body">
              <p className="auth-complete-title">계정이 생성되었습니다.</p>
              <p className="auth-complete-text">
                내 원룸 플래너로 이동해 배치를 저장해 보세요.
              </p>
              <button
                type="button"
                className="auth-submit"
                onClick={() => onAuthSuccess(pendingAuth, '계정 준비가 완료되었습니다.')}
              >
                계속하기
              </button>
            </div>
          ) : (
            <>
              {mode === 'login' ? (
                <form className="auth-form-body" onSubmit={handleLoginSubmit}>
                  <label className="auth-field auth-floating-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={loginForm.email}
                      onChange={(event) => handleLoginChange('email', event.target.value)}
                      placeholder="이메일"
                      autoComplete="email"
                    />
                  </label>
                  <label className="auth-field auth-floating-field">
                    <span>Password</span>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(event) => handleLoginChange('password', event.target.value)}
                      placeholder="비밀번호"
                      autoComplete="current-password"
                    />
                  </label>
                  <button type="submit" className="auth-submit auth-arrow-submit" disabled={disabled}>
                    {submitting ? '로그인 중...' : '로그인'}
                  </button>
                  <label className="auth-remember">
                    <input type="checkbox" />
                    <span>로그인 상태 유지</span>
                  </label>
                  <button type="button" className="auth-link-button" onClick={() => openMode('reset')} disabled={loading}>
                    비밀번호를 잊으셨나요?
                  </button>
                  <p className="auth-account-line">
                    아직 계정이 없나요?{' '}
                    <button type="button" onClick={() => openMode('signup')}>
                      새 계정 만들기
                    </button>
                  </p>
                </form>
              ) : null}

              {mode === 'signup' ? (
                <form className="auth-form-body" onSubmit={handleSignupSubmit}>
                  <label className="auth-field auth-floating-field">
                    <span>Name</span>
                    <input
                      type="text"
                      value={signupForm.name}
                      onChange={(event) => handleSignupChange('name', event.target.value)}
                      placeholder="이름"
                      autoComplete="name"
                    />
                  </label>
                  <label className="auth-field auth-floating-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={signupForm.email}
                      onChange={(event) => handleSignupChange('email', event.target.value)}
                      placeholder="이메일"
                      autoComplete="email"
                    />
                  </label>
                  <div className="auth-action-row">
                    <button type="button" className="auth-secondary-action" onClick={handleCheckEmail} disabled={loading || checkingEmail}>
                      {checkingEmail ? '확인 중...' : '중복 확인'}
                    </button>
                    <button type="button" className="auth-secondary-action" onClick={handleSendSignupCode} disabled={loading || sendingSignupCode || signupCooldown > 0}>
                      {sendingSignupCode ? '발송 중...' : signupCooldown > 0 ? `${signupCooldown}s` : '인증코드 보내기'}
                    </button>
                  </div>
                  <label className="auth-field auth-floating-field">
                    <span>Verification Code</span>
                    <input
                      type="text"
                      value={signupForm.verificationCode}
                      onChange={(event) => handleSignupChange('verificationCode', event.target.value)}
                      placeholder="인증코드"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="auth-field auth-floating-field">
                    <span>Password</span>
                    <input
                      type="password"
                      value={signupForm.password}
                      onChange={(event) => handleSignupChange('password', event.target.value)}
                      placeholder="비밀번호"
                      autoComplete="new-password"
                    />
                  </label>
                  <button type="submit" className="auth-submit" disabled={disabled}>
                    {submitting ? '가입 중...' : '계정 만들기'}
                  </button>
                  <button type="button" className="auth-link-button" onClick={() => openMode('login')} disabled={loading}>
                    로그인으로 돌아가기
                  </button>
                </form>
              ) : null}

              {mode === 'reset' ? (
                <form className="auth-form-body" onSubmit={handleResetSubmit}>
                  <label className="auth-field auth-floating-field">
                    <span>Email</span>
                    <input
                      type="email"
                      value={resetForm.email}
                      onChange={(event) => handleResetChange('email', event.target.value)}
                      placeholder="이메일"
                      autoComplete="email"
                    />
                  </label>
                  <button type="button" className="auth-secondary-action full" onClick={handleSendResetCode} disabled={loading || sendingResetCode || resetCooldown > 0}>
                    {sendingResetCode ? '재설정 코드 발송 중...' : resetCooldown > 0 ? `${resetCooldown}s 뒤 재요청` : '재설정 코드 보내기'}
                  </button>
                  <label className="auth-field auth-floating-field">
                    <span>Verification Code</span>
                    <input
                      type="text"
                      value={resetForm.verificationCode}
                      onChange={(event) => handleResetChange('verificationCode', event.target.value)}
                      placeholder="인증코드"
                      inputMode="numeric"
                    />
                  </label>
                  <label className="auth-field auth-floating-field">
                    <span>New Password</span>
                    <input
                      type="password"
                      value={resetForm.password}
                      onChange={(event) => handleResetChange('password', event.target.value)}
                      placeholder="새 비밀번호"
                      autoComplete="new-password"
                    />
                  </label>
                  <button type="submit" className="auth-submit" disabled={disabled}>
                    {submitting ? '재설정 중...' : '비밀번호 재설정'}
                  </button>
                  <button type="button" className="auth-link-button" onClick={() => openMode('login')} disabled={loading}>
                    로그인으로 돌아가기
                  </button>
                </form>
              ) : null}

              <div className="auth-minimal-divider" aria-hidden="true" />
              <div className="auth-social-list">
                {socialButtons.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    className={`auth-social-btn ${provider.className}`}
                    onClick={() => {
                      setLocalMessage('')
                      onSocialLogin(provider.id)
                    }}
                    disabled={loading}
                  >
                    <span className={`auth-social-badge ${provider.className}`} aria-hidden="true">
                      {provider.badge}
                    </span>
                    <span className="auth-social-copy">
                      <strong>{provider.label}</strong>
                      <span>{provider.hint}</span>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <p className={`auth-message${activeMessage.trim() ? ' has-message' : ''}`}>{activeMessage}</p>
        </section>

        <footer className="auth-minimal-footer">
          <p>
            도움이 필요하신가요? <a href="mailto:support@myoneroom.local">문의하기</a>
          </p>
          <span>
            내 방 배치와 계정 정보는 개인 작업 공간 기준으로 안전하게 관리됩니다.
          </span>
        </footer>
      </main>
    </div>
  )
}

export default AuthScreen
