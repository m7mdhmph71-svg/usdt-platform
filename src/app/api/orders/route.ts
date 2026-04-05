export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb, getSettings, getPriceTiers, getRateForAmount, initDb } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  await initDb()
  const db = getDb()
  const result = await db.execute({
    sql: `SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
          FROM orders o JOIN users u ON o.user_id = u.id
          WHERE o.user_id = ? ORDER BY o.created_at DESC`,
    args: [user.id]
  })
  return NextResponse.json({ orders: result.rows })
}

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  try {
    await initDb()
    const { usdt_amount, wallet_address, payment_method } = await req.json()
    if (!usdt_amount || !wallet_address || !payment_method)
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })

    const settings = await getSettings()
    const tiers = await getPriceTiers()
    const min = parseFloat(settings.min_order || '1')
    const max = parseFloat(settings.max_order || '50000')

    if (usdt_amount < min || usdt_amount > max)
      return NextResponse.json({ error: `الكمية يجب أن تكون بين ${min} و ${max} USDT` }, { status: 400 })

    const rate = getRateForAmount(usdt_amount, tiers)
    const sar_amount = usdt_amount * rate
    const db = getDb()
    const result = await db.execute({
      sql: `INSERT INTO orders (user_id, usdt_amount, sar_amount, rate, wallet_address, payment_method) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [user.id, usdt_amount, sar_amount, rate, wallet_address, payment_method]
    })
    return NextResponse.json({ success: true, order_id: result.lastInsertRowid, rate, sar_amount })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
