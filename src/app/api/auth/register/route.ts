import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb, initDb } from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const { name, email, phone, password } = await req.json()
    if (!name || !email || !password)
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 })

    const db = getDb()
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email=?', args: [email] })
    if (existing.rows.length > 0)
      return NextResponse.json({ error: 'البريد الإلكتروني مسجّل مسبقاً' }, { status: 409 })

    const hash = bcrypt.hashSync(password, 10)
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      args: [name, email, phone || '', hash]
    })

    const token = await signToken({ id: Number(result.lastInsertRowid), name, email, role: 'user' })
    const res = NextResponse.json({ success: true })
    res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}
