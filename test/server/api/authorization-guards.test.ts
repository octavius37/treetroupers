import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Every handler under server/api queries through `serverSupabaseServiceRole`,
 * which bypasses row-level security completely. Authorization therefore lives
 * entirely in application code, and a handler that forgets its guard is an
 * unauthenticated path to the database — not a 403.
 *
 * These tests read the source of every endpoint, including ones added later that
 * nobody wrote a test for.
 */

const serverApi = fileURLToPath(new URL('../../../server/api', import.meta.url))

async function handlersUnder(dir: string): Promise<string[]> {
  const entries = await readdir(join(serverApi, dir), { withFileTypes: true, recursive: true })
  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.ts'))
    .map(entry => join(entry.parentPath, entry.name))
}

/**
 * Comments are stripped before matching. A commented-out `requireAdmin(event)`
 * is exactly the regression these tests exist to catch, and it would otherwise
 * still satisfy a plain text search.
 */
function stripComments(source: string) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Ignore `//` preceded by `:` so URLs in strings survive.
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
}

async function read(path: string) {
  return stripComments(await readFile(path, 'utf8'))
}

function relative(path: string) {
  return path.slice(serverApi.length + 1)
}

const cmsHandlers = await handlersUnder('cms')
const dashboardHandlers = await handlersUnder('dashboard')

describe('server/api/cms/** authorization', () => {
  it('finds handlers to check, so this suite cannot silently pass on an empty list', () => {
    expect(cmsHandlers.length).toBeGreaterThan(0)
  })

  it.each(cmsHandlers.map(path => [relative(path), path] as const))(
    '%s calls requireAdmin',
    async (_name, path) => {
      expect(await read(path)).toMatch(/\brequireAdmin\s*\(/)
    },
  )

  it.each(cmsHandlers.map(path => [relative(path), path] as const))(
    '%s awaits its guard before any query',
    async (_name, path) => {
      // `requireAdmin(event)` without await resolves to a pending promise, which
      // is truthy, so the handler would carry on and query as an admin would.
      const source = await read(path)
      expect(source).toMatch(/\bawait\s+requireAdmin\s*\(|=\s*await\s+requireAdmin\s*\(/)

      const guardAt = source.search(/\brequireAdmin\s*\(/)
      const queryAt = source.search(/\bserverSupabase(ServiceRole|Client)\s*\(/)
      if (queryAt !== -1) {
        expect(guardAt).toBeLessThan(queryAt)
      }
    },
  )
})

describe('server/api/dashboard/** authorization', () => {
  it('finds handlers to check', () => {
    expect(dashboardHandlers.length).toBeGreaterThan(0)
  })

  it.each(dashboardHandlers.map(path => [relative(path), path] as const))(
    '%s establishes the caller before querying',
    async (_name, path) => {
      // Dashboard endpoints act on the caller's own rows, so they need an
      // identity even though they don't need admin.
      expect(await read(path)).toMatch(/\bawait\s+(authUserId|requireAdmin)\s*\(/)
    },
  )
})

describe('server/api/public/** exposure', () => {
  it('never reads a draft page without filtering on status', async () => {
    const paths = await handlersUnder('public')
    const sources = await Promise.all(
      paths.map(async path => [relative(path), await read(path)] as const),
    )

    for (const [name, source] of sources) {
      if (source.includes(`.from('pages')`)) {
        expect(source, `${name} queries pages`).toContain(`'status'`)
      }
    }
  })
})
