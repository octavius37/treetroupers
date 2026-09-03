import { vi } from 'vitest'

// Stands in for Nitro's virtual `#supabase/server` module (see the alias in
// vitest.config.ts). Tests import this file by relative path so it type-checks,
// while the code under test reaches the same module instance via the alias.
export const serverSupabaseUser = vi.fn()
export const serverSupabaseServiceRole = vi.fn()
export const serverSupabaseClient = vi.fn()
export const serverSupabaseSession = vi.fn()
