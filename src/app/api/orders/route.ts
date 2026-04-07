export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getDb, getSettings, getPriceTiers, getRateForAmount, initDb } from '@/lib/db'
import { getUser } from '@/lib/auth'
import { createPaylinkInvoice } from '@/lib/paylink'

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
    const sar_amount_base = usdt_amount * rate
    // Apply 2% fee for card payments
    const card_fee = payment_method === 'card' ? sar_amount_base * 0.02 : 0
    const sar_amount = sar_amount_base + card_fee
    const db = getDb()

    // Create order in DB
    const result = await db.execute({
      sql: `INSERT INTO orders (user_id, usdt_amount, sar_amount, rate, wallet_address, payment_method) VALUES (?, ?, ?, ?, ?, ?)`,
      args: [user.id, usdt_amount, sar_amount, rate, wallet_address, payment_method]
    })

    const order_id = result.lastInsertRowid

    // If card payment → create Paylink invoice
    if (payment_method === 'card') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://usdt-platform.vercel.app'
      const invoice = await createPaylinkInvoice({
        orderId: order_id,
        amountSar: sar_amount,
        usdtAmount: usdt_amount,
        clientName: user.name,
        clientEmail: user.email,
        clientPhone: '0500000000',
        baseUrl
      })

      if (invoice?.url) {
        // Save Paylink transaction number in notes
        await db.execute({
          sql: `UPDATE orders SET notes = ? WHERE id = ?`,
          args: [`paylink_tx:${invoice.transactionNo}`, order_id]
        })
        return NextResponse.json({
          success: true,
          order_id,
          rate,
          sar_amount,
          payment_url: invoice.url
        })
      } else {
        // Paylink failed - delete order and return error
        await db.execute({ sql: `DELETE FROM orders WHERE id = ?`, args: [order_id] })
        return NextResponse.json({ error: 'فشل في إنشاء رابط الدفع، حاول مجدداً' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, order_id, rate, sar_amount })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
