import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/contact.post'
import { captureError, createTestEvent, setRequestBody, setRequestIP } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const VALID = { name: 'Ada', email: 'ada@example.com', subject: 'Hello\nthere', message: 'Can I volunteer?' }

const fetchMock = vi.fn()

function withRateLimit(allowed = true) {
  const supabase = createSupabaseMock({ 'rpc:hit_rate_limit': { data: allowed } })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client as never)
  return supabase
}

beforeEach(() => {
  vi.stubEnv('RESEND_API_KEY', 're_test')
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset().mockResolvedValue({ ok: true, text: async () => '' })
  setRequestIP('203.0.113.7')
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('POST /api/contact', () => {
  it('sends the message, keeping the subject on one line', async () => {
    const supabase = withRateLimit()
    setRequestBody(VALID)

    expect(await handler(createTestEvent())).toEqual({ success: true })

    const sent = JSON.parse(fetchMock.mock.calls[0]![1].body)
    expect(sent).toMatchObject({ reply_to: 'ada@example.com', subject: '[Contact form] Hello there' })
    expect(supabase.callFor('rpc:hit_rate_limit').payload).toEqual({ p_key: 'contact:203.0.113.7', p_limit: 5, p_window_seconds: 3600 })
  })

  it('quietly drops a submission that filled the honeypot', async () => {
    const supabase = withRateLimit()
    setRequestBody({ ...VALID, website: 'http://spam.example' })

    expect(await handler(createTestEvent())).toEqual({ success: true })

    expect(fetchMock).not.toHaveBeenCalled()
    expect(supabase.calls).toHaveLength(0)
  })

  it.each([
    ['a missing field', { ...VALID, message: '   ' }],
    ['an invalid email', { ...VALID, email: 'not-an-email' }],
    ['an over-long message', { ...VALID, message: 'x'.repeat(5001) }],
    ['an over-long name', { ...VALID, name: 'x'.repeat(101) }],
  ])('refuses %s without sending or counting it', async (_case, body) => {
    const supabase = withRateLimit()
    setRequestBody(body)

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 429 without sending once the IP has hit its limit', async () => {
    withRateLimit(false)
    setRequestBody(VALID)

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(429)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
