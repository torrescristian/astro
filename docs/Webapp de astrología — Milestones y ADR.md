# Webapp de astrología — Milestones y ADR

Nov 3, 2026 · @Cristian

Webapp instalable, mobile-first y offline-first (React, TypeScript, Vite, PWA), sin backend ni servicios pagos en el MVP, donde el usuario consulta su carta natal, explora los signos y sigue los eventos astrológicos.

## Alcance y principios

El MVP es una aplicación local, instalable y funcional, sin backend ni cuentas; la sincronización entre dispositivos se agrega solo cuando exista una necesidad real.

**Dentro del MVP:** carta natal (formulario, cálculo, visualización, interpretaciones de Sol, Luna y Ascendente), guardado local con exportación, PWA instalable y uso offline, y navegación base.

**Después del MVP:** horóscopo diario, compatibilidad entre signos, diario astrológico y contenido ampliado.

**Principios:**

- Offline-first: tras la primera carga, toda la funcionalidad central opera sin conexión.
- Privacidad por diseño: los datos de nacimiento nunca salen del dispositivo y no se usa analítica que los capture.
- Cálculo separado de interpretación y de interfaz.
- Contenido propio o licenciado, con fines de entretenimiento.
- Idioma español desde el inicio, con i18n preparado para otros idiomas.

## Milestones

Cada milestone termina cuando se cumple su criterio de aceptación; el despliegue con HTTPS y la integración continua existen desde M0.

| Milestone | Objetivo | Entregable | Criterio de aceptación |
| --- | --- | --- | --- |
| M0 — Fundamentos | Arquitectura, herramientas, motor de cálculo y despliegue | Proyecto configurado, ADR-003 aceptado, esqueleto desplegado con CI | El esqueleto se despliega por HTTPS en cada merge; el spike del motor compara 3 cartas de referencia |
| M1 — Experiencia base | Navegación responsive y PWA mínima | Páginas principales, diseño consistente, manifest y precache | La app se instala en Android e iOS y navega sin errores de accesibilidad críticos |
| M2 — Carta natal | Generar y visualizar la carta astral | Formulario, cálculo, rueda SVG, tabla textual, interpretaciones | Las posiciones coinciden con las cartas de referencia dentro de la tolerancia definida en ADR-011 |
| M3 — Persistencia | Guardar carta y perfil | IndexedDB, exportación e importación JSON, borrado de datos | Una carta guardada sobrevive a recargas y se restaura desde un archivo exportado |
| M4 — Contenido astrológico | Signos, calendario y tránsitos calculados | Fichas de signos, calendario de eventos, Mercurio retrógrado | Los eventos del calendario se calculan con el motor y coinciden con una fuente de referencia |
| M5 — PWA completa | Uso offline robusto y actualizaciones controladas | Service worker con Workbox, página offline, aviso de nueva versión | Todas las funciones del MVP operan en modo avión tras la primera carga |
| M6 — Release | Validar calidad y publicar | Versión estable, documentación, política de privacidad | Pruebas unitarias, de integración y E2E en verde; Lighthouse sobre 90 en PWA, accesibilidad y performance |

## Detalle de milestones

### M0 — Fundamentos

- Configurar React, TypeScript, Vite y ESLint, con reglas de límites entre módulos (`eslint-plugin-boundaries` o `dependency-cruiser`).
- Definir estructura de carpetas, convenciones, sistema visual (tipografía, colores, tokens) y fuentes autoalojadas.
- Configurar Vitest, React Testing Library y Playwright.
- Incorporar routing, manejo de errores e i18n.
- Spike de 1 a 2 días del motor de cálculo: comparar 2 o 3 opciones contra cartas de referencia y aceptar el ADR-003.
- Desplegar un esqueleto con HTTPS y CI (Cloudflare Pages, Netlify o GitHub Pages) y configurar Lighthouse CI.

### M1 — Experiencia base

- Home con resumen del día.
- Navegación principal: Inicio, Carta natal, Signos y Calendario.
- Layout responsive y accesible.
- Estados de carga, error y ausencia de datos.
- PWA mínima: manifest, iconos y precache, para detectar diferencias entre iOS y Android desde temprano.

### M2 — Carta natal

- Formulario de fecha, hora y lugar de nacimiento, validado con Zod.
- Selección del lugar desde una base de ciudades empaquetada (ADR-008), con coordenadas y zona IANA.
- Conversión de zona horaria histórica, con aviso al usuario ante horas inexistentes o ambiguas por cambios de horario de verano.
- Modo de hora desconocida: carta sin Ascendente ni casas, con aviso visible.
- Cálculo de posiciones planetarias, casas y aspectos con los parámetros del ADR-009, en un Web Worker.
- Visualización en SVG de la carta circular, con tabla textual equivalente (ADR-010).
- Interpretaciones de Sol, Luna y Ascendente.

### M3 — Persistencia

- Guardar carta natal, perfil y preferencias en IndexedDB mediante Dexie, con versionado de esquema y migraciones.
- Solicitar almacenamiento persistente con `navigator.storage.persist()`.
- Exportar e importar los datos en JSON.
- Eliminar todos los datos desde la aplicación.
- Preferencias de visualización.

### M4 — Contenido astrológico

- Fichas de los 12 signos, en JSON validado con Zod.
- Calendario de eventos astrales calculado localmente: fases lunares, ingresos, eclipses y Mercurio retrógrado.
- Resumen diario generado a partir de los tránsitos reales del día (Luna en signo, aspectos), sin texto editorial diario.

### M5 — PWA completa

- Service worker con Workbox y precache versionado.
- Flujo explícito de actualización: aviso de nueva versión y recarga a pedido.
- Página offline.
- Caché de imágenes y fuentes.
- Pruebas de instalación y de funcionamiento offline en iOS y Android.

### M6 — Release

- Tests unitarios, de integración y E2E, incluido el modo offline.
- Auditoría de accesibilidad y performance.
- Política de privacidad breve y aviso de que el contenido es con fines de entretenimiento.
- Despliegue de la versión estable con HTTPS.
- Documentación de instalación y uso.

## ADR — Architecture Decision Records

Los ADR documentan las decisiones técnicas que condicionan el diseño. Cada uno registra contexto, decisión, alternativas consideradas, consecuencias y riesgos.

### ADR-001 — Aplicación frontend con React y Vite

**Estado:** Aceptado.

**Contexto:** La aplicación requiere una interfaz interactiva, instalación como PWA y una experiencia mobile-first.

**Decisión:** Usar React, TypeScript y Vite como stack principal.

**Alternativas consideradas:** Next.js o Remix (SSR innecesario para el MVP), Svelte o Vue (menor familiaridad del equipo).

**Consecuencias:**

- Desarrollo y build rápidos.
- Control explícito sobre el routing y el ciclo de vida de la PWA.
- No se requiere SSR para el MVP; los contenidos públicos pueden prerenderizarse más adelante si el SEO lo requiere.

**Riesgos:** Sin SSR, el SEO de las páginas públicas es limitado.

### ADR-002 — Arquitectura modular por funcionalidades

**Estado:** Aceptado.

**Decisión:** Organizar el código por funcionalidades de negocio, separando UI, lógica de aplicación y acceso a datos. Los límites entre módulos se verifican automáticamente con `eslint-plugin-boundaries` o `dependency-cruiser`.

```
src/
├── app/
│   ├── router/
│   └── providers/
├── features/
│   ├── natal-chart/
│   │   ├── ui/
│   │   ├── application/
│   │   └── domain/
│   ├── zodiac/
│   ├── horoscope/
│   ├── calendar/
│   └── profile/
├── shared/
│   ├── ui/
│   ├── domain/
│   ├── infrastructure/
│   └── lib/
└── main.tsx
```

**Alternativas consideradas:** Organización por tipo técnico (components, hooks, services), que mezcla funcionalidades y dificulta el crecimiento.

**Consecuencias:**

- Cada funcionalidad mantiene sus componentes y lógica.
- Los cálculos astrológicos no se mezclan con componentes visuales.
- Las dependencias entre módulos son explícitas y verificadas en CI.

**Riesgos:** Sin verificación automática, la convención se erosiona con el tiempo.

### ADR-003 — Cálculo astrológico mediante una librería especializada

**Estado:** Propuesto; se acepta al cierre del spike de M0.

**Contexto:** La carta natal requiere posiciones planetarias precisas a partir de fecha, hora y ubicación, con licencia compatible con un proyecto sin servicios pagos.

**Decisión:** Utilizar una librería de efemérides compatible con JavaScript o WebAssembly, encapsulada detrás de una interfaz propia y ejecutada en un Web Worker.

```
interface AstrologyEngine {
  calculateNatalChart(input: BirthData): NatalChart;
}
```

**Alternativas consideradas:**

- Swiss Ephemeris: la más completa, pero con licencia AGPL o comercial; exige abrir el código de la app o comprar licencia.
- `astronomy-engine` (MIT): calcula Sol, Luna y planetas, pero no incluye sistemas de casas, que habría que implementar.
- Otras librerías permisivas, a evaluar en el spike.

**Criterios del spike:** licencia, precisión frente a cartas de referencia (por ejemplo astro.com), soporte de casas, peso del bundle y rendimiento en móviles.

**Consecuencias:**

- Los cálculos se prueban independientemente de React.
- La librería puede reemplazarse sin modificar la UI.
- La zona horaria y las coordenadas se normalizan antes del cálculo.
- La interpretación es una capa independiente del cálculo astronómico.

**Riesgos:** Implementar casas propias exige pruebas golden exhaustivas; una licencia inadecuada obligaría a rediseñar.

### ADR-004 — Persistencia local con IndexedDB

**Estado:** Aceptado para el MVP.

**Decisión:** Guardar perfil, carta natal y preferencias en IndexedDB mediante Dexie, con versionado de esquema y migraciones.

**Alternativas consideradas:** `localStorage` (síncrono y limitado en tamaño), OPFS (innecesario para este volumen de datos).

**Consecuencias:**

- La aplicación funciona sin cuenta y los datos están disponibles offline.
- Se solicita almacenamiento persistente con `navigator.storage.persist()`.
- Se ofrece exportación e importación en JSON.
- La eliminación de datos está disponible desde la aplicación.
- No hay sincronización entre dispositivos.

**Riesgos:** Safari en iOS puede borrar datos de sitios sin uso (las PWA instaladas están mejor protegidas); la exportación mitiga la pérdida de datos.

### ADR-005 — PWA con estrategia offline-first

**Estado:** Aceptado.

**Decisión:** Utilizar `vite-plugin-pwa` con Workbox: precache versionado de los assets de la aplicación, incluido `index.html`, y un flujo explícito de actualización.

| Recurso | Estrategia |
| --- | --- |
| HTML, JS, CSS (assets con hash) | Precache de Workbox |
| Imágenes y fuentes autoalojadas | Cache First |
| Contenido astrológico local | JSON precacheado o IndexedDB |
| Datos externos | Network First o Network Only |

**Alternativas consideradas:** Cache First sin versionado para el HTML (deja a los usuarios en versiones antiguas), service worker escrito a mano.

**Consecuencias:**

- La app abre sin conexión después de la primera carga.
- Las nuevas versiones se anuncian al usuario, que decide cuándo recargar.
- Las fuentes se autoalojan; los servicios de fuentes externos rompen el modo offline.

**Riesgos:** Comportamiento distinto del service worker en iOS y Android; se prueba desde M1.

### ADR-006 — Estado local y estado de servidor

**Estado:** Aceptado.

**Decisión:** Mantener el estado de UI con React y utilizar TanStack Query únicamente cuando exista una API externa.

**Alternativas consideradas:** Redux o Zustand, que no se incorporan sin una necesidad concreta.

**Consecuencias:**

- El perfil persistente se administra mediante un repositorio.
- Los formularios usan estado local y validación con Zod.
- Los datos remotos se mantienen separados de la información persistida localmente.

**Riesgos:** Si el estado compartido crece, puede ser necesario reevaluar esta decisión.

### ADR-007 — Contenido astrológico desacoplado de la interfaz

**Estado:** Aceptado.

**Decisión:** Separar los datos astrológicos y las interpretaciones de los componentes React, con tipos estrictos y validación con Zod.

```
type Element = 'fire' | 'earth' | 'air' | 'water';
type Modality = 'cardinal' | 'fixed' | 'mutable';

interface ZodiacSign {
  id: string;
  name: string;
  element: Element;
  modality: Modality;
  description: string;
}
```

**Alternativas consideradas:** Contenido embebido en los componentes, que impide traducir y editar sin tocar código.

**Consecuencias:**

- El contenido se almacena inicialmente en archivos JSON, uno por idioma.
- Se facilita la traducción y la edición.
- La misma información se reutiliza en distintas vistas.
- Las interpretaciones evolucionan sin modificar la lógica de cálculo.
- Los textos son originales o con licencia, nunca copiados de otros sitios.

**Riesgos:** Volumen de contenido a redactar y revisar para cada idioma.

### ADR-008 — Geocodificación y zonas horarias

**Estado:** Propuesto.

**Contexto:** El lugar de nacimiento debe convertirse en coordenadas y zona horaria sin depender de servicios externos, y la hora local de nacimiento debe pasar a tiempo universal respetando la historia de los husos horarios.

**Decisión:** Empaquetar una base de ciudades (GeoNames `cities15000`) con coordenadas y zona IANA, cargada de forma diferida y buscada localmente. Usar una librería de zonas horarias basada en la base IANA para la conversión histórica.

**Alternativas consideradas:** Nominatim (su política de uso no permite autocompletado intensivo y exige conexión), APIs de geocodificación pagas (contradicen el alcance sin costos).

**Consecuencias:**

- La búsqueda de ciudades funciona offline.
- Las horas inexistentes o ambiguas por cambios de horario de verano se detectan y se informan al usuario, que elige la interpretación.
- Lugares fuera de la base permiten ingresar coordenadas y zona manualmente.

**Riesgos:** Peso de la base de ciudades; se mitiga con carga diferida y caché.

### ADR-009 — Parámetros astrológicos

**Estado:** Propuesto.

**Decisión:** Zodíaco tropical por defecto, un sistema de casas por defecto (a definir en el spike del ADR-003, entre Placidus y signos enteros), y orbes de aspectos configurables con valores iniciales documentados.

**Alternativas consideradas:** Zodíaco sidéreo y otros sistemas de casas, que se agregan como preferencias en versiones posteriores.

**Consecuencias:**

- Los parámetros se muestran en la carta para que el resultado sea reproducible.
- Las pruebas golden se ejecutan con estos mismos parámetros.

**Riesgos:** Los sistemas de casas difieren entre fuentes; la documentación debe explicar la elección.

### ADR-010 — Renderizado de la carta en SVG

**Estado:** Aceptado.

**Decisión:** Dibujar la carta circular con SVG, acompañada de una tabla textual equivalente con planetas, signos, casas y aspectos.

**Alternativas consideradas:** Canvas (menos accesible y sin escalado nativo), librerías de gráficos genéricas.

**Consecuencias:**

- Escalado nítido en cualquier pantalla y accesibilidad para lectores de pantalla mediante la tabla.
- Posibilidad de exportar la carta como imagen.

**Riesgos:** Cartas densas pueden requerir manejo de colisiones entre planetas cercanos.

### ADR-011 — Estrategia de testing y datos de referencia

**Estado:** Aceptado.

**Decisión:** Pruebas golden del motor con cartas conocidas y tolerancia en grados, tests unitarios y de integración con Vitest y React Testing Library, E2E con Playwright incluyendo modo offline, y Lighthouse CI en cada cambio.

**Consecuencias:**

- Las pruebas golden son el test más valioso del proyecto y se escriben antes de la UI de la carta.
- Las tolerancias aceptadas se documentan junto a los datos de referencia.

**Riesgos:** Las cartas de referencia deben obtenerse de fuentes cuya licencia permita su uso en pruebas.

### ADR-012 — Hosting, CI/CD y actualización de la PWA

**Estado:** Aceptado.

**Decisión:** Despliegue estático con HTTPS en Cloudflare Pages, Netlify o GitHub Pages, con CI desde M0 que ejecuta lint, tests, build y Lighthouse, y despliegues de vista previa por rama.

**Consecuencias:**

- Cada cambio se prueba en un entorno real desde el inicio, incluidos service worker e instalación.
- Las nuevas versiones llegan a los usuarios mediante el flujo de actualización del ADR-005.

**Riesgos:** Dependencia de un proveedor de hosting; al ser contenido estático, migrar es de bajo costo.

### ADR-013 — Privacidad y manejo de datos personales

**Estado:** Aceptado.

**Contexto:** Fecha, hora y lugar de nacimiento son datos personales.

**Decisión:** Todos los datos permanecen en el dispositivo; no hay cuentas, ni envío de datos a servidores propios o de terceros, ni analítica que capture datos de nacimiento.

**Consecuencias:**

- Se publica una política de privacidad breve y comprensible.
- El usuario puede exportar y eliminar todos sus datos desde la aplicación.
- Si más adelante se agregan cuentas o sincronización, este ADR se revisa antes de implementarlas.

**Riesgos:** Sin copia en servidor, la pérdida del dispositivo implica pérdida de datos; la exportación lo mitiga.

## Orden de implementación

La carta natal es la funcionalidad central, por lo que el plan reduce primero su riesgo técnico (motor, licencia, zonas horarias) y recién después construye el contenido.

1. **M0:** fundamentos, spike del motor de cálculo y despliegue con CI.
2. **M1:** aplicación navegable con PWA mínima.
3. **M2:** carta natal completa.
4. **M3:** guardado local y exportación.
5. **M4:** contenido astrológico calculado.
6. **M5:** PWA completa con actualizaciones controladas.
7. **M6:** validación de calidad y publicación.

## Decisiones abiertas

- Librería de efemérides y sistema de casas por defecto (ADR-003 y ADR-009), a cerrar con el spike de M0.
- Proveedor de hosting entre Cloudflare Pages, Netlify y GitHub Pages (ADR-012).
- Tolerancia en grados para las pruebas golden (ADR-011).
