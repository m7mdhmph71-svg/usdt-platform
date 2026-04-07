'use client'
import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-white mb-2">تم إلغاء الدفع</h1>
        <p className="text-slate-400 text-sm mb-6">
          لم تكتمل عملية الدفع. يمكنك المحاولة مجدداً أو استخدام التحويل البنكي.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard/new-order" className="btn-primary inline-block">
            حاول مجدداً
          </Link>
          <Link href="/dashboard" className="btn-secondary inline-block">
            طلباتي
          </Link>
        </div>
      </div>
    </div>
  )
}
