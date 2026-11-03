export type BirthLocation = {
  geonameId: number
  name: string
  countryCode: string
  admin1: string
  latitude: number
  longitude: number
  timeZone: string
  population: number
}

export type IndexedCity = {
  location: BirthLocation
  normalizedName: string
  normalizedRegion: string
  normalizedCountry: string
}

let cityIndexPromise: Promise<IndexedCity[]> | null = null

export function loadCityIndex(): Promise<IndexedCity[]> {
  if (!cityIndexPromise) {
    cityIndexPromise = fetchCityIndex().catch((error: unknown) => {
      cityIndexPromise = null
      throw error
    })
  }
  return cityIndexPromise
}

async function fetchCityIndex(): Promise<IndexedCity[]> {
  const response = await fetch('/data/cities.tsv')
  if (!response.ok) throw new Error(`No se pudo cargar la base de ciudades (${response.status}).`)

  return parseCityIndex(await response.text())
}

export function parseCityIndex(content: string): IndexedCity[] {
  const lines = content.split(/\r?\n/)
  const cities: IndexedCity[] = []

  for (const line of lines.slice(1)) {
    if (!line) continue
    const [id, name, countryCode, admin1, latitude, longitude, timeZone, population] = line.split('\t')
    if (!id || !name || !countryCode || !latitude || !longitude || !timeZone) continue

    const location: BirthLocation = {
      geonameId: Number(id),
      name,
      countryCode,
      admin1: admin1 ?? '',
      latitude: Number(latitude),
      longitude: Number(longitude),
      timeZone,
      population: Number(population) || 0,
    }
    cities.push({
      location,
      normalizedName: normalize(name),
      normalizedRegion: normalize(admin1 ?? ''),
      normalizedCountry: normalize(countryNames.of(countryCode) ?? countryCode),
    })
  }

  if (cities.length === 0) throw new Error('La base local de ciudades está vacía o tiene un formato inválido.')
  return cities
}

const countryNames = new Intl.DisplayNames(['es'], { type: 'region' })

export function cityLabel(city: BirthLocation): string {
  if (!city.countryCode || city.geonameId < 0) return city.name || 'Ubicación manual'
  const country = countryNames.of(city.countryCode) ?? city.countryCode
  return `${city.name}, ${country}`
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es').trim()
}

export function searchCities(cities: IndexedCity[], query: string, limit = 8): BirthLocation[] {
  const normalizedQuery = normalize(query)
  if (normalizedQuery.length < 2) return []

  const matches: { entry: IndexedCity; score: number }[] = []
  for (const city of cities) {
    const score = city.normalizedName.startsWith(normalizedQuery) ? 0
      : city.normalizedName.includes(normalizedQuery) ? 1
        : city.normalizedRegion.includes(normalizedQuery) || city.normalizedCountry.includes(normalizedQuery) ? 2
          : -1
    if (score !== -1) matches.push({ entry: city, score })
  }

  return matches
    .sort((left, right) => left.score - right.score || right.entry.location.population - left.entry.location.population)
    .slice(0, limit)
    .map(({ entry }) => entry.location)
}
