import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './lib/auth'

const PROTECTED = ['/dashboard', '/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))

  if (!isProtected) return NextResponse.next()

  const token = req.cookies.get('token')?.value
  const user = token ? await verifyToken(token) : null

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*']
}
