import { describe, expect, it } from 'vitest'
import { calculateMercuryTransit, calculateNatalChart } from './natalChart'

const buenosAires = {
  geonameId: 3435910,
  name: 'Buenos Aires',
  countryCode: 'AR',
  admin1: 'Buenos Aires',
  latitude: -34.61315,
  longitude: -58.37723,
  timeZone: 'America/Argentina/Buenos_Aires',
  population: 13_076_300,
}

describe('calculateNatalChart', () => {
  it('calculates tropical planetary positions and whole-sign houses locally', () => {
    const chart = calculateNatalChart({ date: '2000-01-01', time: '12:00', location: buenosAires })
    const sun = chart.positions.find((position) => position.name === 'Sol')

    expect(chart.positions).toHaveLength(10)
    expect(sun?.sign).toBe('Capricornio')
    expect(sun?.longitude).toBeCloseTo(280.5, 0)
    expect(chart.ascendant).not.toBeNull()
    expect(chart.houseSystem).toBe('whole-sign')
    expect(chart.positions.every((position) => position.house !== null)).toBe(true)
    expect(chart.utcInstant).toBe('2000-01-01T15:00:00.000Z')
  })

  it('omits ascendant and houses when the birth time is unknown', () => {
    const chart = calculateNatalChart({ date: '2000-01-01', time: '', location: buenosAires })
    expect(chart.timeUnknown).toBe(true)
    expect(chart.ascendant).toBeNull()
    expect(chart.midheaven).toBeNull()
    expect(chart.houseSystem).toBeNull()
    expect(chart.positions.every((position) => position.house === null)).toBe(true)
  })
})

describe('calculateMercuryTransit', () => {
  it('distinguishes a current retrograde period from direct motion', () => {
    expect(calculateMercuryTransit(new Date('2024-04-10T12:00:00Z')).retrograde).toBe(true)
    expect(calculateMercuryTransit(new Date('2024-05-10T12:00:00Z')).retrograde).toBe(false)
  })
})
