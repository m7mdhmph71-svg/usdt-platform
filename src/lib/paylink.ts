const PAYLINK_APP_ID = process.env.PAYLINK_APP_ID || 'APP_ID_1756653001673'
const PAYLINK_SECRET_KEY = process.env.PAYLINK_SECRET_KEY || '9118993e-5100-3141-b6ec-aba296d59f9d'
const PAYLINK_BASE_URL = process.env.PAYLINK_ENV === 'production'
  ? 'https://restapi.paylink.sa'
  : 'https://restpilot.paylink.sa'

export async function getPaylinkToken(): Promise<string> {
  const res = await fetch(`${PAYLINK_BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiId: PAYLINK_APP_ID,
      secretKey: PAYLINK_SECRET_KEY,
      persistToken: false
    })
  })
  const data = await res.json()
  if (!data.id_token) throw new Error(`Paylink auth failed: ${JSON.stringify(data)}`)
  return data.id_token
}

interface CreateInvoiceParams {
  orderId: number | bigint
  amountSar: number
  usdtAmount: number
  clientName: string
  clientEmail: string
  clientPhone: string
  baseUrl: string
}

export async function createPaylinkInvoice(params: CreateInvoiceParams) {
  const token = await getPaylinkToken()

  const res = await fetch(`${PAYLINK_BASE_URL}/api/addInvoice`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      merchantOrderNumber: `ORDER-${params.orderId}`,
      amount: parseFloat(params.amountSar.toFixed(2)),
      currency: 'SAR',
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      clientMobile: params.clientPhone || '0500000000',
      products: [{
        title: `${params.usdtAmount} USDT`,
        price: parseFloat(params.amountSar.toFixed(2)),
        qty: 1,
        description: `شراء ${params.usdtAmount} USDT`
      }],
      callBackUrl: `${params.baseUrl}/api/paylink/callback`,
      cancelUrl: `${params.baseUrl}/payment/cancel`,
      note: `طلب شراء ${params.usdtAmount} USDT`
    })
  })

  const data = await res.json()
  return data // { url, transactionNo, ... }
}
