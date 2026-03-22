import { getPayload } from 'payload'
import config from '../../payload.config'

let payloadInstance: Awaited<ReturnType<typeof getPayload>> | null = null

export async function getPayloadClient() {
  if (payloadInstance) { return payloadInstance }

  payloadInstance = await getPayload({ config })
  return payloadInstance
}
