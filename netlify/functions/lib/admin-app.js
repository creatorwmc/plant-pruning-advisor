import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const HERE = dirname(fileURLToPath(import.meta.url))

let app = null

function findSaFile() {
  const candidates = [
    join(HERE, '..', '..', '..', '.service-accounts', 'wortcunning.json'),
    join(process.cwd(), '.service-accounts', 'wortcunning.json'),
  ]
  if (process.env.LAMBDA_TASK_ROOT) {
    candidates.push(join(process.env.LAMBDA_TASK_ROOT, '.service-accounts', 'wortcunning.json'))
  }
  candidates.push('/var/task/.service-accounts/wortcunning.json')
  for (const path of candidates) {
    if (existsSync(path)) return path
  }
  return null
}

export function getApp() {
  if (app) return app

  const existing = getApps().find((a) => a?.name === '[DEFAULT]')
  if (existing) { app = existing; return app }

  const raw = process.env.FIREBASE_WORTCUNNING_SA_JSON
  let credentials
  if (raw) {
    credentials = JSON.parse(raw)
  } else {
    const file = findSaFile()
    if (!file) throw new Error('No wortcunning SA found')
    credentials = JSON.parse(readFileSync(file, 'utf8'))
  }

  app = initializeApp({ credential: cert(credentials) })
  return app
}
