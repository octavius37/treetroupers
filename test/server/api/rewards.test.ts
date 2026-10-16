import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import settle from '~~/server/api/cms/reward-claims/[id].put'
import list from '~~/server/api/dashboard/rewards.get'
import claim from '~~/server/api/dashboard/rewards/[id]/claim.post'
import { captureError, createTestEvent, setRequestBody, setRouterParams } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()
const requireAdmin = vi.fn()

function withTables(tables: Record<string, TableConfig>) {
  const supabase = createSupabaseMock({ profiles: { data: { id: 'p-1', role: 'user', total_points: 120 } }, ...tables })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

beforeEach(() => {
  vi.mocked(serverSupabaseServiceRole).mockReset()
  authUserId.mockReset().mockResolvedValue('auth-1')
  requireAdmin.mockReset().mockResolvedValue({ user: {}, profile: { id: 'p-admin', role: 'admin' } })
  Object.assign(globalThis, { authUserId, requireAdmin })
  setRouterParams({ id: 'r-1' })
})

describe('GET /api/dashboard/rewards', () => {
  it('marks rewards unlocked by points and shows the member\'s claims', async () => {
    withTables({
      rewards: { data: [
        { id: 'r-1', title: 'Seedling', description: null, points_required: 50, type: 'badge' },
        { id: 'r-2', title: 'Discount', description: null, points_required: 100, type: 'discount' },
        { id: 'r-3', title: 'Hoodie', description: null, points_required: 500, type: 'physical' },
      ] },
      reward_redemptions: { data: [{ reward_id: 'r-2', status: 'pending' }] },
    })

    const result = await list(createTestEvent())

    expect(result.points).toBe(120)
    expect(result.rewards.map(r => [r.id, r.unlocked, r.claimable, r.claim])).toEqual([
      ['r-1', true, false, null],
      ['r-2', true, true, 'pending'],
      ['r-3', false, true, null],
    ])
  })
})

describe('POST /api/dashboard/rewards/:id/claim', () => {
  it('throws 401 without a user, before touching the database', async () => {
    authUserId.mockResolvedValue(null)
    const supabase = withTables({})

    expect((await captureError(() => claim(createTestEvent()))).statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })

  it('refuses a badge, which unlocks by itself', async () => {
    const supabase = withTables({ rewards: { data: { id: 'r-1', type: 'badge', points_required: 50, active: true } } })

    expect((await captureError(() => claim(createTestEvent()))).statusCode).toBe(400)
    expect(supabase.callsFor('reward_redemptions')).toHaveLength(0)
  })

  it('refuses a reward the member hasn\'t enough points for', async () => {
    const supabase = withTables({ rewards: { data: { id: 'r-1', type: 'physical', points_required: 500, active: true } } })

    expect((await captureError(() => claim(createTestEvent()))).statusCode).toBe(403)
    expect(supabase.callsFor('reward_redemptions')).toHaveLength(0)
  })

  it('refuses an inactive reward', async () => {
    withTables({ rewards: { data: { id: 'r-1', type: 'physical', points_required: 50, active: false } } })

    expect((await captureError(() => claim(createTestEvent()))).statusCode).toBe(404)
  })

  it('records a claim for an unlocked reward', async () => {
    const supabase = withTables({ rewards: { data: { id: 'r-1', type: 'physical', points_required: 100, active: true } } })

    await expect(claim(createTestEvent())).resolves.toEqual({ claimed: true })
    expect(supabase.callFor('reward_redemptions').payload).toEqual({ profile_id: 'p-1', reward_id: 'r-1' })
  })

  it('answers 409 for a second claim', async () => {
    withTables({
      rewards: { data: { id: 'r-1', type: 'physical', points_required: 100, active: true } },
      reward_redemptions: { data: null, error: { code: '23505', message: 'duplicate key' } },
    })

    expect((await captureError(() => claim(createTestEvent()))).statusCode).toBe(409)
  })
})

describe('PUT /api/cms/reward-claims/:id', () => {
  it('requires an admin before doing anything else', async () => {
    requireAdmin.mockRejectedValue(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
    const supabase = withTables({})
    setRequestBody({ status: 'fulfilled' })

    expect((await captureError(() => settle(createTestEvent()))).statusCode).toBe(403)
    expect(supabase.calls).toHaveLength(0)
  })

  it.each([[{ status: 'pending' }], [{}], [null]])('throws 400 for %o', async (body) => {
    withTables({})
    setRequestBody(body)

    expect((await captureError(() => settle(createTestEvent()))).statusCode).toBe(400)
  })

  it('marks a pending claim as sent', async () => {
    const supabase = withTables({ reward_redemptions: { data: { id: 'r-1', status: 'fulfilled' } } })
    setRequestBody({ status: 'fulfilled' })

    await settle(createTestEvent())

    const call = supabase.callFor('reward_redemptions')
    expect(call.payload).toMatchObject({ status: 'fulfilled' })
    expect(call.filters).toContainEqual({ method: 'eq', column: 'status', value: 'pending' })
  })
})
