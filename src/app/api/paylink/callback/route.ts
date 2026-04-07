export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb, initDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const body = await req.json()

    // Paylink sends orderNumber = "ORDER-{id}"
    const orderNumber: string = body.orderNumber || body.merchantOrderNumber || ''
    const orderStatus: string = body.orderStatus || body.status || ''
    const transactionNo: string = body.transactionNo || ''

    const orderId = orderNumber.replace('ORDER-', '')
    if (!orderId) return NextResponse.json({ success: false }, { status: 400 })

    const db = getDb()

    if (orderStatus === 'Paid') {
      await db.execute({
        sql: `UPDATE orders SET status = 'confirmed', notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [`paylink_tx:${transactionNo}`, orderId]
      })
    } else {
      // Payment failed or cancelled
      await db.execute({
        sql: `UPDATE orders SET status = 'cancelled', notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        args: [`paylink_failed:${orderStatus}`, orderId]
      })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Paylink callback error:', e)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

// Paylink may also send GET request for verification
export async function GET() {
  return NextResponse.json({ success: true })
}
