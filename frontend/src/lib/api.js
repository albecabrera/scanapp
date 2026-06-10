const BASE = '/api/v1'

function token() {
  return localStorage.getItem('ss_token')
}

async function request(method, path, body = null) {
  const headers = { 'Content-Type': 'application/json' }
  const t = token()
  if (t) headers['Authorization'] = `Bearer ${t}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  })

  if (res.status === 204) return null

  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data.error ?? 'Request failed'), { code: data.code, status: res.status })
  return data
}

export const api = {
  auth: {
    register: (body) => request('POST', '/auth/register', body),
    login:    (body) => request('POST', '/auth/login', body),
    me:       ()     => request('GET', '/auth/me'),
    update:   (body) => request('PATCH', '/auth/me', body),
  },
  households: {
    list:       ()          => request('GET', '/households'),
    create:     (body)      => request('POST', '/households', body),
    update:     (id, body)  => request('PATCH', `/households/${id}`, body),
    delete:     (id)        => request('DELETE', `/households/${id}`),
    inviteCreate: (id)      => request('POST', `/households/${id}/invites`),
    inviteActive: (id)      => request('GET', `/households/${id}/invites/active`),
    join:       (code)      => request('POST', '/invites/join', { code }),
    memberRemove: (hid, uid) => request('DELETE', `/households/${hid}/members/${uid}`),
    memberRole:   (hid, uid, role) => request('PATCH', `/households/${hid}/members/${uid}`, { role }),
  },
  items: {
    list:    (hid, params = {}) => {
      const q = new URLSearchParams(params).toString()
      return request('GET', `/households/${hid}/items${q ? '?' + q : ''}`)
    },
    create:  (hid, body)  => request('POST', `/households/${hid}/items`, body),
    update:  (hid, id, body) => request('PATCH', `/households/${hid}/items/${id}`, body),
    consume: (hid, id)    => request('POST', `/households/${hid}/items/${id}/consume`),
    delete:  (hid, id)    => request('DELETE', `/households/${hid}/items/${id}`),
  },
  products: {
    lookup: (ean) => request('GET', `/products/${ean}`),
  },
  notifications: {
    get:      (hid)       => request('GET', `/households/${hid}/notifications`),
    update:   (hid, body) => request('PATCH', `/households/${hid}/notifications`, body),
    updateMe: (hid, body) => request('PATCH', `/households/${hid}/notifications/me`, body),
  },
  push: {
    subscribe:   (body) => request('POST', '/push/subscribe', body),
    unsubscribe: (body) => request('DELETE', '/push/subscribe', body),
  },
}
