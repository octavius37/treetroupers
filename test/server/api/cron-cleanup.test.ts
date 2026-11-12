import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/cron/cleanup.get'
import { captureError, createTestEvent, setHeaders } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

function withOrphans(batches: string[][]) {
  const supabase = createSupabaseMock()
  const queue = [...batches]
  supabase.client.rpc.mockImplementation(async () => ({ data: queue.shift() ?? [], error: null }))
  const remove = vi.fn(async () => ({ data: [], error: null }))
  vi.mocked(serverSupabaseServiceRole).mockReturnValue({ ...supabase.client, storage: { from: () => ({ remove }) } } as never)
  return { supabase, remove }
}

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReset()
  vi.stubEnv('CRON_SECRET', 'cron-secret')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('GET /api/cron/cleanup', () => {
  it('refuses to run when CRON_SECRET is not set', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const { supabase } = withOrphans([])
    setHeaders({ authorization: 'Bearer ' })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(503)
    expect(supabase.calls).toHaveLength(0)
  })

  it('throws 401 without the secret, before touching anything', async () => {
    const { supabase, remove } = withOrphans([['a/1.jpg']])
    setHeaders({ authorization: 'Bearer wrong' })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(supabase.client.rpc).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it('deletes unreferenced photos and prunes old rate-limit hits', async () => {
    const { supabase, remove } = withOrphans([['a/1.jpg', 'b/2.png']])
    setHeaders({ authorization: 'Bearer cron-secret' })

    expect(await handler(createTestEvent())).toEqual({ photosDeleted: 2 })

    expect(remove).toHaveBeenCalledWith(['a/1.jpg', 'b/2.png'])
    expect(supabase.client.rpc).toHaveBeenCalledWith('orphaned_tree_photos', { p_older_than_hours: 24, p_limit: 1000 })
    const prune = supabase.callFor('rate_limit_hits')
    expect(prune.operation).toBe('delete')
  })

  it('keeps going while full batches come back', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => `u/${i}.jpg`)
    const { remove } = withOrphans([full, ['u/last.jpg']])
    setHeaders({ authorization: 'Bearer cron-secret' })

    expect(await handler(createTestEvent())).toEqual({ photosDeleted: 1001 })
    expect(remove).toHaveBeenCalledTimes(2)
  })
})
