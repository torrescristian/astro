import { Temporal } from '@js-temporal/polyfill'

export type TimeChoice = 'earlier' | 'later'
export type TimeCandidate = { instant: string; offset: string }

export type BirthTimeResolution =
  | { status: 'resolved'; candidate: TimeCandidate }
  | { status: 'ambiguous'; earlier: TimeCandidate; later: TimeCandidate }
  | { status: 'nonexistent' }
  | { status: 'invalid'; message: string }

function candidateFrom(zonedDateTime: Temporal.ZonedDateTime): TimeCandidate {
  return { instant: zonedDateTime.toInstant().toString(), offset: zonedDateTime.offset }
}

export function resolveBirthTime(
  date: string,
  time: string,
  timeZone: string,
  choice?: TimeChoice,
): BirthTimeResolution {
  try {
    const localDateTime = Temporal.PlainDateTime.from(`${date}T${time}`)
    const earlier = localDateTime.toZonedDateTime(timeZone, { disambiguation: 'earlier' })
    const later = localDateTime.toZonedDateTime(timeZone, { disambiguation: 'later' })
    const earlierMatches = earlier.toPlainDateTime().equals(localDateTime)
    const laterMatches = later.toPlainDateTime().equals(localDateTime)

    if (!earlierMatches && !laterMatches) return { status: 'nonexistent' }
    if (earlierMatches && laterMatches && earlier.epochNanoseconds !== later.epochNanoseconds) {
      if (!choice) return { status: 'ambiguous', earlier: candidateFrom(earlier), later: candidateFrom(later) }
      return { status: 'resolved', candidate: candidateFrom(choice === 'earlier' ? earlier : later) }
    }

    return { status: 'resolved', candidate: candidateFrom(earlierMatches ? earlier : later) }
  } catch (error) {
    return {
      status: 'invalid',
      message: error instanceof Error ? error.message : 'La fecha, hora o zona horaria no es válida.',
    }
  }
}
