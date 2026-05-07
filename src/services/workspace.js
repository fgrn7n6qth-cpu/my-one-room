import { createAuthorizedRequest } from '../lib/apiClient.js'

async function requestWorkspace(token, options = {}) {
  const response = await createAuthorizedRequest(token)('/workspace', {
    ...options,
    allowedStatusCodes: [404],
  })

  if (response && response.ok === false && response.status === 404) {
    return null
  }

  return response
}

export function fetchWorkspace(token) {
  return requestWorkspace(token)
}

export function saveWorkspace(token, payload) {
  return requestWorkspace(token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
