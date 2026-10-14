import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { anonClient } from '../helpers/local-supabase'

// PostGIS's own tables must not be reachable through the REST API. While the
// extension lived in `public`, `spatial_ref_sys` was exposed with RLS disabled
// and full privileges for `anon`, so anyone with the public key could rewrite
// or delete the coordinate-system definitions every geography query relies on.
// The table is owned by `supabase_admin`, so the fix is moving PostGIS into the
// unexposed `extensions` schema (20261014092701_move_postgis_to_extensions_schema.sql).

describe('REST API exposure', () => {
  it('does not expose PostGIS\'s spatial_ref_sys table', async () => {
    // Untyped: the table is deliberately absent from database.types.ts.
    const anon = anonClient() as unknown as SupabaseClient
    const { data, error } = await anon.from('spatial_ref_sys').select('srid').limit(1)

    expect(data).toBeNull()
    expect(error?.code).toBe('PGRST205') // table not in the schema cache
  })
})
