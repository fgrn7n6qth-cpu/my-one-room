import { API_BASE, apiRequest, createAuthorizedRequest } from '../lib/apiClient.js'

export const SOCIAL_AUTH_PROVIDERS = ['kakao', 'naver']

export function signup(payload) {
  return apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function checkEmailAvailability(payload) {
  return apiRequest('/auth/email-availability', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function requestSignupEmailVerification(payload) {
  return apiRequest('/auth/signup/email-verification', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function requestPasswordResetEmailVerification(payload) {
  return apiRequest('/auth/password-reset/email-verification', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resetPassword(payload) {
  return apiRequest('/auth/password-reset', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchMe(token) {
  return createAuthorizedRequest(token)('/auth/me')
}

export function logout(token) {
  return createAuthorizedRequest(token)('/auth/logout', {
    method: 'POST',
  })
}

export function deleteMe(token) {
  return createAuthorizedRequest(token)('/auth/me', {
    method: 'DELETE',
  })
}

export function updateProfile(token, payload) {
  return createAuthorizedRequest(token)('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function startSocialLogin(provider) {
  if (!SOCIAL_AUTH_PROVIDERS.includes(provider)) {
    throw new Error('지원하지 않는 소셜 로그인입니다.')
  }

  window.location.assign(`${API_BASE}/auth/oauth2/authorization/${provider}`)
}
