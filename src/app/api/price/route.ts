import { NextRequest, NextResponse } from 'next/server'
import { getSettings, getPriceTiers, getRateForAmount, initDb } from '@/lib/db'

export async function GET(req: NextRequest) {
  await initDb()
  const settings = await getSettings()
  const tiers = await getPriceTiers()

  const { searchParams } = new URL(req.url)
  const amount = parseFloat(searchParams.get('amount') || '0')
  const rate = amount > 0 ? getRateForAmount(amount, tiers) : tiers[0]?.rate ?? 4.3

  return NextResponse.json({
    rate, tiers,
    min_order: parseFloat(settings.min_order || '1'),
    max_order: parseFloat(settings.max_order || '50000'),
    bank_name: settings.bank_name,
    bank_iban: settings.bank_iban,
    bank_account_name: settings.bank_account_name,
  })
}
