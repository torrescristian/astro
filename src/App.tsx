import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import './App.css'
import { resolveBirthTime, type TimeChoice } from './astrology/birthTime'
import { calculateMercuryTransit, type NatalChart, type PlanetPosition, zodiacSigns } from './astrology/natalChart'
import { cityLabel, loadCityIndex, searchCities, type BirthLocation } from './location/cities'

type Page = 'inicio' | 'carta' | 'signos' | 'calendario'

type BirthProfile = {
  name: string
  date: string
  time: string
  place: string
  location: BirthLocation | null
  timeChoice?: TimeChoice
}

const navigation: { id: Page; label: string; icon: string }[] = [
  { id: 'inicio', label: 'Inicio', icon: 'home' },
  { id: 'carta', label: 'Mi carta', icon: 'orbit' },
  { id: 'signos', label: 'Signos', icon: 'sparkles' },
  { id: 'calendario', label: 'Calendario', icon: 'calendar' },
]

const signs = [
  { name: 'Aries', symbol: '♈', dates: '21 mar — 19 abr', element: 'Fuego', color: 'coral', description: 'Tu impulso abre caminos. Hoy, antes de lanzarte, pregúntate qué merece de verdad tu energía.' },
  { name: 'Tauro', symbol: '♉', dates: '20 abr — 20 may', element: 'Tierra', color: 'sage', description: 'Lo que crece despacio también llega lejos. Regálate un momento para volver a lo esencial.' },
  { name: 'Géminis', symbol: '♊', dates: '21 may — 20 jun', element: 'Aire', color: 'yellow', description: 'Una conversación puede mover algo por dentro. Escucha con curiosidad y deja espacio a la sorpresa.' },
  { name: 'Cáncer', symbol: '♋', dates: '21 jun — 22 jul', element: 'Agua', color: 'blue', description: 'Cuidar de ti también es avanzar. Ponle nombre a lo que sientes antes de intentar resolverlo.' },
  { name: 'Leo', symbol: '♌', dates: '23 jul — 22 ago', element: 'Fuego', color: 'coral', description: 'Tu luz no necesita competir. Comparte lo que te entusiasma y celebra también el brillo de los demás.' },
  { name: 'Virgo', symbol: '♍', dates: '23 ago — 22 sep', element: 'Tierra', color: 'sage', description: 'No todo necesita una respuesta perfecta. A veces, dar el siguiente paso es suficiente.' },
  { name: 'Libra', symbol: '♎', dates: '23 sep — 22 oct', element: 'Aire', color: 'yellow', description: 'Busca el equilibrio que se siente bien, no el que solo se ve bien desde fuera.' },
  { name: 'Escorpio', symbol: '♏', dates: '23 oct — 21 nov', element: 'Agua', color: 'blue', description: 'Tu intensidad también puede ser calma. Confía en lo que sabes y suelta lo que ya cumplió su ciclo.' },
  { name: 'Sagitario', symbol: '♐', dates: '22 nov — 21 dic', element: 'Fuego', color: 'coral', description: 'Una idea nueva puede convertirse en horizonte. Explora sin exigirte tener todo el mapa.' },
  { name: 'Capricornio', symbol: '♑', dates: '22 dic — 19 ene', element: 'Tierra', color: 'sage', description: 'El compromiso que más importa es el que haces contigo. Avanza a tu ritmo, con intención.' },
  { name: 'Acuario', symbol: '♒', dates: '20 ene — 18 feb', element: 'Aire', color: 'yellow', description: 'Tu forma distinta de mirar es un regalo. Hoy, comparte una idea que normalmente guardarías.' },
  { name: 'Piscis', symbol: '♓', dates: '19 feb — 20 mar', element: 'Agua', color: 'blue', description: 'La intuición se escucha mejor cuando baja el ruido. Busca un pequeño espacio de quietud.' },
]

const events = [
  { day: '05', month: 'NOV', title: 'Cuarto menguante', detail: 'Un buen momento para soltar lo que ya no suma.', kind: 'Luna', color: 'lavender' },
  { day: '09', month: 'NOV', title: 'Luna en Virgo', detail: 'Ordena tus ideas y vuelve a lo que sí puedes cuidar.', kind: 'Tránsito', color: 'sage' },
  { day: '12', month: 'NOV', title: 'Luna nueva', detail: 'Intención pequeña, comienzo con espacio para crecer.', kind: 'Luna', color: 'coral' },
  { day: '17', month: 'NOV', title: 'Venus en Sagitario', detail: 'Más honestidad y ligereza en tus vínculos.', kind: 'Tránsito', color: 'yellow' },
]

const planetFocus: Record<string, string> = {
  Sol: 'tu identidad y dirección personal',
  Luna: 'tu seguridad emocional y forma de cuidarte',
  Mercurio: 'tu manera de pensar, aprender y comunicarte',
  Venus: 'tu forma de vincularte y aquello que valoras',
  Marte: 'tu iniciativa y la manera de perseguir lo que deseas',
  Júpiter: 'tu manera de crecer y encontrar sentido',
  Saturno: 'la forma en que construyes límites y asumes responsabilidades',
  Urano: 'tu necesidad de libertad y cambio',
  Neptuno: 'tu imaginación, sensibilidad e ideales',
  Plutón: 'tu forma de atravesar cambios profundos',
}

const signMeanings: Record<string, string> = {
  Aries: 'la iniciativa, la valentía y la acción directa',
  Tauro: 'la constancia, la paciencia y el vínculo con lo concreto',
  Géminis: 'la curiosidad, el intercambio y la flexibilidad',
  Cáncer: 'la sensibilidad, el sentido de pertenencia y el cuidado',
  Leo: 'la creatividad, la expresión y la generosidad',
  Virgo: 'la observación, el método y la atención al detalle',
  Libra: 'la cooperación, el equilibrio y la búsqueda de armonía',
  Escorpio: 'la intensidad, la profundidad y la transformación',
  Sagitario: 'la exploración, la franqueza y la búsqueda de sentido',
  Capricornio: 'la disciplina, la responsabilidad y las metas a largo plazo',
  Acuario: 'la originalidad, la independencia y los ideales colectivos',
  Piscis: 'la imaginación, la empatía y la intuición',
}

const houseMeanings: Record<number, string> = {
  1: 'identidad, presencia e inicios',
  2: 'recursos, valores y seguridad material',
  3: 'aprendizaje, comunicación y entorno cercano',
  4: 'hogar, raíces y vida privada',
  5: 'creatividad, juego, romance y disfrute',
  6: 'rutinas, tareas y hábitos de cuidado',
  7: 'parejas, asociaciones y acuerdos',
  8: 'intimidad, recursos compartidos y transformación',
  9: 'creencias, estudios y horizontes nuevos',
  10: 'vocación, metas y vida pública',
  11: 'amistades, grupos y proyectos compartidos',
  12: 'descanso, mundo interior y procesos privados',
}

const houseReflections: Record<number, string> = {
  1: 'qué partes de ti quieres mostrar y qué nuevos comienzos te representan',
  2: 'qué te da seguridad y cómo quieres cuidar tus recursos',
  3: 'cómo comunicas tus ideas y qué estás aprendiendo en tu entorno',
  4: 'qué necesitas para sentir arraigo y cómo construyes tu espacio propio',
  5: 'qué disfrutas crear y cómo expresas tu singularidad',
  6: 'qué hábitos cotidianos sostienen tu bienestar',
  7: 'cómo construir acuerdos fiables con responsabilidades compartidas',
  8: 'cómo compartes confianza, intimidad y recursos',
  9: 'qué experiencias amplían tu mirada y tus convicciones',
  10: 'qué metas quieres asumir y cómo deseas contribuir',
  11: 'qué proyectos colectivos y amistades reflejan tus valores',
  12: 'qué procesos internos necesitan descanso, tiempo y privacidad',
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    orbit: <><circle cx="12" cy="12" r="2" /><ellipse cx="12" cy="12" rx="9" ry="4.5" transform="rotate(-35 12 12)" /><path d="m17.5 5.5.01 0" /></>,
    sparkles: <><path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="m19 14 .9 2.1L22 17l-2.1.9L19 20l-.9-2.1L16 17l2.1-.9L19 14ZM5 3l.7 1.3L7 5l-1.3.7L5 7l-.7-1.3L3 5l1.3-.7L5 3Z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    download: <><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M5 17v3h14v-3" /></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  }

  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name] ?? paths.sparkles}
    </svg>
  )
}

function App() {
  const [page, setPage] = useState<Page>('inicio')
  const [profile, setProfile] = useState<BirthProfile | null>(() => {
    try {
      const saved = localStorage.getItem('astra-birth-profile')
      if (!saved) return null
      const parsed = JSON.parse(saved) as Partial<BirthProfile>
      if (typeof parsed.date !== 'string' || typeof parsed.time !== 'string') return null
      return {
        name: typeof parsed.name === 'string' ? parsed.name : '',
        date: parsed.date,
        time: parsed.time,
        place: typeof parsed.place === 'string' ? parsed.place : '',
        location: parsed.location ?? null,
        timeChoice: parsed.timeChoice,
      }
    } catch {
      return null
    }
  })
  const [formOpen, setFormOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedSign, setSelectedSign] = useState('Aries')
  const [calendarMonth, setCalendarMonth] = useState('Noviembre 2026')
  const [chartResult, setChartResult] = useState<{ key: string; chart: NatalChart | null; error: string | null } | null>(null)
  const chartKey = profile?.location
    ? JSON.stringify([profile.date, profile.time, profile.timeChoice, profile.location.geonameId, profile.location.latitude, profile.location.longitude, profile.location.timeZone])
    : null

  useEffect(() => {
    if (!profile?.location || !chartKey) return
    let active = true
    let worker: Worker | null = null

    void Promise.resolve().then(() => {
      if (!active) return
      worker = new Worker(new URL('./astrology/chart.worker.ts', import.meta.url), { type: 'module' })
      worker.onmessage = (event: MessageEvent<{ chart?: NatalChart; error?: string }>) => {
        worker?.terminate()
        if (active) setChartResult({ key: chartKey, chart: event.data.chart ?? null, error: event.data.error ?? null })
      }
      worker.onerror = (event) => {
        event.preventDefault()
        worker?.terminate()
        if (active) setChartResult({ key: chartKey, chart: null, error: 'Falló el cálculo local de la carta. Revisa la fecha, la hora y la zona horaria.' })
      }
      worker.postMessage({ input: { date: profile.date, time: profile.time, timeChoice: profile.timeChoice, location: profile.location } })
    }).catch((error: unknown) => {
      if (active) setChartResult({ key: chartKey, chart: null, error: error instanceof Error ? error.message : 'No se pudo iniciar el cálculo local.' })
    })

    return () => {
      active = false
      worker?.terminate()
    }
  }, [profile, chartKey])

  useEffect(() => {
    if (profile) localStorage.setItem('astra-birth-profile', JSON.stringify(profile))
    else localStorage.removeItem('astra-birth-profile')
  }, [profile])

  const navigate = (nextPage: Page) => {
    setPage(nextPage)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const saveProfile = (event: FormEvent<HTMLFormElement>, location: BirthLocation | null, timeChoice?: TimeChoice) => {
    event.preventDefault()
    if (!location) return
    const formData = new FormData(event.currentTarget)
    setProfile({
      name: String(formData.get('name')).trim(),
      date: String(formData.get('date')),
      time: String(formData.get('time')),
      place: cityLabel(location),
      location,
      timeChoice,
    })
    setFormOpen(false)
    setPage('carta')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const exportProfile = () => {
    if (!profile) return
    const file = new Blob([JSON.stringify({ profile, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = 'mi-perfil-astral.json'
    link.click()
    URL.revokeObjectURL(url)
  }
  const activeChartResult = chartKey && chartResult?.key === chartKey ? chartResult : null

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-open' : ''}`}>
        <a className="brand" href="#inicio" onClick={(event) => { event.preventDefault(); navigate('inicio') }}>
          <span className="brand-mark"><span>✳</span></span>
          <span className="brand-name">astra<span>.</span></span>
        </a>
        <p className="nav-caption">TU ESPACIO</p>
        <nav className="main-nav" aria-label="Navegación principal">
          {navigation.map((item) => (
            <button key={item.id} className={`nav-link ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {page === item.id && <span className="active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note">
            <span className="privacy-lock">⌑</span>
            <p><strong>Tu espacio, tuyo.</strong><br />Tus datos se quedan en este dispositivo.</p>
          </div>
          <button className="profile-mini" onClick={() => setFormOpen(true)}>
            <span className="avatar">{profile?.name ? profile.name.charAt(0).toUpperCase() : '✧'}</span>
            <span className="profile-mini-copy"><strong>{profile?.name || 'Tu perfil'}</strong><small>{profile ? 'Perfil guardado' : 'Configura tu carta'}</small></span>
            <Icon name="chevron" size={16} />
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icon name={mobileMenuOpen ? 'close' : 'menu'} />
          </button>
          <div className="breadcrumb"><span>Tu universo</span><span className="breadcrumb-divider">/</span><strong>{navigation.find((item) => item.id === page)?.label}</strong></div>
          <div className="topbar-right"><span className="today-label">MARTES, 3 DE NOVIEMBRE</span><span className="topbar-moon">☾</span></div>
        </header>

        <div className="page-content">
          {page === 'inicio' && <HomePage profile={profile} onNavigate={navigate} onOpenProfile={() => setFormOpen(true)} />}
          {page === 'carta' && <ChartPage profile={profile} chart={activeChartResult?.chart ?? null} error={activeChartResult?.error ?? null} loading={chartKey !== null && activeChartResult === null} onOpenProfile={() => setFormOpen(true)} onExport={exportProfile} onDelete={() => setProfile(null)} />}
          {page === 'signos' && <SignsPage selectedSign={selectedSign} onSelect={setSelectedSign} />}
          {page === 'calendario' && <CalendarPage month={calendarMonth} onChangeMonth={setCalendarMonth} />}
          <footer className="page-footer">
            <span>Hecho para mirar hacia dentro <span className="footer-star">✳</span></span>
            <span>La astrología es una herramienta de reflexión, no una ciencia. · <a href="/data/ATTRIBUTION.txt">Fuentes y licencias</a></span>
          </footer>
        </div>
      </main>

      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navigation.map((item) => (
          <button key={item.id} className={`mobile-nav-link ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
            <Icon name={item.icon} size={19} /><span>{item.label}</span>
          </button>
        ))}
      </nav>

      {formOpen && <ProfileDialog profile={profile} onClose={() => setFormOpen(false)} onSave={saveProfile} />}
    </div>
  )
}

function PageHeading({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return (
    <div className="page-heading">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>
      {children && <div className="heading-action">{children}</div>}
    </div>
  )
}

function MercuryTransitStatus() {
  const [now, setNow] = useState(() => new Date())
  const transit = useMemo(() => calculateMercuryTransit(now), [now])

  useEffect(() => {
    const refresh = () => setNow(new Date())
    const interval = window.setInterval(refresh, 60 * 60 * 1000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return (
    <section className="mercury-transit-status" aria-label="Tránsito actual de Mercurio">
      <div>
        <p className="eyebrow">TRÁNSITO ACTUAL · CIELO COMPARTIDO</p>
        <h2>Mercurio está {transit.retrograde ? 'retrógrado' : 'directo'}</h2>
        <p className="mercury-transit-meta">En {transit.sign} · actualizado {new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(now)}</p>
      </div>
      <details className="data-explanation">
        <summary>¿Qué significa?</summary>
        <p>Este estado describe el movimiento aparente de Mercurio en el cielo actual y es compartido por quienes observan la Tierra. Es distinto de la posición natal de Mercurio, que indica cómo se movía cuando naciste. La interpretación astrológica es simbólica, no una predicción.</p>
      </details>
    </section>
  )
}

function HomePage({ profile, onNavigate, onOpenProfile }: { profile: BirthProfile | null; onNavigate: (page: Page) => void; onOpenProfile: () => void }) {
  return (
    <>
      <PageHeading eyebrow="MARTES, 3 DE NOVIEMBRE DE 2026" title={`Hola${profile?.name ? `, ${profile.name.split(' ')[0]}` : ''} ✳`} description="Un momento para hacer espacio y volver a ti." />
      <MercuryTransitStatus />
      <section className="daily-card">
        <div className="daily-card-content">
          <span className="pill pill-light"><span className="live-dot" /> TU CIELO DE HOY</span>
          <h2>Vuelve a lo que<br />te hace bien.</h2>
          <p>La Luna invita a bajar el ritmo. No tienes que resolverlo todo hoy: basta con elegir qué merece tu atención.</p>
          <button className="button button-cream" onClick={() => onNavigate('calendario')}>Explorar el calendario <Icon name="arrow" size={17} /></button>
          <span className="daily-footnote">LECTURA DE DEMOSTRACIÓN · PARA REFLEXIÓN PERSONAL</span>
        </div>
        <div className="daily-art" aria-hidden="true">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
          <div className="art-sun"><span>☾</span></div>
          <span className="art-star star-one">✳</span><span className="art-star star-two">✦</span><span className="art-star star-three">·</span><span className="art-star star-four">✧</span>
          <span className="art-label">LUNA<br />CRECIENTE</span>
        </div>
      </section>

      <div className="section-heading">
        <div><p className="eyebrow">TU PUNTO DE PARTIDA</p><h2>Un mapa para conocerte</h2></div>
        <button className="text-button" onClick={() => onNavigate('carta')}>Ver mi carta <Icon name="arrow" size={16} /></button>
      </div>

      <section className="identity-grid">
        <div className="identity-card identity-sun"><span className="identity-icon">☼</span><span className="identity-label">SOL</span><h3>{profile ? 'Tu esencia' : 'Tu identidad'}</h3><details className="identity-explanation"><summary>¿Qué significa?</summary><p>{profile ? 'Tu energía vital, tu forma de expresarte y aquello que te enciende.' : 'La energía que te mueve y la forma en que eliges brillar.'}</p></details><span className="identity-hint">{profile ? 'Explora tu carta para descubrir más' : 'Tu signo solar empieza aquí'}</span></div>
        <div className="identity-card identity-moon"><span className="identity-icon">☾</span><span className="identity-label">LUNA</span><h3>Tu mundo interior</h3><details className="identity-explanation"><summary>¿Qué significa?</summary><p>Lo que necesitas para sentirte en calma, en casa y en conexión contigo.</p></details><span className="identity-hint">Emociones · necesidades · cuidado</span></div>
        <div className="identity-card identity-rising"><span className="identity-icon">↗</span><span className="identity-label">ASCENDENTE</span><h3>Tu primera mirada</h3><details className="identity-explanation"><summary>¿Qué significa?</summary><p>La manera en que te acercas a lo nuevo y cómo te recibe el mundo.</p></details><span className="identity-hint">Necesita hora y lugar de nacimiento</span></div>
      </section>

      <section className="bottom-grid">
        <div className="upcoming-card">
          <div className="section-heading compact"><div><p className="eyebrow">PRÓXIMAMENTE</p><h2>En tu calendario</h2></div><button className="icon-button subtle" aria-label="Ver calendario" onClick={() => onNavigate('calendario')}><Icon name="arrow" size={17} /></button></div>
          {events.slice(0, 2).map((event) => <EventRow key={event.title} event={event} />)}
        </div>
        <div className="profile-cta">
          <div className="cta-star">✧</div><p className="eyebrow">TU CARTA NATAL</p>
          <h2>{profile ? 'Tu espacio ya tiene un comienzo.' : '¿Empezamos por ti?'}</h2>
          <p>{profile ? `Datos de nacimiento guardados en este dispositivo${profile.place ? ` · ${profile.place}` : ''}.` : 'Guarda tus datos de nacimiento en este dispositivo y prepara tu mapa personal.'}</p>
          <button className="button button-dark" onClick={profile ? () => onNavigate('carta') : onOpenProfile}>{profile ? 'Ver mi carta' : 'Crear mi perfil'} <Icon name="arrow" size={16} /></button>
        </div>
      </section>
    </>
  )
}

function EventRow({ event }: { event: (typeof events)[number] }) {
  return (
    <div className="event-row">
      <div className="event-date"><strong>{event.day}</strong><span>{event.month}</span></div>
      <span className={`event-marker ${event.color}`} />
      <div className="event-copy"><strong>{event.title}</strong><details className="event-explanation"><summary>¿Qué significa?</summary><p>{event.detail}</p></details></div>
      <span className="event-kind">{event.kind}</span>
    </div>
  )
}

function ChartPage({ profile, chart, error, loading, onOpenProfile, onExport, onDelete }: { profile: BirthProfile | null; chart: NatalChart | null; error: string | null; loading: boolean; onOpenProfile: () => void; onExport: () => void; onDelete: () => void }) {
  const sun = chart?.positions.find((position) => position.name === 'Sol')
  const moon = chart?.positions.find((position) => position.name === 'Luna')
  return (
    <>
      <PageHeading eyebrow="TU MAPA PERSONAL" title="Mi carta natal" description="Una invitación a explorar tus diferentes formas de ser." >
        {profile && <button className="button button-outline" onClick={onExport}><Icon name="download" size={16} /> Exportar datos</button>}
      </PageHeading>
      {!profile && <div className="profile-prompt"><span className="prompt-icon">✧</span><div><strong>Tu carta empieza con tus datos</strong><p>Guarda tu fecha, hora y lugar de nacimiento en este dispositivo.</p></div><button className="button button-dark" onClick={onOpenProfile}>Añadir mis datos <Icon name="arrow" size={16} /></button></div>}
      {profile && <div className="profile-summary"><span className="avatar">{profile.name.charAt(0).toUpperCase() || '✧'}</span><div><strong>{profile.name || 'Mi perfil'}</strong><span>{formatDate(profile.date)}{profile.time ? ` · ${profile.time}` : ' · hora desconocida'}{profile.place ? ` · ${profile.place}` : ''}</span></div><button className="text-button" onClick={onOpenProfile}>Editar datos</button></div>}
      {profile && !profile.location && <div className="profile-prompt"><span className="prompt-icon">⌖</span><div><strong>Elige la ciudad de nacimiento</strong><p>El perfil guardado no tiene coordenadas ni zona horaria. Selecciona la ciudad para calcular tu carta.</p></div><button className="button button-dark" onClick={onOpenProfile}>Añadir ciudad <Icon name="arrow" size={16} /></button></div>}
      {loading && <div className="calculation-loading" role="status">Calculando posiciones astronómicas en este dispositivo…</div>}
      {error && <div className="calculation-error" role="alert">{error}</div>}
      {chart && profile?.location && <>
        <div className="calculation-note"><span>✓</span><p><strong>Calculada en este dispositivo.</strong> Zodíaco tropical · casas de signos enteros. Zona horaria histórica: {profile.location.timeZone}. Ningún dato de nacimiento se envía por internet.{chart.timeUnknown && ' Sin hora de nacimiento: la posición de la Luna usa el mediodía local y puede variar durante ese día; no se muestran Ascendente ni casas.'}</p></div>
        <section className="chart-layout">
          <div className="chart-card">
            <div className="chart-card-head"><div><p className="eyebrow">RUEDA NATAL</p><h2>Tu universo en perspectiva</h2></div><span className="chart-tag">CALCULADA</span></div>
            <AstroWheel chart={chart} />
            <p className="chart-caption">Instante UTC: {new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(chart.utcInstant))} · {chart.houseSystem === 'whole-sign' ? 'casas de signos enteros' : 'sin casas por hora desconocida'}</p>
          </div>
          <div className="placements-card">
            <div className="chart-card-head"><div><p className="eyebrow">TUS PUNTOS PRINCIPALES</p><h2>Una primera mirada</h2></div></div>
            {sun && <Placement symbol={sun.symbol} name="Sol" sign={sun.sign} house={sun.house ? `Casa ${sun.house}` : 'Casa no disponible'} tone="gold" text={planetReading(sun)} />}
            {moon && <Placement symbol={moon.symbol} name="Luna" sign={moon.sign} house={moon.house ? `Casa ${moon.house}` : 'Casa no disponible'} tone="blue" text={planetReading(moon)} />}
            {chart.ascendant && <Placement symbol="↗" name="Ascendente" sign={chart.ascendant.sign} house="Casa 1" tone="pink" text={angleReading('Ascendente', chart.ascendant.sign)} />}
            {chart.midheaven && <Placement symbol="MC" name="Medio cielo" sign={chart.midheaven.sign} house="Ángulo" tone="pink" text={angleReading('Medio cielo', chart.midheaven.sign)} />}
          </div>
        </section>
        <section className="chart-details-grid">
          <div className="planet-table-card">
            <div className="chart-card-head"><div><p className="eyebrow">POSICIONES AL NACER</p><h2>Planetas y casas natales</h2></div></div>
            <div className="planet-table-wrap"><table className="planet-table"><thead><tr><th>Planeta</th><th>Signo</th><th>Grado</th><th>Casa</th></tr></thead><tbody>{chart.positions.map((position) => <PlanetRow key={position.name} position={position} />)}</tbody></table></div>
          </div>
          <div className="aspects-card">
            <div className="chart-card-head"><div><p className="eyebrow">ASPECTOS MAYORES</p><h2>Relaciones del cielo</h2></div></div>
            {chart.aspects.length ? chart.aspects.map((aspect) => <AspectItem key={`${aspect.first}-${aspect.second}-${aspect.name}`} aspect={aspect} positions={chart.positions} />) : <p className="empty-aspects">No hay aspectos mayores dentro de los orbes iniciales.</p>}
            <p className="placement-disclaimer">Orbes iniciales: conjunción y oposición 6–8°, cuadratura y trígono 5–7°, sextil 4–6°.</p>
          </div>
        </section>
      </>}
      {profile && <div className="data-controls"><span>Tu perfil se guarda solo en este dispositivo.</span><button className="text-button danger-link" onClick={() => { if (window.confirm('¿Eliminar los datos de nacimiento guardados en este dispositivo?')) onDelete() }}>Eliminar mis datos</button></div>}
    </>
  )
}

function AstroWheel({ chart }: { chart: NatalChart }) {
  const ascendant = chart.ascendant?.longitude ?? 0
  const houseCusps = chart.ascendant
    ? Array.from({ length: 12 }, (_, index) => {
      const start = Math.floor(ascendant / 30) * 30 + index * 30
      return normalizeDegrees(start)
    })
    : []
  const colorByPlanet: Record<string, string> = { Sol: '#cf975e', Luna: '#8182b8', Mercurio: '#b18f63', Venus: '#c27b8d', Marte: '#c27b8d', Júpiter: '#b18f63', Saturno: '#8182b8', Urano: '#8182b8', Neptuno: '#8182b8', Plutón: '#8182b8' }
  const point = (longitude: number, radius: number) => {
    const angle = (180 + longitude - ascendant) * Math.PI / 180
    return { x: 210 + Math.cos(angle) * radius, y: 210 + Math.sin(angle) * radius }
  }
  const zodiac = zodiacSigns.map((sign, index) => ({ ...sign, ...point(index * 30 + 15, 157) }))
  const planetPoints = chart.positions.map((position, index) => {
    const duplicates = chart.positions.slice(0, index).filter((other) => Math.abs(normalizeDegrees(other.longitude - position.longitude)) < 7 || Math.abs(normalizeDegrees(position.longitude - other.longitude)) < 7).length
    return { ...position, ...point(position.longitude, duplicates % 2 === 0 ? 126 : 106), color: colorByPlanet[position.name] ?? '#8178a9' }
  })

  return (
    <div className="wheel-wrap">
      <svg className="astro-wheel" viewBox="0 0 420 420" role="img" aria-label="Rueda de carta natal calculada con planetas y signos zodiacales">
        <circle cx="210" cy="210" r="190" fill="#faf8f4" stroke="#ded8cf" />
        <circle cx="210" cy="210" r="158" fill="none" stroke="#ded8cf" />
        <circle cx="210" cy="210" r="112" fill="none" stroke="#e8e2d9" />
        <circle cx="210" cy="210" r="54" fill="#f2eee7" stroke="#e5ded4" />
        {houseCusps.map((cusp, index) => {
          const end = point(cusp, 190)
          return <line key={`cusp-${index}`} x1="210" y1="210" x2={end.x} y2={end.y} stroke="#ddd7ce" strokeWidth={index === 0 ? 1.8 : 1} />
        })}
        {zodiac.map((sign) => <text key={sign.name} x={sign.x} y={sign.y + 6} textAnchor="middle" className="wheel-zodiac">{sign.symbol}</text>)}
        {planetPoints.map((planet) => <g key={planet.name}><line x1="210" y1="210" x2={planet.x} y2={planet.y} stroke={planet.color} strokeOpacity=".3" /><circle cx={planet.x} cy={planet.y} r="11" fill="#fffdf9" stroke={planet.color} strokeWidth="1.2" /><text x={planet.x} y={planet.y + 4} textAnchor="middle" className="wheel-planet" fill={planet.color}>{planet.symbol}</text></g>)}
        {chart.ascendant && <text x="25" y="207" className="wheel-angle-label">ASC</text>}
        {chart.midheaven && <text x="204" y="24" className="wheel-angle-label">MC</text>}
        <text x="210" y="205" textAnchor="middle" className="wheel-center-title">{chart.ascendant?.sign.toUpperCase() ?? 'HORA'}</text>
        <text x="210" y="224" textAnchor="middle" className="wheel-center-subtitle">{chart.ascendant ? 'ASCENDENTE' : 'DESCONOCIDA'}</text>
      </svg>
    </div>
  )
}

function PlanetRow({ position }: { position: PlanetPosition }) {
  const meaning = [
    planetReading(position),
    `El grado ${formatDegrees(position.degree)} muestra su posición exacta dentro del signo.`,
    position.name !== 'Sol' && position.name !== 'Luna'
      ? `${position.name} tenía movimiento ${position.retrograde ? 'retrógrado' : 'directo'} al momento de tu nacimiento.`
      : '',
  ].filter(Boolean).join(' ')
  return (
    <>
      <tr><td><span className="table-planet-symbol">{position.symbol}</span>{position.name}{position.retrograde ? <span className="retrograde-mark" title="Movimiento retrógrado al nacer"> R</span> : null}</td><td>{position.sign}</td><td>{formatDegrees(position.degree)}</td><td>{position.house ? `Casa ${position.house}` : '—'}</td></tr>
      <tr className="planet-explanation-row"><td colSpan={4}><details className="data-explanation"><summary>¿Qué significa?</summary><p>{meaning}</p></details></td></tr>
    </>
  )
}

function planetReading(position: PlanetPosition) {
  const focus = planetFocus[position.name] ?? 'este tema'
  const signStyle = signMeanings[position.sign] ?? 'los matices de ese signo'
  const reading = `En tu carta, ${position.name} en ${position.sign} puede teñir ${focus} de ${signStyle}.`
  if (!position.house) return `${reading} No se muestra una casa porque falta una hora de nacimiento fiable.`
  return `${reading} En la casa ${position.house}, esta combinación adquiere relevancia en ${houseMeanings[position.house]}. Una pregunta útil para ti puede ser: ¿${houseReflections[position.house]}?`
}

function angleReading(name: 'Ascendente' | 'Medio cielo', sign: string) {
  if (name === 'Ascendente') {
    return `Tu Ascendente en ${sign} puede describir cómo inicias situaciones y la impresión que das. En tu caso, esa primera aproximación puede teñirse de ${signMeanings[sign]}.`
  }
  return `Tu Medio cielo en ${sign} puede dar un matiz a tus metas y a cómo quieres contribuir públicamente: ${signMeanings[sign]}. No determina una profesión concreta.`
}

function AspectItem({ aspect, positions }: { aspect: NatalChart['aspects'][number]; positions: PlanetPosition[] }) {
  const firstPosition = positions.find((position) => position.name === aspect.first)
  const secondPosition = positions.find((position) => position.name === aspect.second)
  const firstContext = firstPosition ? `${firstPosition.name} en ${firstPosition.sign}${firstPosition.house ? ` (casa ${firstPosition.house})` : ''}` : aspect.first
  const secondContext = secondPosition ? `${secondPosition.name} en ${secondPosition.sign}${secondPosition.house ? ` (casa ${secondPosition.house})` : ''}` : aspect.second
  const firstFocus = planetFocus[aspect.first] ?? aspect.first
  const secondFocus = planetFocus[aspect.second] ?? aspect.second
  const dynamicMeaning: Record<string, string> = {
    Conjunción: 'pueden mezclarse y reforzarse mutuamente',
    Sextil: 'pueden cooperar y abrir oportunidades cuando tomas iniciativa',
    Cuadratura: 'pueden entrar en tensión y pedir ajustes conscientes',
    Trígono: 'pueden apoyarse y fluir con mayor facilidad',
    Oposición: 'pueden sentirse como necesidades opuestas que buscan equilibrio',
  }
  const meaning = `En tu carta, ${firstContext} forma una ${aspect.name.toLowerCase()} con ${secondContext}. Esto puede hacer que ${firstFocus} y ${secondFocus} ${dynamicMeaning[aspect.name] ?? 'interactúen de una manera particular'}.`
  return (
    <div className="aspect-item">
      <div className="aspect-row"><span className="aspect-glyph">{aspect.symbol}</span><strong>{aspect.first}</strong><span>{aspect.name.toLowerCase()}</span><strong>{aspect.second}</strong><small>{aspect.orb.toFixed(1)}°</small></div>
      <details className="data-explanation"><summary>¿Qué significa?</summary><p>{meaning} El orbe de {aspect.orb.toFixed(1)}° indica cuánto se aleja del ángulo exacto; cuanto menor es, más exacto resulta el aspecto.</p></details>
    </div>
  )
}

function normalizeDegrees(degrees: number) {
  return ((degrees % 360) + 360) % 360
}

function formatDegrees(degrees: number) {
  const wholeDegrees = Math.floor(degrees)
  const minutes = Math.floor((degrees - wholeDegrees) * 60)
  return `${String(wholeDegrees).padStart(2, '0')}° ${String(minutes).padStart(2, '0')}′`
}

function Placement({ symbol, name, sign, house, tone, text }: { symbol: string; name: string; sign: string; house: string; tone: string; text: string }) {
  return <div className="placement"><span className={`placement-symbol ${tone}`}>{symbol}</span><div className="placement-main"><div><strong>{name} en {sign}</strong><span>{house}</span></div><details className="data-explanation"><summary>¿Qué significa?</summary><p>{text}</p></details></div></div>
}

function GlossarySection({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <section className="glossary-section">
      <h3>{title}</h3>
      <div className="glossary-items">{items.map(([term, meaning]) => <details className="glossary-item" key={term}><summary>{term}</summary><p>{meaning}</p></details>)}</div>
    </section>
  )
}

function SignsPage({ selectedSign, onSelect }: { selectedSign: string; onSelect: (name: string) => void }) {
  const selected = signs.find((sign) => sign.name === selectedSign) ?? signs[0]
  return (
    <>
      <PageHeading eyebrow="DOCE FORMAS DE MIRAR EL MUNDO" title="El lenguaje de los signos" description="Cada signo trae una energía distinta. Explora, encuentra matices y quédate con lo que te resuene." />
      <div className="signs-intro"><span>✳</span><p>Tu signo solar es solo una parte de tu mapa. La Luna, el Ascendente y los planetas también cuentan su historia.</p></div>
      <details className="topic-glossary element-glossary">
        <summary>¿Qué significan los elementos?</summary>
        <div className="glossary-content">
          <GlossarySection title="Los cuatro elementos" items={[
            ['Fuego', 'Impulso, entusiasmo, creatividad e iniciativa.'],
            ['Tierra', 'Practicidad, constancia, paciencia y relación con lo concreto.'],
            ['Aire', 'Ideas, curiosidad, comunicación e intercambio.'],
            ['Agua', 'Emociones, intuición, sensibilidad y conexión.'],
          ]} />
        </div>
      </details>
      <section className="signs-layout">
        <div className="sign-grid" role="group" aria-label="Selecciona un signo">
          {signs.map((sign) => <div key={sign.name} className="sign-option">
            <button className={`sign-tile ${sign.color} ${selectedSign === sign.name ? 'selected' : ''}`} onClick={() => onSelect(sign.name)} aria-pressed={selectedSign === sign.name}>
              <span className="sign-symbol">{sign.symbol}</span><strong>{sign.name}</strong><small>{sign.dates}</small><span className="sign-element">{sign.element}</span>
            </button>
            <details className="sign-explanation"><summary>¿Qué significa?</summary><p>{signMeanings[sign.name]}.</p></details>
          </div>)}
        </div>
        <aside className={`sign-detail ${selected.color}`}>
          <span className="detail-symbol">{selected.symbol}</span><p className="eyebrow">SIGNO DEL ZODÍACO · {selected.element.toUpperCase()}</p><h2>{selected.name}</h2><p className="sign-date">{selected.dates}</p>
          <div className="detail-divider" /><p className="detail-copy">{selected.description}</p><p className="detail-note">Una lectura general para inspirar reflexión. Tu carta completa ofrece más matices.</p>
        </aside>
      </section>
    </>
  )
}

function CalendarPage({ month, onChangeMonth }: { month: string; onChangeMonth: (month: string) => void }) {
  const months = ['Octubre 2026', 'Noviembre 2026', 'Diciembre 2026']
  const moveMonth = (direction: -1 | 1) => {
    const index = months.indexOf(month)
    onChangeMonth(months[Math.max(0, Math.min(months.length - 1, index + direction))])
  }
  return (
    <>
      <PageHeading eyebrow="OBSERVA LOS CICLOS" title="Calendario celeste" description="Un espacio para seguir los ritmos del cielo y encontrar tu propio tiempo." />
      <MercuryTransitStatus />
      <section className="calendar-panel">
        <div className="calendar-top">
          <div><p className="eyebrow">AGENDA ASTROLÓGICA</p><h2>{month}</h2></div>
          <div className="month-controls"><button className="icon-button" aria-label="Mes anterior" onClick={() => moveMonth(-1)}>‹</button><button className="icon-button" aria-label="Mes siguiente" onClick={() => moveMonth(1)}>›</button></div>
        </div>
        <div className="calendar-filter"><button className="filter-chip active">Todos <span>04</span></button><button className="filter-chip">Fases lunares</button><button className="filter-chip">Tránsitos</button><span className="calendar-note">Contenido de demostración</span></div>
        <details className="topic-glossary calendar-glossary">
          <summary>¿Qué significan estos términos?</summary>
          <div className="glossary-content">
            <GlossarySection title="Fases y movimientos" items={[
              ['Luna nueva', 'Comienza un nuevo ciclo lunar; astronómicamente, la Luna queda aproximadamente entre la Tierra y el Sol.'],
              ['Cuarto menguante', 'La parte iluminada visible va disminuyendo; es una fase lunar, no un evento astrológico por sí sola.'],
              ['Tránsito', 'La posición actual de un planeta en el cielo. La astrología compara esos movimientos con una carta natal de forma simbólica.'],
            ]} />
          </div>
        </details>
        <div className="calendar-list">{events.map((event) => <EventRow key={event.title} event={event} />)}</div>
        <div className="calendar-disclaimer"><span>✧</span><p>Las fechas y descripciones de esta agenda son ilustrativas. El calendario astronómico se calculará localmente al integrar el motor de efemérides.</p></div>
      </section>
    </>
  )
}

function ProfileDialog({ profile, onClose, onSave }: { profile: BirthProfile | null; onClose: () => void; onSave: (event: FormEvent<HTMLFormElement>, location: BirthLocation | null, timeChoice?: TimeChoice) => void }) {
  const [cityIndex, setCityIndex] = useState<Awaited<ReturnType<typeof loadCityIndex>> | null>(null)
  const [cityLoadError, setCityLoadError] = useState<string | null>(null)
  const [cityQuery, setCityQuery] = useState(profile?.place ?? '')
  const [selectedCity, setSelectedCity] = useState<BirthLocation | null>(profile?.location ?? null)
  const [manualMode, setManualMode] = useState(profile?.location?.geonameId === -1)
  const [manualLatitude, setManualLatitude] = useState(profile?.location?.geonameId === -1 ? String(profile.location.latitude) : '')
  const [manualLongitude, setManualLongitude] = useState(profile?.location?.geonameId === -1 ? String(profile.location.longitude) : '')
  const [manualTimeZone, setManualTimeZone] = useState(profile?.location?.geonameId === -1 ? profile.location.timeZone : '')
  const [birthDate, setBirthDate] = useState(profile?.date ?? '')
  const [birthTime, setBirthTime] = useState(profile?.time ?? '')
  const [timeChoice, setTimeChoice] = useState<TimeChoice | null>(profile?.timeChoice ?? null)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    loadCityIndex().then((index) => {
      if (active) setCityIndex(index)
    }).catch((error: unknown) => {
      if (active) setCityLoadError(error instanceof Error ? error.message : 'No se pudo cargar la base local de ciudades.')
    })
    return () => { active = false }
  }, [])

  const suggestions = useMemo(() => cityIndex ? searchCities(cityIndex, cityQuery) : [], [cityIndex, cityQuery])
  const manualLat = Number(manualLatitude)
  const manualLon = Number(manualLongitude)
  const manualLocation = manualMode
    && manualLatitude.trim() !== ''
    && manualLongitude.trim() !== ''
    && Number.isFinite(manualLat)
    && manualLat >= -90 && manualLat <= 90
    && Number.isFinite(manualLon)
    && manualLon >= -180 && manualLon <= 180
    && manualTimeZone.trim() !== ''
    ? {
      geonameId: -1,
      name: cityQuery.trim() || 'Ubicación manual',
      countryCode: '',
      admin1: '',
      latitude: manualLat,
      longitude: manualLon,
      timeZone: manualTimeZone.trim(),
      population: 0,
    }
    : null
  const selectedLocation = manualMode ? manualLocation : selectedCity
  const timeResolution = selectedLocation && birthDate
    ? resolveBirthTime(birthDate, birthTime || '12:00', selectedLocation.timeZone)
    : null

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!selectedLocation) {
      event.preventDefault()
      setFormError(manualMode ? 'Ingresa coordenadas válidas y una zona horaria IANA.' : 'Elige una ciudad de la lista para usar sus coordenadas y zona horaria.')
      return
    }
    if (timeResolution?.status === 'nonexistent') {
      event.preventDefault()
      setFormError('Esa hora local no existió por un cambio de horario. Ajusta la hora de nacimiento.')
      return
    }
    if (timeResolution?.status === 'invalid') {
      event.preventDefault()
      setFormError(`No se pudo interpretar la fecha u hora: ${timeResolution.message}`)
      return
    }
    if (timeResolution?.status === 'ambiguous' && !timeChoice) {
      event.preventDefault()
      setFormError('Elige cuál de las dos ocurrencias corresponde a tu hora de nacimiento.')
      return
    }
    setFormError(null)
    onSave(event, selectedLocation, timeChoice ?? undefined)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <button className="icon-button dialog-close" aria-label="Cerrar" onClick={onClose}><Icon name="close" size={18} /></button>
        <span className="dialog-symbol">✧</span><p className="eyebrow">TU ESPACIO PERSONAL</p><h2 id="dialog-title">{profile ? 'Editar tu perfil' : 'Empecemos por ti'}</h2>
        <p className="dialog-description">La búsqueda de ciudades usa una base incluida en la app. Tus datos de nacimiento no se envían a ningún servidor.</p>
        <form onSubmit={handleSubmit} className="profile-form">
          <label>¿Cómo te llamas?<input name="name" type="text" placeholder="Tu nombre" defaultValue={profile?.name ?? ''} autoComplete="given-name" /></label>
          <label>Fecha de nacimiento<input name="date" type="date" value={birthDate} onChange={(event) => { setBirthDate(event.target.value); setTimeChoice(null); setFormError(null) }} required /></label>
          <div className="form-row">
            <label>Hora de nacimiento <span className="optional">(opcional)</span><input name="time" type="time" value={birthTime} onChange={(event) => { setBirthTime(event.target.value); setTimeChoice(null); setFormError(null) }} /></label>
            <label className="city-picker-label">Ciudad de nacimiento
              <input name="place" type="text" placeholder="Busca una ciudad" value={cityQuery} onChange={(event) => { setCityQuery(event.target.value); setSelectedCity(null); setTimeChoice(null); setFormError(null) }} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={!manualMode && selectedCity === null && suggestions.length > 0} aria-controls="birth-city-options" />
              {!manualMode && selectedCity === null && cityIndex && cityQuery.trim().length >= 2 && suggestions.length > 0 && <div id="birth-city-options" className="city-options" role="listbox">
                {suggestions.map((city) => <button key={city.geonameId} type="button" className="city-option" role="option" aria-selected={false} onClick={() => { setSelectedCity(city); setCityQuery(cityLabel(city)); setTimeChoice(null); setFormError(null) }}>
                  <strong>{city.name}</strong><span>{cityLabel(city).slice(city.name.length + 2)}</span>
                </button>)}
              </div>}
            </label>
          </div>
          {!manualMode && cityIndex && cityQuery.trim().length >= 2 && suggestions.length === 0 && <p className="form-note">No encontramos esa ciudad en la base.</p>}
          {!manualMode && <button type="button" className="manual-location-toggle" onClick={() => { setManualMode(true); setSelectedCity(null); setTimeChoice(null); setFormError(null) }}>¿No aparece? Ingresar coordenadas y zona horaria</button>}
          {manualMode && <div className="manual-location-fields">
            <div className="manual-location-heading"><strong>Ubicación manual</strong><button type="button" className="text-button" onClick={() => { setManualMode(false); setFormError(null) }}>Volver al buscador</button></div>
            <p>Usa coordenadas decimales y una zona IANA (por ejemplo, America/Argentina/Cordoba).</p>
            <div className="form-row">
              <label>Latitud<input type="number" min="-90" max="90" step="any" value={manualLatitude} onChange={(event) => setManualLatitude(event.target.value)} placeholder="-34.6037" /></label>
              <label>Longitud<input type="number" min="-180" max="180" step="any" value={manualLongitude} onChange={(event) => setManualLongitude(event.target.value)} placeholder="-58.3816" /></label>
            </div>
            <label>Zona horaria IANA<input type="text" value={manualTimeZone} onChange={(event) => { setManualTimeZone(event.target.value); setTimeChoice(null) }} placeholder="America/Argentina/Buenos_Aires" /></label>
          </div>}
          {cityLoadError && <p className="city-error" role="alert">{cityLoadError}</p>}
          {selectedLocation && <p className="selected-city-note">⌖ {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)} · {selectedLocation.timeZone}</p>}
          {!cityLoadError && !cityIndex && <p className="form-note">Cargando la base local de ciudades…</p>}
          {timeResolution?.status === 'ambiguous' && <fieldset className="time-choice">
            <legend>Esta hora ocurrió dos veces por el cambio de horario. ¿Cuál corresponde?</legend>
            <label><input type="radio" name="time-choice" checked={timeChoice === 'earlier'} onChange={() => { setTimeChoice('earlier'); setFormError(null) }} /> Primera ocurrencia · UTC{timeResolution.earlier.offset}</label>
            <label><input type="radio" name="time-choice" checked={timeChoice === 'later'} onChange={() => { setTimeChoice('later'); setFormError(null) }} /> Segunda ocurrencia · UTC{timeResolution.later.offset}</label>
          </fieldset>}
          {timeResolution?.status === 'nonexistent' && <p className="city-error" role="alert">Esa hora no existió en esta ciudad por el cambio de horario. Prueba otra hora.</p>}
          {timeResolution?.status === 'invalid' && <p className="city-error" role="alert">La zona horaria no es válida. Usa un identificador IANA, como America/Argentina/Buenos_Aires.</p>}
          {formError && <p className="city-error" role="alert">{formError}</p>}
          <p className="form-note">La ciudad aporta coordenadas y zona horaria histórica. Si no conoces la hora, se usan las 12:00 locales y no se calculan Ascendente ni casas.</p>
          <button className="button button-dark form-submit" type="submit" disabled={!selectedLocation || (timeResolution?.status === 'ambiguous' && !timeChoice) || timeResolution?.status === 'nonexistent' || timeResolution?.status === 'invalid'}>{profile ? 'Guardar cambios' : 'Calcular mi carta'} <Icon name="arrow" size={16} /></button>
        </form>
      </section>
    </div>
  )
}

function formatDate(value: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${value}T12:00:00Z`))
}

export default App
