import { describe, expect, it } from 'vitest'
import { resolveBirthTime } from './birthTime'

describe('resolveBirthTime', () => {
  it('converts a local birth time using the selected IANA timezone', () => {
    const result = resolveBirthTime('2000-01-01', '12:00', 'America/Argentina/Buenos_Aires')
    expect(result.status).toBe('resolved')
    if (result.status === 'resolved') expect(result.candidate.instant).toBe('2000-01-01T15:00:00Z')
  })

  it('requires a choice for a repeated time during the autumn clock change', () => {
    const result = resolveBirthTime('2024-11-03', '01:30', 'America/New_York')
    expect(result.status).toBe('ambiguous')
    if (result.status === 'ambiguous') {
      expect(Date.parse(result.later.instant) - Date.parse(result.earlier.instant)).toBe(60 * 60 * 1000)
    }
  })

  it('rejects a local time skipped during the spring clock change', () => {
    expect(resolveBirthTime('2024-03-10', '02:30', 'America/New_York').status).toBe('nonexistent')
  })

  it('resolves a repeated time when the user explicitly chooses an occurrence', () => {
    const result = resolveBirthTime('2024-11-03', '01:30', 'America/New_York', 'later')
    expect(result.status).toBe('resolved')
    if (result.status === 'resolved') expect(result.candidate.instant).toBe('2024-11-03T06:30:00Z')
  })
})
