'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lang, translations } from '@/lib/i18n'

export default function RegisterPage() {
  const [lang, setLang] = useState<Lang>('ar')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const t = translations[lang]
  const isRtl = lang === 'ar'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center font-bold text-white text-xl">U</div>
            <span className="font-bold text-2xl text-white">USDT<span className="text-emerald-400">.SA</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-white">{t.register}</h1>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">{t.name}</label>
              <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="input-field" placeholder={isRtl ? 'محمد أحمد' : 'John Smith'} required />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">{t.email}</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="input-field" placeholder="example@email.com" required />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">{t.phone}</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="input-field" placeholder="05xxxxxxxx" />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">{t.password}</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                className="input-field" placeholder="••••••••" required minLength={6} />
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full text-center disabled:opacity-60">
              {loading ? '...' : t.sign_up}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            {t.have_account}{' '}
            <Link href="/login" className="text-emerald-400 hover:underline">{t.login}</Link>
          </p>
        </div>

        <div className="text-center mt-4">
          <button onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>
      </div>
    </div>
  )
}
