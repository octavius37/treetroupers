import { describe, expect, it } from 'vitest'
import { formatCo2 } from '~/utils/formatCo2'

describe('formatCo2', () => {
  it.each([
    [0, '0 kg'],
    [45.4, '45 kg'],
    [999, '999 kg'],
    [1250, '1.3 t'],
    [12_400, '12 t'],
  ])('shows %s kg as %s', (kg, text) => {
    expect(formatCo2(kg)).toBe(text)
  })
})
