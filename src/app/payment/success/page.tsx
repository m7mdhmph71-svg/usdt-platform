'use client'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-white mb-2">تم الدفع بنجاح!</h1>
        <p className="text-slate-400 text-sm mb-6">
          تم استلام دفعتك. سيتم إرسال USDT إلى محفظتك فور تأكيد العملية.
        </p>
        <Link href="/dashboard" className="btn-primary inline-block">
          متابعة الطلبات
        </Link>
      </div>
    </div>
  )
}
