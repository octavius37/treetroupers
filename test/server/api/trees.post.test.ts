import type { TableConfig } from '../../helpers/supabase-mock'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '~~/server/api/dashboard/trees.post'
import { captureError, createTestEvent, setRequestBody } from '../../helpers/nitro'
import { createSupabaseMock } from '../../helpers/supabase-mock'
import { serverSupabaseServiceRole } from '../../mocks/supabase-server'

const authUserId = vi.fn()

const PHOTOS = 'http://127.0.0.1:54421/storage/v1/object/public/tree-photos/'
const PHOTO_URL = `${PHOTOS}auth-user-1/3f1c2b9e-0000-4000-8000-000000000001.jpg`

const VALID_BODY = {
  species_id: 'species-1',
  community_id: 'community-1',
  lat: 52.3676,
  lng: 4.9041,
  notes: 'Planted by the canal',
  planted_at: '2026-08-11',
  photo_url: PHOTO_URL,
}

function withTables(tables: Record<string, TableConfig> = {}) {
  const supabase = createSupabaseMock({
    profiles: { data: { id: 'profile-1' } },
    trees: { data: { id: 'tree-1' } },
    ...tables,
  })
  const getPublicUrl = (path: string) => ({ data: { publicUrl: `${PHOTOS}${path}` } })
  Object.assign(supabase.client, { storage: { from: () => ({ getPublicUrl }) } })
  vi.mocked(serverSupabaseServiceRole).mockReturnValue(supabase.client)
  return supabase
}

describe('POST /api/dashboard/trees', () => {
  beforeEach(() => {
    vi.mocked(serverSupabaseServiceRole).mockReset()
    // Nitro auto-imports this from server/utils; it has its own unit tests.
    authUserId.mockReset().mockResolvedValue('auth-user-1')
    Object.assign(globalThis, { authUserId })
    setRequestBody({ ...VALID_BODY })
  })

  it('throws 401 without an authenticated user, before touching the database', async () => {
    authUserId.mockResolvedValue(null)
    const supabase = withTables()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(401)
    expect(supabase.calls).toHaveLength(0)
  })

  it('resolves the profile from the auth user id', async () => {
    const supabase = withTables()

    await handler(createTestEvent())

    expect(supabase.callFor('profiles').filters).toEqual([
      { method: 'eq', column: 'auth_user_id', value: 'auth-user-1' },
    ])
  })

  it('throws 404 when the user has no profile', async () => {
    const supabase = withTables({ profiles: { data: null } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('Profile not found')
    expect(supabase.callsFor('trees')).toHaveLength(0)
  })

  it('throws 404 when the profile lookup errors', async () => {
    withTables({ profiles: { data: null, error: { message: 'boom' } } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(404)
  })

  it('writes the PostGIS point as longitude then latitude', async () => {
    // WKT is POINT(x y) — longitude first. Reversing it puts every tree in the
    // wrong hemisphere without raising an error anywhere.
    const supabase = withTables()

    await handler(createTestEvent())

    const payload = supabase.callFor('trees').payload as { location: string }
    expect(payload.location).toBe('SRID=4326;POINT(4.9041 52.3676)')
  })

  it('attributes the tree to the resolved profile, not the auth user', async () => {
    // planted_by is a profiles.id foreign key; passing the auth uuid would be a
    // constraint violation at best and a mis-attribution at worst.
    const supabase = withTables()

    await handler(createTestEvent())

    expect((supabase.callFor('trees').payload as { planted_by: string }).planted_by).toBe('profile-1')
  })

  it('stores the remaining fields as given', async () => {
    const supabase = withTables()

    await handler(createTestEvent())

    expect(supabase.callFor('trees').payload).toMatchObject({
      species_id: 'species-1',
      community_id: 'community-1',
      notes: 'Planted by the canal',
      planted_at: '2026-08-11',
    })
  })

  it.each(['species_id', 'community_id'])('converts an empty %s to null', async (field) => {
    // The form submits '' for an unselected dropdown; '' is not a valid uuid.
    setRequestBody({ ...VALID_BODY, [field]: '' })
    const supabase = withTables()

    await handler(createTestEvent())

    expect((supabase.callFor('trees').payload as Record<string, unknown>)[field]).toBeNull()
  })

  it('throws 500 with the database message when the insert fails', async () => {
    withTables({ trees: { data: null, error: { message: 'violates foreign key constraint' } } })

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(500)
    expect(error.message).toBe('violates foreign key constraint')
  })

  it('returns the inserted row', async () => {
    withTables({ trees: { data: { id: 'tree-1', planted_by: 'profile-1' } } })

    await expect(handler(createTestEvent())).resolves.toEqual({ id: 'tree-1', planted_by: 'profile-1' })
  })

  // The photo is the proof an admin reviews before any points are paid.
  it.each([
    ['missing', undefined],
    ['empty', ''],
  ])('throws 400 when the photo is %s, before touching the database', async (_, photo_url) => {
    setRequestBody({ ...VALID_BODY, photo_url })
    const supabase = withTables()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(error.message).toBe('Please add a photo as proof')
    expect(supabase.calls).toHaveLength(0)
  })

  it.each([
    ['another user\'s upload', `${PHOTOS}auth-user-2/photo.jpg`],
    ['a path that climbs out of the user\'s folder', `${PHOTOS}auth-user-1/../auth-user-2/photo.jpg`],
    ['a different site', 'https://example.com/tree-photos/auth-user-1/photo.jpg'],
  ])('throws 400 for %s', async (_, photo_url) => {
    setRequestBody({ ...VALID_BODY, photo_url })
    const supabase = withTables()

    const error = await captureError(() => handler(createTestEvent()))

    expect(error.statusCode).toBe(400)
    expect(supabase.callsFor('trees')).toHaveLength(0)
  })

  it('stores the photo as the tree\'s only photo', async () => {
    const supabase = withTables()

    await handler(createTestEvent())

    expect((supabase.callFor('trees').payload as { photo_urls: string[] }).photo_urls).toEqual([PHOTO_URL])
  })

  it('does not let the client set the review status', async () => {
    setRequestBody({ ...VALID_BODY, review_status: 'approved' })
    const supabase = withTables()

    await handler(createTestEvent())

    expect(supabase.callFor('trees').payload).not.toHaveProperty('review_status')
  })
})
