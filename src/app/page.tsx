'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { translations, Lang } from '@/lib/i18n'

export default function HomePage() {
  const [lang, setLang] = useState<Lang>('ar')
  const [tiers, setTiers] = useState<{min:number;max:number;rate:number}[]>([])
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const router = useRouter()
  const t = translations[lang]
  const isRtl = lang === 'ar'

  useEffect(() => {
    fetch('/api/price').then(r => r.json()).then(d => setTiers(d.tiers || []))
    fetch('/api/auth/login').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.user) setUser(d.user)
    }).catch(() => {})
  }, [])

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar lang={lang} user={user} onLangChange={setLang} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/20 to-blue-900/20" />
        <div className="max-w-6xl mx-auto px-4 py-24 text-center relative z-10">
          <div className="inline-block bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-full text-sm mb-6">
            💰 {isRtl ? 'الأسعار من' : 'Rates from'} <span className="font-bold">{tiers[tiers.length-1]?.rate ?? 3.9}</span> {isRtl ? 'إلى' : 'to'} <span className="font-bold">{tiers[0]?.rate ?? 4.3}</span> {t.sar_per_usdt}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {t.hero_title}
          </h1>
          <p className="text-slate-400 text-xl mb-10 max-w-2xl mx-auto">{t.hero_sub}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => router.push('/register')} className="btn-primary text-lg px-8 py-4">
              {t.buy_now} →
            </button>
            <button onClick={() => router.push('/login')}
              className="border border-slate-600 text-slate-300 hover:text-white hover:border-slate-400 px-8 py-4 rounded-xl transition-colors font-semibold">
              {t.login}
            </button>
          </div>
        </div>
      </section>

      {/* Price Tiers */}
      <section className="max-w-3xl mx-auto px-4 -mt-6 mb-16">
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 bg-slate-900 border-b border-slate-700">
            <h3 className="text-white font-semibold">{isRtl ? '💰 جدول الأسعار' : '💰 Price Table'}</h3>
          </div>
          <div className="divide-y divide-slate-700">
            {tiers.map((tier, i) => (
              <div key={i} className="flex justify-between items-center px-6 py-4 hover:bg-slate-700/30 transition-colors cursor-pointer"
                onClick={() => router.push('/register')}>
                <span className="text-slate-300">
                  {tier.max >= 999999
                    ? `${tier.min}+ USDT`
                    : `${tier.min} – ${tier.max} USDT`}
                </span>
                <span className="text-emerald-400 font-bold text-lg">
                  {tier.rate} {isRtl ? 'ريال/USDT' : 'SAR/USDT'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 mb-20">
        <h2 className="text-3xl font-bold text-center text-white mb-12">{t.how_it_works}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { num: '01', title: t.step1_title, desc: t.step1_desc, icon: '👤' },
            { num: '02', title: t.step2_title, desc: t.step2_desc, icon: '📋' },
            { num: '03', title: t.step3_title, desc: t.step3_desc, icon: '🚀' },
          ].map((step) => (
            <div key={step.num} className="card text-center relative overflow-hidden">
              <div className="absolute top-4 right-4 text-6xl font-black text-slate-700">{step.num}</div>
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
              <p className="text-slate-400">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why us */}
      <section className="bg-slate-800/50 py-20 mb-0">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">{t.why_us}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: '💰', title: t.feature1, desc: t.feature1_desc },
              { icon: '⚡', title: t.feature2, desc: t.feature2_desc },
              { icon: '🔐', title: t.feature3, desc: t.feature3_desc },
            ].map((f) => (
              <div key={f.title} className="text-center p-6">
                <div className="text-5xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
        <p>© 2024 USDT.SA — {isRtl ? 'جميع الحقوق محفوظة' : 'All rights reserved'}</p>
      </footer>
    </div>
  )
}
