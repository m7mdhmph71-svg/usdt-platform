import { createClient } from '@libsql/client/http'
import path from 'path'
import bcrypt from 'bcryptjs'

function getClient() {
  // في الإنتاج (Vercel + Turso): يستخدم متغيرات البيئة
  // في التطوير المحلي: يستخدم ملف SQLite محلي
  let url = process.env.TURSO_DATABASE_URL || `file:${path.join(process.cwd(), 'data.db')}`
  const authToken = process.env.TURSO_AUTH_TOKEN

  // تحويل libsql:// إلى https:// لتجنب مشكلة migration jobs في Vercel
  if (url.startsWith('libsql://')) {
    url = url.replace('libsql://', 'https://')
  }

  return createClient(authToken ? { url, authToken } : { url })
}

let client: ReturnType<typeof getClient> | null = null
let initialized = false

export function getDb() {
  if (!client) client = getClient()
  return client
}

export async function initDb() {
  if (initialized) return
  initialized = true
  const db = getDb()

  await db.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      usdt_amount REAL NOT NULL,
      sar_amount REAL NOT NULL,
      rate REAL NOT NULL,
      wallet_address TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`,
  ])

  const existingBank = await db.execute("SELECT value FROM settings WHERE key='bank_name'")
  if (existingBank.rows.length === 0) {
    await db.batch([
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('bank_name', 'البنك الأهلي السعودي')`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('bank_iban', 'SA12 3456 7890 1234 5678 90')`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('bank_account_name', 'شركة الثقة للعملات الرقمية')`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('min_order', '1')`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('max_order', '50000')`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('price_tiers', '[{"min":1,"max":49,"rate":4.3},{"min":50,"max":100,"rate":4.2},{"min":101,"max":200,"rate":4.0},{"min":201,"max":999999,"rate":3.9}]')`,
    ])
  }

  const adminExists = await db.execute("SELECT id FROM users WHERE email='admin@usdt.sa'")
  if (adminExists.rows.length === 0) {
    const hash = bcrypt.hashSync('Admin@1234', 10)
    await db.execute({
      sql: `INSERT INTO users (name, email, phone, password, role) VALUES ('المدير', 'admin@usdt.sa', '0500000000', ?, 'admin')`,
      args: [hash]
    })
  }
}

export async function getSettings(): Promise<Record<string, string>> {
  await initDb()
  const db = getDb()
  const result = await db.execute("SELECT key, value FROM settings")
  return Object.fromEntries(result.rows.map(r => [r.key as string, r.value as string]))
}

export interface PriceTier { min: number; max: number; rate: number }

export async function getPriceTiers(): Promise<PriceTier[]> {
  const settings = await getSettings()
  try {
    return JSON.parse(settings.price_tiers || '[]') as PriceTier[]
  } catch {
    return [{ min: 1, max: 999999, rate: 3.75 }]
  }
}

export function getRateForAmount(amount: number, tiers: PriceTier[]): number {
  const tier = tiers.find(t => amount >= t.min && amount <= t.max)
  return tier?.rate ?? tiers[tiers.length - 1]?.rate ?? 3.75
}
