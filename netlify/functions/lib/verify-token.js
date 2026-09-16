import { getApp } from './admin-app.js'
import { getAuth } from 'firebase-admin/auth'

export function getBearerToken(req) {
  const header = req.headers.get('authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7) : null
}

export async function verifyToken(req) {
  const token = getBearerToken(req)
  if (!token) return { error: 'Missing ID token', status: 401 }

  try {
    const decoded = await getAuth(getApp()).verifyIdToken(token, true)
    return { decoded }
  } catch {
    return { error: 'Invalid token', status: 401 }
  }
}

export function authError(result) {
  return new Response(JSON.stringify({ error: result.error }), {
    status: result.status,
    headers: { 'Content-Type': 'application/json' },
  })
}
