export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'
import { getUser } from '@/lib/auth'

export async function GET() {
  const user = await getUser()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  await initDb()
  const db = getDb()

  const ordersResult = await db.execute(`
    SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
    FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC
  `)
  const statsResult = await db.execute(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) as pending,
      SUM(CASE WHEN status='completed' THEN usdt_amount ELSE 0 END) as total_volume
    FROM orders
  `)
  return NextResponse.json({ orders: ordersResult.rows, stats: statsResult.rows[0] })
}

export async function PATCH(req: NextRequest) {
  const user = await getUser()
  if (!user || user.role !== 'admin') return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  try {
    const { order_id, status, notes } = await req.json()
    const db = getDb()
    await db.execute({
      sql: `UPDATE orders SET status=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      args: [status, notes || '', order_id]
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
