# Automatización de The Quiz Channel

Este flujo combina generación estructurada, OpenAI TTS con fallback de MoneyPrinterTurbo, el renderer visual de Remotion y la subida directa a YouTube.

## Primera ejecución

Requisitos para el flujo principal: Node.js 20+, Git y FFmpeg. Python 3.11+ y `uv` solo hacen falta si se usa el fallback de MoneyPrinterTurbo.

```bash
npm install
```

Con `OPENAI_API_KEY` configurada, genera un primer video usando el quiz incluido (solo consume la API de voz):

```bash
npm run create:video -- --index=1
```

El resultado queda en:

- `out/videos/quiz-001.mp4`
- `out/thumbnails/quiz-001.png`
- `out/jobs/quiz-001/manifest.json`

OpenAI TTS usa por defecto `gpt-4o-mini-tts`, la voz `coral` e instrucciones de locución en español de España. Para comprobar solo el renderer, sin voz:

```bash
npm run create:video -- --index=1 --tts=none
```

Para usar Edge TTS explícitamente:

```bash
npm run setup:mpt
npm run create:video -- --index=1 --tts=mpt
```

El modo `--tts=auto` intenta OpenAI y utiliza MoneyPrinterTurbo si la API no está disponible. Las descripciones incluyen automáticamente el aviso de que la narración fue generada con IA.

## Generar un quiz nuevo con IA

Copia `.env.youtube.example` como `.env` y carga las variables en tu terminal. La suscripción de ChatGPT no sustituye una clave de API.

```bash
export OPENAI_API_KEY="..."
npm run create:video -- --topic="Historia de España"
```

La API devuelve exactamente 12 preguntas mediante Structured Outputs. El pipeline aplica controles de preguntas repetidas, cuatro opciones únicas, respuesta válida y explicaciones obligatorias antes de renderizar.

## Subir a YouTube

Configura `YT_CLIENT_ID`, `YT_CLIENT_SECRET`, `YT_REDIRECT_URI` y `YT_REFRESH_TOKEN`. La primera subida debe mantenerse privada:

```bash
npm run create:video -- --topic="Historia de España" --upload --privacy=private
```

El estado de subida se conserva en `out/publish/upload-state.json`, evitando repetir videos accidentalmente.

## Dos publicaciones automáticas por día

El workflow **Produce Quiz** se ejecuta todos los días a las **13:00 y 21:00 de Europe/Madrid**, adaptándose al horario de verano. Cada franja selecciona un tema evergreen distinto, crea un ID determinista, genera voz y miniatura, renderiza y publica en YouTube. GitHub puede iniciar un cron unos minutos después de la hora exacta.

Añade estos secretos en `Settings → Secrets and variables → Actions`:

- `OPENAI_API_KEY`
- `YT_CLIENT_ID`
- `YT_CLIENT_SECRET`
- `YT_REDIRECT_URI`
- `YT_REFRESH_TOKEN`

Variables opcionales: `OPENAI_MODEL`, `OPENAI_TTS_MODEL`, `OPENAI_TTS_VOICE`, `YT_DEFAULT_CATEGORY_ID` y `YT_DEFAULT_PLAYLIST_ID`.

Las ejecuciones programadas publican como `public`. Las ejecuciones manuales permanecen `private` por defecto. Antes de subir, el pipeline busca el marcador único `[quiz-id:...]` entre los videos del canal para impedir duplicados aunque una ejecución de GitHub Actions sea reintentada.

## Decisión sobre MoneyPrinterTurbo

MoneyPrinterTurbo no reemplaza el diseño de quiz. Se instala fuera del repositorio, bajo `.tools/`, y queda disponible como proveedor alternativo de Edge TTS. Remotion conserva el control del temporizador, las cuatro opciones, el revelado de la respuesta y la miniatura. La publicación sigue usando la API oficial de YouTube en lugar de un servicio intermediario.

MoneyPrinterTurbo está licenciado bajo MIT. Su código no se redistribuye en este repositorio; el setup clona el proyecto original y fija por defecto la revisión auditada indicada en `MPT_REF`. Actualiza esa revisión de forma deliberada cuando quieras incorporar cambios posteriores del proyecto.
