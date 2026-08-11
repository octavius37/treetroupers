import { describe, expect, it } from 'vitest'
import { appRouter } from '~~/server/trpc/routers'

const caller = appRouter.createCaller({})

describe('appRouter.hello', () => {
  it('greets the supplied text', async () => {
    const result = await caller.hello({ text: 'tree troupe' })

    expect(result.greeting).toBe('hello tree troupe')
  })

  it('falls back to "world" when text is null', async () => {
    await expect(caller.hello({ text: null })).resolves.toMatchObject({ greeting: 'hello world' })
  })

  it('falls back to "world" when text is omitted', async () => {
    await expect(caller.hello({})).resolves.toMatchObject({ greeting: 'hello world' })
  })

  it('returns a Date, which is why the client needs the superjson transformer', async () => {
    const result = await caller.hello({ text: 'x' })

    expect(result.time).toBeInstanceOf(Date)
  })

  it('rejects a non-string text rather than coercing it', async () => {
    // @ts-expect-error deliberately violating the input schema
    await expect(caller.hello({ text: 42 })).rejects.toThrow()
  })
})
