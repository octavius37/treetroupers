import type { H3Event } from 'h3'
import { createError, defineEventHandler } from 'h3'

/**
 * Nitro auto-imports `defineEventHandler`, `createError`, `readBody` and
 * `getRouterParam` into every server file, so those bare identifiers resolve to
 * globals at runtime and are simply missing under plain Vitest.
 *
 * `createError` and `defineEventHandler` come from the real h3 package, so status
 * codes and error shapes are genuine. `readBody` and `getRouterParam` read from a
 * real Node request, so they are backed by per-test state instead.
 */

let requestBody: unknown = {}
let routerParams: Record<string, string | undefined> = {}

/** The body the next `readBody(event)` call will resolve to. */
export function setRequestBody(body: unknown) {
  requestBody = body
}

/** The params the next `getRouterParam(event, name)` calls will read. */
export function setRouterParams(params: Record<string, string | undefined>) {
  routerParams = params
}

export function resetNitroGlobals() {
  requestBody = {}
  routerParams = {}
}

export function installNitroGlobals() {
  Object.assign(globalThis, {
    defineEventHandler,
    createError,
    readBody: async () => requestBody,
    getRouterParam: (_event: H3Event, name: string) => routerParams[name],
  })
}

/**
 * A minimal H3Event. Nothing under test reads from it — handlers pass it
 * straight to `serverSupabaseServiceRole` / `readBody`, both of which are
 * doubles here — so identity is all it needs to provide.
 */
export function createTestEvent(): H3Event {
  return { context: {}, node: { req: {}, res: {} } } as unknown as H3Event
}

/**
 * Runs `fn` and returns the h3 error it threw. Fails loudly if it resolves,
 * so a handler that silently stops rejecting can't pass as a green test.
 */
export async function captureError(fn: () => Promise<unknown>) {
  try {
    await fn()
  }
  catch (error) {
    return error as { statusCode?: number, message?: string }
  }
  throw new Error('Expected the call to throw, but it resolved')
}
