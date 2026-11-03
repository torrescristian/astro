import {
  Body,
  GeoVector,
  RotateVector,
  Rotation_EQJ_ECT,
  SiderealTime,
  SphereFromVector,
} from 'astronomy-engine'
import { resolveBirthTime, type TimeChoice } from './birthTime'
import type { BirthLocation } from '../location/cities'

export const zodiacSigns = [
  { name: 'Aries', symbol: '♈', element: 'Fuego' },
  { name: 'Tauro', symbol: '♉', element: 'Tierra' },
  { name: 'Géminis', symbol: '♊', element: 'Aire' },
  { name: 'Cáncer', symbol: '♋', element: 'Agua' },
  { name: 'Leo', symbol: '♌', element: 'Fuego' },
  { name: 'Virgo', symbol: '♍', element: 'Tierra' },
  { name: 'Libra', symbol: '♎', element: 'Aire' },
  { name: 'Escorpio', symbol: '♏', element: 'Agua' },
  { name: 'Sagitario', symbol: '♐', element: 'Fuego' },
  { name: 'Capricornio', symbol: '♑', element: 'Tierra' },
  { name: 'Acuario', symbol: '♒', element: 'Aire' },
  { name: 'Piscis', symbol: '♓', element: 'Agua' },
] as const

export type PlanetPosition = {
  name: string
  symbol: string
  longitude: number
  sign: string
  degree: number
  house: number | null
  retrograde: boolean
}

export type ChartAngle = { longitude: number; sign: string; degree: number }
export type MercuryTransit = ChartAngle & { retrograde: boolean }
export type ChartAspect = {
  first: string
  second: string
  symbol: string
  name: string
  orb: number
}

export type NatalChart = {
  positions: PlanetPosition[]
  ascendant: ChartAngle | null
  midheaven: ChartAngle | null
  aspects: ChartAspect[]
  utcInstant: string
  timeUnknown: boolean
  houseSystem: 'whole-sign' | null
}

export type ChartInput = {
  date: string
  time: string
  timeChoice?: TimeChoice
  location: BirthLocation
}

const bodies: { body: Body; name: string; symbol: string }[] = [
  { body: Body.Sun, name: 'Sol', symbol: '☉' },
  { body: Body.Moon, name: 'Luna', symbol: '☾' },
  { body: Body.Mercury, name: 'Mercurio', symbol: '☿' },
  { body: Body.Venus, name: 'Venus', symbol: '♀' },
  { body: Body.Mars, name: 'Marte', symbol: '♂' },
  { body: Body.Jupiter, name: 'Júpiter', symbol: '♃' },
  { body: Body.Saturn, name: 'Saturno', symbol: '♄' },
  { body: Body.Uranus, name: 'Urano', symbol: '♅' },
  { body: Body.Neptune, name: 'Neptuno', symbol: '♆' },
  { body: Body.Pluto, name: 'Plutón', symbol: '♇' },
]

function normalizeDegrees(degrees: number) {
  return ((degrees % 360) + 360) % 360
}

function signedDegrees(degrees: number) {
  return ((degrees + 540) % 360) - 180
}

function angle(longitude: number): ChartAngle {
  const normalized = normalizeDegrees(longitude)
  const index = Math.floor(normalized / 30)
  return {
    longitude: normalized,
    sign: zodiacSigns[index].name,
    degree: normalized % 30,
  }
}

function tropicalLongitude(body: Body, instant: Date): number {
  const vector = GeoVector(body, instant, true)
  const eclipticVector = RotateVector(Rotation_EQJ_ECT(instant), vector)
  return normalizeDegrees(SphereFromVector(eclipticVector).lon)
}

function isRetrograde(body: Body, instant: Date) {
  const previous = tropicalLongitude(body, new Date(instant.getTime() - 86400000))
  const next = tropicalLongitude(body, new Date(instant.getTime() + 86400000))
  return signedDegrees(next - previous) < 0
}

export function calculateMercuryTransit(instant: Date): MercuryTransit {
  if (!Number.isFinite(instant.getTime())) throw new Error('La fecha del tránsito no es válida.')
  const position = angle(tropicalLongitude(Body.Mercury, instant))
  return { ...position, retrograde: isRetrograde(Body.Mercury, instant) }
}

function obliquityDegrees(instant: Date) {
  const centuries = (instant.getTime() - Date.UTC(2000, 0, 1, 12)) / (36525 * 86400000)
  return 23.439291 - 0.0130042 * centuries - 0.000000164 * centuries ** 2 + 0.000000504 * centuries ** 3
}

function calculateAscendant(instant: Date, latitude: number, longitude: number): number {
  const siderealAngle = normalizeDegrees(SiderealTime(instant) * 15 + longitude) * Math.PI / 180
  const latitudeRadians = latitude * Math.PI / 180
  const obliquity = obliquityDegrees(instant) * Math.PI / 180
  const a = Math.cos(latitudeRadians) * Math.cos(siderealAngle)
  const b = Math.cos(latitudeRadians) * Math.cos(obliquity) * Math.sin(siderealAngle)
    + Math.sin(latitudeRadians) * Math.sin(obliquity)
  let ascendant = normalizeDegrees(Math.atan2(a, -b) * 180 / Math.PI)
  const ascendantRadians = ascendant * Math.PI / 180
  const eastwardComponent = -Math.sin(siderealAngle) * Math.cos(ascendantRadians)
    + Math.cos(siderealAngle) * Math.cos(obliquity) * Math.sin(ascendantRadians)
  if (eastwardComponent < 0) ascendant = normalizeDegrees(ascendant + 180)
  return ascendant
}

function calculateMidheaven(instant: Date, longitude: number): number {
  const siderealAngle = normalizeDegrees(SiderealTime(instant) * 15 + longitude) * Math.PI / 180
  const obliquity = obliquityDegrees(instant) * Math.PI / 180
  return normalizeDegrees(Math.atan2(Math.sin(siderealAngle), Math.cos(siderealAngle) * Math.cos(obliquity)) * 180 / Math.PI)
}

function calculateAspects(positions: PlanetPosition[]): ChartAspect[] {
  const definitions = [
    { angle: 0, symbol: '☌', name: 'Conjunción', orb: 6 },
    { angle: 60, symbol: '⚹', name: 'Sextil', orb: 4 },
    { angle: 90, symbol: '□', name: 'Cuadratura', orb: 5 },
    { angle: 120, symbol: '△', name: 'Trígono', orb: 5 },
    { angle: 180, symbol: '☍', name: 'Oposición', orb: 6 },
  ]
  const aspects: ChartAspect[] = []

  for (let firstIndex = 0; firstIndex < positions.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < positions.length; secondIndex += 1) {
      const first = positions[firstIndex]
      const second = positions[secondIndex]
      const separation = Math.abs(signedDegrees(first.longitude - second.longitude))
      const luminaryAdjustment = ['Sol', 'Luna'].includes(first.name) || ['Sol', 'Luna'].includes(second.name) ? 2 : 0
      const match = definitions
        .map((definition) => ({ definition, orb: Math.abs(separation - definition.angle) }))
        .filter(({ definition, orb }) => orb <= definition.orb + luminaryAdjustment)
        .sort((left, right) => left.orb - right.orb)[0]

      if (match) aspects.push({
        first: first.name,
        second: second.name,
        symbol: match.definition.symbol,
        name: match.definition.name,
        orb: match.orb,
      })
    }
  }

  return aspects.sort((left, right) => left.orb - right.orb).slice(0, 12)
}

export function calculateNatalChart(input: ChartInput): NatalChart {
  const timeUnknown = !input.time
  const localTime = input.time || '12:00'
  const resolution = resolveBirthTime(input.date, localTime, input.location.timeZone, input.timeChoice)
  if (resolution.status === 'ambiguous') throw new Error('La hora de nacimiento es ambigua por un cambio horario; elige una de las dos opciones.')
  if (resolution.status === 'nonexistent') throw new Error('La hora de nacimiento no existió en esa ciudad por un cambio horario. Ajusta la hora.')
  if (resolution.status === 'invalid') throw new Error(resolution.message)

  const instant = new Date(resolution.candidate.instant)
  if (!Number.isFinite(instant.getTime())) throw new Error('No se pudo convertir la fecha de nacimiento a UTC.')

  const ascendant = timeUnknown
    ? null
    : angle(calculateAscendant(instant, input.location.latitude, input.location.longitude))
  const midheaven = timeUnknown
    ? null
    : angle(calculateMidheaven(instant, input.location.longitude))
  const ascendantSignIndex = ascendant ? Math.floor(ascendant.longitude / 30) : null
  const positions = bodies.map(({ body, name, symbol }) => {
    const longitude = tropicalLongitude(body, instant)
    const signIndex = Math.floor(longitude / 30)

    return {
      name,
      symbol,
      longitude,
      sign: zodiacSigns[signIndex].name,
      degree: longitude % 30,
      house: ascendantSignIndex === null ? null : ((signIndex - ascendantSignIndex + 12) % 12) + 1,
      retrograde: isRetrograde(body, instant),
    }
  })

  return {
    positions,
    ascendant,
    midheaven,
    aspects: calculateAspects(positions),
    utcInstant: instant.toISOString(),
    timeUnknown,
    houseSystem: ascendant ? 'whole-sign' : null,
  }
}
