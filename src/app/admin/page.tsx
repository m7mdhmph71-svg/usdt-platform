'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Lang, translations } from '@/lib/i18n'

interface Order {
  id: number
  user_name: string
  user_email: string
  user_phone: string
  usdt_amount: number
  sar_amount: number
  rate: number
  wallet_address: string
  payment_method: string
  status: string
  notes: string
  created_at: string
  updated_at: string
}

interface Stats {
  total: number
  completed: number
  pending: number
  total_volume: number
}

export default function AdminPage() {
  const [lang, setLang] = useState<Lang>('ar')
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, pending: 0, total_volume: 0 })
  const [filter, setFilter] = useState<string>('all')
  const [editingOrder, setEditingOrder] = useState<number | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const t = translations[lang]
  const isRtl = lang === 'ar'

  async function loadOrders() {
    const res = await fetch('/api/admin/orders')
    if (res.status === 403) { router.push('/'); return }
    const data = await res.json()
    setOrders(data.orders || [])
    setStats(data.stats || { total: 0, completed: 0, pending: 0, total_volume: 0 })
    setLoading(false)
  }

  useEffect(() => { loadOrders() }, [])

  async function saveOrder(id: number) {
    setSaving(true)
    await fetch('/api/admin/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: id, status: editStatus, notes: editNotes })
    })
    setSaving(false)
    setEditingOrder(null)
    loadOrders()
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const statusColors: Record<string, string> = {
    pending: 'status-pending', confirmed: 'status-confirmed',
    completed: 'status-completed', cancelled: 'status-cancelled'
  }

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="min-h-screen bg-slate-950">
      <Navbar lang={lang} user={{ name: isRtl ? 'المدير' : 'Admin', role: 'admin' }} onLangChange={setLang} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">{t.admin}</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t.total_orders, val: stats.total, color: 'text-white', icon: '📊' },
            { label: t.completed_orders, val: stats.completed, color: 'text-emerald-400', icon: '✅' },
            { label: t.pending_orders, val: stats.pending, color: 'text-yellow-400', icon: '⏳' },
            { label: t.total_volume, val: `${(stats.total_volume || 0).toFixed(0)} USDT`, color: 'text-blue-400', icon: '💰' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
              <div className="text-slate-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${filter === f ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
              {f === 'all' ? (isRtl ? 'الكل' : 'All') : t[f as keyof typeof t] as string}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400">...</div>
        ) : (
          <div className="space-y-4">
            {filtered.map(order => (
              <div key={order.id} className="card">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  {/* Order info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <span className="text-slate-400 font-mono text-sm">#{order.id}</span>
                      <span className={statusColors[order.status]}>{t[order.status as keyof typeof t] as string}</span>
                      <span className="text-slate-500 text-sm">{new Date(order.created_at).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Customer */}
                      <div className="bg-slate-900 rounded-xl p-3">
                        <h4 className="text-slate-500 text-xs mb-2">{t.customer}</h4>
                        <p className="text-white font-medium">{order.user_name}</p>
                        <p className="text-slate-400 text-sm">{order.user_email}</p>
                        <p className="text-slate-400 text-sm">{order.user_phone}</p>
                      </div>

                      {/* Order details */}
                      <div className="bg-slate-900 rounded-xl p-3">
                        <h4 className="text-slate-500 text-xs mb-2">{isRtl ? 'تفاصيل الطلب' : 'Order Details'}</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-400">USDT:</span>
                            <span className="text-emerald-400 font-bold">{order.usdt_amount} USDT</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">{isRtl ? 'ريال:' : 'SAR:'}</span>
                            <span className="text-white font-semibold">{order.sar_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">{isRtl ? 'طريقة الدفع:' : 'Payment:'}</span>
                            <span className="text-white">{order.payment_method === 'bank' ? (isRtl ? 'تحويل بنكي' : 'Bank') : (isRtl ? 'بطاقة' : 'Card')}</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <p className="text-slate-500 text-xs">{isRtl ? 'المحفظة:' : 'Wallet:'}</p>
                          <p className="text-white font-mono text-xs break-all">{order.wallet_address}</p>
                        </div>
                      </div>
                    </div>

                    {order.notes && (
                      <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-3 py-2">
                        <p className="text-blue-300 text-sm">{order.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Edit */}
                  <div className="flex-shrink-0">
                    {editingOrder === order.id ? (
                      <div className="bg-slate-900 rounded-xl p-4 min-w-52">
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                          className="input-field mb-3 text-sm">
                          <option value="pending">{t.pending}</option>
                          <option value="confirmed">{t.confirmed}</option>
                          <option value="completed">{t.completed}</option>
                          <option value="cancelled">{t.cancelled}</option>
                        </select>
                        <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                          className="input-field mb-3 text-sm h-20 resize-none" placeholder={isRtl ? 'ملاحظات...' : 'Notes...'} />
                        <div className="flex gap-2">
                          <button onClick={() => saveOrder(order.id)} disabled={saving}
                            className="btn-primary text-sm py-2 px-4 flex-1 disabled:opacity-60">{t.save}</button>
                          <button onClick={() => setEditingOrder(null)}
                            className="border border-slate-600 text-slate-400 rounded-xl px-3 py-2 text-sm hover:text-white transition-colors">✕</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingOrder(order.id); setEditStatus(order.status); setEditNotes(order.notes || '') }}
                        className="btn-secondary text-sm py-2 px-4">{t.update_status}</button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="card text-center py-12 text-slate-400">
                {isRtl ? 'لا توجد طلبات' : 'No orders found'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
