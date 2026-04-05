import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getClient, initDb } from '@/lib/db'
import { signToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    await initDb()
    const { email, password } = await req.json()
    const db = getClient()
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE email=?', args: [email] })
    const user = result.rows[0]

    if (!user || !bcrypt.compareSync(password, user.password as string))
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة' }, { status: 401 })

    const token = await signToken({
      id: Number(user.id), name: user.name as string,
      email: user.email as string, role: user.role as string
    })
    const res = NextResponse.json({ success: true, role: user.role })
    res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'حدث خطأ' }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('token')
  return res
}
