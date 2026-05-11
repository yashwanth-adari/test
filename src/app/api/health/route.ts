import { json } from '@/lib/shared/json'

export async function GET() {
  return json({
    ok: true,
    service: 'finance-movements',
    timestamp: new Date().toISOString(),
  })
}
