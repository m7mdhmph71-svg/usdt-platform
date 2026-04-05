'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { Lang, translations } from '@/lib/i18n'

interface Order {
  id: number
  usdt_amount: number
  sar_amount: number
  rate: number
  wallet_address: string
  payment_method: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  created_at: string
  notes?: string
}

export default function DashboardPage() {
  const [lang, setLang] = useState<Lang>('ar')
  const [orders, setOrders] = useState<Order[]>([])
  const [user, setUser] = useState<{ name: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const t = translations[lang]
  const isRtl = lang === 'ar'

  useEffect(() => {
    async function load() {
      const [ordersRes] = await Promise.all([
        fetch('/api/orders'),
      ])
      if (ordersRes.status === 401) { router.push('/login'); return }
      const data = await ordersRes.json()
      setOrders(data.orders || [])

      // get user name from token - simple approach
      const tokenData = document.cookie.split(';').find(c => c.includes('token'))
      if (tokenData) {
        // Decode JWT payload
        try {
          const token = tokenData.split('=')[1]?.trim()
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]))
            setUser({ name: payload.name, role: payload.role })
          }
        } catch { /* ignore */ }
      }
      setLoading(false)
    }
    load()
  }, [router])

  const statusClass = (s: string) => `status-${s}`
  const statusLabel = (s: string) => t[s as keyof typeof t] as string || s

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950">
      <Navbar lang={lang} user={user} onLangChange={setLang} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t.my_orders}</h1>
            {user && <p className="text-slate-400 text-sm mt-1">{isRtl ? 'مرحباً،' : 'Welcome,'} {user.name}</p>}
          </div>
          <Link href="/dashboard/new-order" className="btn-primary">
            + {t.new_order}
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">...</div>
        ) : orders.length === 0 ? (
          <div className="card text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-slate-400 mb-6">{t.no_orders}</p>
            <Link href="/dashboard/new-order" className="btn-primary inline-block">{t.new_order}</Link>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: t.total_orders, val: orders.length, color: 'text-white' },
                { label: t.completed_orders, val: orders.filter(o => o.status === 'completed').length, color: 'text-emerald-400' },
                { label: t.pending_orders, val: orders.filter(o => o.status === 'pending').length, color: 'text-yellow-400' },
                { label: t.total_volume, val: orders.filter(o=>o.status==='completed').reduce((s,o)=>s+o.usdt_amount,0).toFixed(0) + ' USDT', color: 'text-blue-400' },
              ].map(s => (
                <div key={s.label} className="card text-center">
                  <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                  <div className="text-slate-400 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Orders table */}
            <div className="card overflow-hidden p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-900 border-b border-slate-700">
                    <tr>
                      {[t.order_id, t.amount_usdt, t.amount_sar, t.payment_method, t.wallet, t.status, t.date].map(h => (
                        <th key={h} className="text-start text-slate-400 text-sm font-medium px-4 py-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-4 text-slate-300 font-mono">#{order.id}</td>
                        <td className="px-4 py-4 text-emerald-400 font-semibold">{order.usdt_amount} USDT</td>
                        <td className="px-4 py-4 text-white">{order.sar_amount.toFixed(2)} {isRtl ? 'ريال' : 'SAR'}</td>
                        <td className="px-4 py-4 text-slate-300 text-sm">
                          {order.payment_method === 'bank' ? (isRtl ? 'تحويل بنكي' : 'Bank') : (isRtl ? 'بطاقة' : 'Card')}
                        </td>
                        <td className="px-4 py-4 text-slate-400 font-mono text-xs max-w-32 truncate">
                          {order.wallet_address}
                        </td>
                        <td className="px-4 py-4">
                          <span className={statusClass(order.status)}>{statusLabel(order.status)}</span>
                        </td>
                        <td className="px-4 py-4 text-slate-400 text-sm">
                          {new Date(order.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
