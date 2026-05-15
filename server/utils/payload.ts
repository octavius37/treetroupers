import { getPayload } from 'payload'
import config from '../../payload.config'

let payloadInstance: Awaited<ReturnType<typeof getPayload>> | null = null

export async function getPayloadClient() {
  if (payloadInstance) { return payloadInstance }

  payloadInstance = await getPayload({ config })

  // Handle idle client errors so a connection reset doesn't crash the server
  const pool = (payloadInstance.db as any)?.pool
  if (pool) {
    pool.on('error', (err: Error) => {
      console.warn('[Payload] DB pool error, will reconnect on next request:', err.message)
      payloadInstance = null
    })
  }

  return payloadInstance
}
