import { vi } from 'vitest'

/**
 * A stand-in for a Supabase client, covering the query shapes this codebase
 * actually builds:
 *
 *   .from(t).select(cols).eq(col, val).single() / .maybeSingle()
 *   .from(t).select(cols, { count: 'exact', head: true })   // awaited directly
 *   .from(t).select(cols).order(col).limit(n)                // awaited directly
 *   .from(t).insert(payload).select().single()
 *   .from(t).update(payload).eq(col, val).select().single()
 *   .from(t).delete().eq(col, val)
 *
 * Every chain method returns the builder; terminal methods resolve to the result
 * configured for that table. The builder is thenable so `await client.from(...)`
 * works without an explicit terminal call.
 *
 * Calls are recorded so tests can assert *what was queried*, not only what came
 * back — needed to pin down filters like `auth_user_id = <sub>` and
 * `status = 'published'`.
 */

export type Operation = 'select' | 'insert' | 'update' | 'delete'

export interface QueryResult {
  data?: unknown
  error?: unknown
  count?: number | null
}

/** Either one result for every operation on a table, or one per operation. */
export type TableConfig = QueryResult | Partial<Record<Operation, QueryResult>>

export interface Filter {
  method: string
  column: string
  value: unknown
}

export interface RecordedCall {
  table: string
  operation: Operation
  columns?: string
  options?: Record<string, unknown>
  payload?: unknown
  filters: Filter[]
  order?: string
  limit?: number
  /** `await` means the chain was awaited without single()/maybeSingle(). */
  terminal: 'single' | 'maybeSingle' | 'await'
}

const EMPTY: Required<QueryResult> = { data: null, error: null, count: null }
const OPERATIONS: Operation[] = ['select', 'insert', 'update', 'delete']

function isOperationMap(config: TableConfig): config is Partial<Record<Operation, QueryResult>> {
  return OPERATIONS.some(op => op in config)
}

function resultFor(config: TableConfig | undefined, operation: Operation): Required<QueryResult> {
  if (!config) {
    return { ...EMPTY }
  }
  const result = isOperationMap(config) ? config[operation] : config
  return { ...EMPTY, ...result }
}

export interface SupabaseMock {
  client: { from: ReturnType<typeof vi.fn> }
  /** Every `.from()` chain, in order, with its filters and terminal method. */
  calls: RecordedCall[]
  /** The single call against `table`; throws unless there is exactly one. */
  callFor: (table: string) => RecordedCall
  callsFor: (table: string) => RecordedCall[]
}

export function createSupabaseMock(tables: Record<string, TableConfig> = {}): SupabaseMock {
  const calls: RecordedCall[] = []

  const from = vi.fn((table: string) => {
    // `operation` starts as select and is overwritten by insert/update/delete;
    // the trailing `.select()` in `insert().select()` must not clobber it.
    const call: RecordedCall = { table, operation: 'select', filters: [], terminal: 'await' }
    let operationSet = false
    calls.push(call)

    const settle = () => Promise.resolve(resultFor(tables[table], call.operation))

    const setOperation = (operation: Operation) => {
      call.operation = operation
      operationSet = true
    }

    const builder = {
      select(columns?: string, options?: Record<string, unknown>) {
        if (!operationSet) {
          setOperation('select')
        }
        if (columns !== undefined) {
          call.columns = columns
        }
        if (options !== undefined) {
          call.options = options
        }
        return builder
      },
      insert(payload: unknown) {
        setOperation('insert')
        call.payload = payload
        return builder
      },
      update(payload: unknown) {
        setOperation('update')
        call.payload = payload
        return builder
      },
      upsert(payload: unknown) {
        setOperation('insert')
        call.payload = payload
        return builder
      },
      delete() {
        setOperation('delete')
        return builder
      },
      eq(column: string, value: unknown) {
        call.filters.push({ method: 'eq', column, value })
        return builder
      },
      neq(column: string, value: unknown) {
        call.filters.push({ method: 'neq', column, value })
        return builder
      },
      is(column: string, value: unknown) {
        call.filters.push({ method: 'is', column, value })
        return builder
      },
      in(column: string, value: unknown) {
        call.filters.push({ method: 'in', column, value })
        return builder
      },
      ilike(column: string, value: unknown) {
        call.filters.push({ method: 'ilike', column, value })
        return builder
      },
      order(column: string) {
        call.order = column
        return builder
      },
      limit(count: number) {
        call.limit = count
        return builder
      },
      single() {
        call.terminal = 'single'
        return settle()
      },
      maybeSingle() {
        call.terminal = 'maybeSingle'
        return settle()
      },
      // Deliberately thenable: Supabase's own PostgrestFilterBuilder is, which is
      // what lets `await client.from(...).select(...)` work with no terminal call.
      // oxlint-disable-next-line no-thenable
      then<T>(
        onFulfilled?: (value: Required<QueryResult>) => T,
        onRejected?: (reason: unknown) => T,
      ) {
        return settle().then(onFulfilled, onRejected)
      },
    }

    return builder
  })

  const callsFor = (table: string) => calls.filter(call => call.table === table)

  return {
    client: { from },
    calls,
    callsFor,
    callFor(table: string) {
      const matches = callsFor(table)
      if (matches.length !== 1) {
        throw new Error(
          `Expected exactly one query against "${table}", got ${matches.length}`
          + ` (tables queried: ${calls.map(c => c.table).join(', ') || 'none'})`,
        )
      }
      return matches[0]!
    },
  }
}
