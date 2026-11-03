import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { parseCityIndex, searchCities, type IndexedCity } from './cities'

const cityIndex: IndexedCity[] = [
  {
    location: {
      geonameId: 3860259,
      name: 'Córdoba',
      countryCode: 'AR',
      admin1: 'Cordoba',
      latitude: -31.4135,
      longitude: -64.18105,
      timeZone: 'America/Argentina/Cordoba',
      population: 1_428_214,
    },
    normalizedName: 'cordoba',
    normalizedRegion: 'cordoba',
    normalizedCountry: 'argentina',
  },
  {
    location: {
      geonameId: 3936456,
      name: 'Lima',
      countryCode: 'PE',
      admin1: 'Lima',
      latitude: -12.04318,
      longitude: -77.02824,
      timeZone: 'America/Lima',
      population: 7_737_002,
    },
    normalizedName: 'lima',
    normalizedRegion: 'lima',
    normalizedCountry: 'peru',
  },
]

describe('searchCities', () => {
  it('finds city names without requiring accent marks', () => {
    expect(searchCities(cityIndex, 'cordoba')[0].name).toBe('Córdoba')
  })

  it('does not return results for a one-character query', () => {
    expect(searchCities(cityIndex, 'l')).toEqual([])
  })
})

describe('parseCityIndex', () => {
  it('retains coordinates, timezone, and population from the bundled TSV', () => {
    const index = parseCityIndex('id\tname\tcountry\tadmin1\tlatitude\tlongitude\ttimezone\tpopulation\n3435910\tBuenos Aires\tAR\t07\t-34.6037\t-58.3816\tAmerica/Argentina/Buenos_Aires\t13076300')
    expect(index[0].location).toMatchObject({
      geonameId: 3435910,
      name: 'Buenos Aires',
      latitude: -34.6037,
      longitude: -58.3816,
      timeZone: 'America/Argentina/Buenos_Aires',
      population: 13_076_300,
    })
  })

  it('ships a broad offline city index with IANA zones', async () => {
    const data = await readFile(new URL('../../public/data/cities.tsv', import.meta.url), 'utf8')
    const index = parseCityIndex(data)
    const buenosAires = index.find(({ location }) => location.name === 'Buenos Aires' && location.countryCode === 'AR')

    expect(index.length).toBeGreaterThan(65_000)
    expect(buenosAires?.location.timeZone).toBe('America/Argentina/Buenos_Aires')
  })
})
