# Automatización de The Quiz Channel

Este flujo combina generación estructurada, la voz gratuita usada por MoneyPrinterTurbo, el renderer visual de Remotion y la subida directa a YouTube.

## Primera ejecución

Requisitos: Node.js 20+, Python 3.11+, `uv`, Git y FFmpeg.

```bash
npm ci
npm run setup:mpt
```

Genera un primer video usando el quiz incluido, sin consumir una API de IA:

```bash
npm run create:video -- --index=1
```

El resultado queda en:

- `out/videos/quiz-001.mp4`
- `out/thumbnails/quiz-001.png`
- `out/jobs/quiz-001/manifest.json`

Para comprobar solo el renderer, sin voz:

```bash
npm run create:video -- --index=1 --tts=none
```

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

## GitHub Actions

El workflow **Produce Quiz** permite generar un tema manualmente, descargar video/miniatura como artefactos y, opcionalmente, subirlo en privado. Añade los secretos de OpenAI y YouTube en `Settings → Secrets and variables → Actions` antes de activar la subida.

## Decisión sobre MoneyPrinterTurbo

MoneyPrinterTurbo no reemplaza el diseño de quiz. Se instala fuera del repositorio, bajo `.tools/`, y proporciona su entorno de voz Edge TTS. Remotion conserva el control del temporizador, las cuatro opciones, el revelado de la respuesta y la miniatura. La publicación sigue usando la API oficial de YouTube en lugar de un servicio intermediario.

MoneyPrinterTurbo está licenciado bajo MIT. Su código no se redistribuye en este repositorio; el setup clona el proyecto original y fija por defecto la revisión auditada indicada en `MPT_REF`. Actualiza esa revisión de forma deliberada cuando quieras incorporar cambios posteriores del proyecto.
