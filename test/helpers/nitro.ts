import type { H3Event, MultiPartData } from 'h3'
import { createError, defineEventHandler } from 'h3'

/**
 * Nitro auto-imports `defineEventHandler`, `createError`, `readBody`,
 * `readMultipartFormData`, `getRouterParam`, `getQuery`, `getHeader` and `getRequestIP` into every server file, so those
 * bare identifiers resolve to globals at runtime and are simply missing under
 * plain Vitest.
 *
 * `createError` and `defineEventHandler` come from the real h3 package, so status
 * codes and error shapes are genuine. The others read from a real Node
 * request, so they are backed by per-test state instead.
 */

let requestBody: unknown = {}
let multipartParts: MultiPartData[] | undefined
let routerParams: Record<string, string | undefined> = {}
let query: Record<string, unknown> = {}
let headers: Record<string, string | undefined> = {}
let requestIP: string | undefined

/** The body the next `readBody(event)` call will resolve to. */
export function setRequestBody(body: unknown) {
  requestBody = body
}

/** The parts the next `readMultipartFormData(event)` call will resolve to. */
export function setMultipartFormData(parts: MultiPartData[] | undefined) {
  multipartParts = parts
}

/** The params the next `getRouterParam(event, name)` calls will read. */
export function setRouterParams(params: Record<string, string | undefined>) {
  routerParams = params
}

/** The query the next `getQuery(event)` calls will return. */
export function setQuery(params: Record<string, unknown>) {
  query = params
}

/** The request headers `getHeader(event, name)` will read (lower-case names). */
export function setHeaders(values: Record<string, string | undefined>) {
  headers = values
}

/** The client IP `getRequestIP(event)` will return. */
export function setRequestIP(ip: string | undefined) {
  requestIP = ip
}

export function resetNitroGlobals() {
  requestBody = {}
  multipartParts = undefined
  routerParams = {}
  query = {}
  headers = {}
  requestIP = undefined
}

export function installNitroGlobals() {
  Object.assign(globalThis, {
    defineEventHandler,
    createError,
    readBody: async () => requestBody,
    readMultipartFormData: async () => multipartParts,
    getRouterParam: (_event: H3Event, name: string) => routerParams[name],
    getQuery: () => query,
    getHeader: (_event: H3Event, name: string) => headers[name.toLowerCase()],
    getRequestIP: () => requestIP,
    useRuntimeConfig: () => ({ public: { siteUrl: 'http://localhost:3000' } }),
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
