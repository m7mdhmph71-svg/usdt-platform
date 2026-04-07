'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Lang, translations } from '@/lib/i18n'

interface PriceTier { min: number; max: number; rate: number }

interface Settings {
  rate: number
  tiers: PriceTier[]
  min_order: number
  max_order: number
  bank_name: string
  bank_iban: string
  bank_account_name: string
  bank_account_holder: string
  bank_account_type: string
  bank_country_code: string
  bank_ach_routing: string
  bank_wire_routing: string
  bank_address: string
}

function getRateForAmount(amount: number, tiers: PriceTier[]): number {
  const tier = tiers.find(t => amount >= t.min && amount <= t.max)
  return tier?.rate ?? tiers[tiers.length - 1]?.rate ?? 3.75
}

export default function NewOrderPage() {
  const [lang, setLang] = useState<Lang>('ar')
  const [settings, setSettings] = useState<Settings>({
    rate: 4.3, tiers: [], min_order: 1, max_order: 50000,
    bank_name: '', bank_iban: '', bank_account_name: '',
    bank_account_holder: '', bank_account_type: '', bank_country_code: '',
    bank_ach_routing: '', bank_wire_routing: '', bank_address: ''
  })
  const [usdtAmount, setUsdtAmount] = useState('')
  const [wallet, setWallet] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card'>('bank')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const t = translations[lang]
  const isRtl = lang === 'ar'

  useEffect(() => {
    fetch('/api/price').then(r => {
      if (!r.ok) { router.push('/login'); return null }
      return r.json()
    }).then(d => { if (d) setSettings(d) })
  }, [router])

  // Compute current rate based on entered amount
  const amount = parseFloat(usdtAmount) || 0
  const currentRate = amount > 0 ? getRateForAmount(amount, settings.tiers) : settings.tiers[0]?.rate ?? 4.3
  const sarAmountBase = amount > 0 ? amount * currentRate : 0
  const cardFee = paymentMethod === 'card' ? sarAmountBase * 0.02 : 0
  const sarAmountTotal = sarAmountBase + cardFee
  const sarAmount = sarAmountTotal > 0 ? sarAmountTotal.toFixed(2) : '0.00'

  // Find which tier is active
  const activeTier = settings.tiers.find(t => amount >= t.min && amount <= t.max)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (amount < settings.min_order || amount > settings.max_order) {
      setError(isRtl
        ? `الكمية يجب أن تكون بين ${settings.min_order} و ${settings.max_order} USDT`
        : `Amount must be between ${settings.min_order} and ${settings.max_order} USDT`)
      return
    }
    if (!wallet.trim()) { setError(isRtl ? 'أدخل عنوان المحفظة' : 'Enter wallet address'); return }

    setLoading(true)
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usdt_amount: amount, wallet_address: wallet, payment_method: paymentMethod })
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error); return }

    // Card payment → redirect to Paylink
    if (paymentMethod === 'card' && data.payment_url) {
      window.location.href = data.payment_url
      return
    }

    setSuccess(true)
  }

  if (success) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950">
        <Navbar lang={lang} onLangChange={setLang} />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="card">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-white mb-2">{t.order_success}</h2>
            <p className="text-slate-400 text-sm mb-6">
              {amount} USDT × {currentRate} = <span className="text-emerald-400 font-bold">{sarAmount} {isRtl ? 'ريال' : 'SAR'}</span>
            </p>
            {paymentMethod === 'bank' && (
              <div className="bg-slate-900 rounded-xl p-4 mb-6 text-start">
                <h3 className="text-emerald-400 font-semibold mb-3">{t.bank_details}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400 shrink-0">{t.bank_name}:</span>
                    <span className="text-white font-medium">{settings.bank_name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400 shrink-0">{t.account_name}:</span>
                    <span className="text-white">{settings.bank_account_holder || settings.bank_account_name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-slate-400 shrink-0">{isRtl ? 'رقم الحساب:' : 'Account No.'}:</span>
                    <span className="text-white font-mono text-xs">{settings.bank_iban}</span>
                  </div>
                  {settings.bank_account_type && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400 shrink-0">{isRtl ? 'نوع الحساب:' : 'Account Type'}:</span>
                      <span className="text-white">{settings.bank_account_type}</span>
                    </div>
                  )}
                  {settings.bank_ach_routing && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400 shrink-0">ACH Routing:</span>
                      <span className="text-white font-mono text-xs">{settings.bank_ach_routing}</span>
                    </div>
                  )}
                  {settings.bank_wire_routing && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400 shrink-0">Wire Routing:</span>
                      <span className="text-white font-mono text-xs">{settings.bank_wire_routing}</span>
                    </div>
                  )}
                  {settings.bank_address && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400 shrink-0">{isRtl ? 'عنوان البنك:' : 'Bank Address'}:</span>
                      <span className="text-white text-xs text-end">{settings.bank_address}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                    <span className="text-slate-400">{isRtl ? 'المبلغ المطلوب:' : 'Amount to transfer:'}</span>
                    <span className="text-emerald-400 font-bold text-lg">{sarAmount} {isRtl ? 'ريال' : 'SAR'}</span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs mt-3">{t.transfer_note}</p>
              </div>
            )}
            <Link href="/dashboard" className="btn-primary inline-block">{t.my_orders}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950">
      <Navbar lang={lang} onLangChange={setLang} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← {t.my_orders}
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">{t.buy_usdt}</h1>
        </div>

        {/* Price tiers table */}
        {settings.tiers.length > 0 && (
          <div className="card mb-6 p-0 overflow-hidden">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-700">
              <h3 className="text-white font-semibold text-sm">{isRtl ? '💰 جدول الأسعار' : '💰 Price Table'}</h3>
            </div>
            <div className="divide-y divide-slate-700">
              {settings.tiers.map((tier, i) => {
                const isActive = activeTier === tier
                return (
                  <div key={i}
                    className={`flex justify-between items-center px-4 py-3 transition-colors ${isActive ? 'bg-emerald-500/10' : ''}`}>
                    <span className={`text-sm ${isActive ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
                      {tier.max >= 999999
                        ? `${tier.min}+ USDT`
                        : `${tier.min} – ${tier.max} USDT`}
                      {isActive && (
                        <span className="mr-2 ml-2 text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-full">
                          {isRtl ? 'السعر المطبّق' : 'Applied'}
                        </span>
                      )}
                    </span>
                    <span className={`font-bold ${isActive ? 'text-emerald-400 text-lg' : 'text-white'}`}>
                      {tier.rate} {isRtl ? 'ريال' : 'SAR'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-4 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount */}
          <div className="card">
            <label className="block text-white font-medium mb-3">{t.usdt_amount}</label>
            <div className="relative">
              <input
                type="number" value={usdtAmount}
                onChange={e => setUsdtAmount(e.target.value)}
                className="input-field pr-16 text-xl font-bold"
                placeholder="100"
                min={settings.min_order} max={settings.max_order} step="1" required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-semibold">USDT</span>
            </div>

            {/* Live calculation */}
            {amount > 0 && (
              <div className="mt-4 bg-slate-900 rounded-xl p-4">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-slate-400">{isRtl ? 'السعر المطبّق:' : 'Rate applied:'}</span>
                  <span className="text-emerald-400 font-semibold">{currentRate} {isRtl ? 'ريال/USDT' : 'SAR/USDT'}</span>
                </div>
                {paymentMethod === 'card' && (
                  <>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-slate-400">{isRtl ? 'المبلغ الأساسي:' : 'Base amount:'}</span>
                      <span className="text-white">{sarAmountBase.toFixed(2)} {isRtl ? 'ريال' : 'SAR'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mb-2">
                      <span className="text-yellow-400">{isRtl ? 'رسوم البطاقة (2%):' : 'Card fee (2%):'}</span>
                      <span className="text-yellow-400">+{cardFee.toFixed(2)} {isRtl ? 'ريال' : 'SAR'}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                  <span className="text-slate-400">{t.you_pay}</span>
                  <span className="text-2xl font-bold text-white">{sarAmount} <span className="text-slate-400 text-base">{isRtl ? 'ريال' : 'SAR'}</span></span>
                </div>
              </div>
            )}

            {/* Quick amounts */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {[25, 50, 100, 200, 500].map(a => (
                <button key={a} type="button" onClick={() => setUsdtAmount(String(a))}
                  className={`border rounded-lg px-3 py-1 text-sm transition-colors ${
                    amount === a
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      : 'border-slate-600 text-slate-400 hover:text-white hover:border-emerald-500'
                  }`}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet */}
          <div className="card">
            <label className="block text-white font-medium mb-3">{t.wallet_address}</label>
            <input type="text" value={wallet} onChange={e => setWallet(e.target.value)}
              className="input-field font-mono text-sm" placeholder="TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" required />
            <p className="text-slate-500 text-xs mt-2">
              {isRtl ? '⚠️ تأكد من صحة العنوان — التحويل لا يُسترد' : '⚠️ Verify address carefully — transfers are irreversible'}
            </p>
          </div>

          {/* Payment method */}
          <div className="card">
            <label className="block text-white font-medium mb-3">{t.payment_method}</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setPaymentMethod('bank')}
                className={`border-2 rounded-xl p-4 text-center transition-all ${paymentMethod === 'bank' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-600 text-slate-400 hover:border-slate-400'}`}>
                <div className="text-2xl mb-1">🏦</div>
                <div className="font-medium text-sm">{t.bank_transfer}</div>
              </button>
              <button type="button" onClick={() => setPaymentMethod('card')}
                className={`border-2 rounded-xl p-4 text-center transition-all ${paymentMethod === 'card' ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-slate-600 text-slate-400 hover:border-slate-400'}`}>
                <div className="text-2xl mb-1">💳</div>
                <div className="font-medium text-sm">{t.credit_card}</div>
              </button>
            </div>

            {paymentMethod === 'bank' && (
              <div className="mt-4 bg-slate-900 rounded-xl p-4">
                <h4 className="text-emerald-400 text-sm font-semibold mb-3">{t.bank_details}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4"><span className="text-slate-500 shrink-0">{t.bank_name}:</span><span className="text-white">{settings.bank_name}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-slate-500 shrink-0">{t.account_name}:</span><span className="text-white">{settings.bank_account_holder || settings.bank_account_name}</span></div>
                  <div className="flex justify-between gap-4"><span className="text-slate-500 shrink-0">{isRtl ? 'رقم الحساب:' : 'Account No.'}:</span><span className="text-white font-mono text-xs">{settings.bank_iban}</span></div>
                  {settings.bank_account_type && <div className="flex justify-between gap-4"><span className="text-slate-500 shrink-0">{isRtl ? 'نوع الحساب:' : 'Account Type'}:</span><span className="text-white">{settings.bank_account_type}</span></div>}
                  {settings.bank_ach_routing && <div className="flex justify-between gap-4"><span className="text-slate-500 shrink-0">ACH Routing:</span><span className="text-white font-mono text-xs">{settings.bank_ach_routing}</span></div>}
                  {settings.bank_wire_routing && <div className="flex justify-between gap-4"><span className="text-slate-500 shrink-0">Wire Routing:</span><span className="text-white font-mono text-xs">{settings.bank_wire_routing}</span></div>}
                  {settings.bank_address && <div className="flex justify-between gap-4"><span className="text-slate-500 shrink-0">{isRtl ? 'عنوان البنك:' : 'Bank Address'}:</span><span className="text-white text-xs text-end">{settings.bank_address}</span></div>}
                </div>
                <p className="text-slate-500 text-xs mt-3">{t.transfer_note}</p>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-300 text-sm">🚧 {t.card_note}</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading || !usdtAmount || !wallet}
            className="btn-primary w-full text-lg py-4 disabled:opacity-50">
            {loading ? '...' : `${t.submit_order} — ${sarAmount} ${isRtl ? 'ريال' : 'SAR'}`}
          </button>
        </form>
      </div>
    </div>
  )
}
