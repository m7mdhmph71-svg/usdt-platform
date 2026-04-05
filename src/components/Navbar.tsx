'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  lang: 'ar' | 'en'
  user?: { name: string; role: string } | null
  onLangChange?: (l: 'ar' | 'en') => void
}

export default function Navbar({ lang, user, onLangChange }: NavbarProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const isRtl = lang === 'ar'

  const t = {
    ar: { home: 'الرئيسية', login: 'دخول', register: 'تسجيل', logout: 'خروج', dashboard: 'حسابي', admin: 'الإدارة' },
    en: { home: 'Home', login: 'Login', register: 'Register', logout: 'Logout', dashboard: 'My Account', admin: 'Admin' }
  }[lang]

  async function handleLogout() {
    await fetch('/api/auth/login', { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between" dir={isRtl ? 'rtl' : 'ltr'}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white text-lg">U</div>
          <span className="font-bold text-xl text-white">USDT<span className="text-emerald-400">.SA</span></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-4">
          {/* Lang toggle */}
          <button
            onClick={() => onLangChange?.(lang === 'ar' ? 'en' : 'ar')}
            className="text-slate-400 hover:text-white border border-slate-600 rounded-lg px-3 py-1 text-sm transition-colors"
          >
            {lang === 'ar' ? 'EN' : 'عر'}
          </button>

          {user ? (
            <>
              <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">{t.dashboard}</Link>
              {user.role === 'admin' && (
                <Link href="/admin" className="text-slate-300 hover:text-white transition-colors">{t.admin}</Link>
              )}
              <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors">{t.logout}</button>
              <span className="text-emerald-400 text-sm border border-emerald-500/30 rounded-lg px-3 py-1">
                {user.name}
              </span>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-300 hover:text-white transition-colors">{t.login}</Link>
              <Link href="/register" className="btn-primary text-sm py-2 px-4">{t.register}</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-slate-300" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-700 px-4 py-4 flex flex-col gap-3" dir={isRtl ? 'rtl' : 'ltr'}>
          <button onClick={() => onLangChange?.(lang === 'ar' ? 'en' : 'ar')}
            className="text-slate-400 text-sm border border-slate-600 rounded-lg px-3 py-2 w-fit">
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="text-slate-300">{t.dashboard}</Link>
              {user.role === 'admin' && <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-slate-300">{t.admin}</Link>}
              <button onClick={handleLogout} className="text-red-400 text-start">{t.logout}</button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-slate-300">{t.login}</Link>
              <Link href="/register" onClick={() => setMenuOpen(false)} className="text-emerald-400">{t.register}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
