# Automatización gratuita de The Quiz Channel

El flujo programado no consume APIs de pago. Usa un catálogo local de 180 quizzes, Edge TTS mediante MoneyPrinterTurbo, Remotion para video y miniatura, y la API oficial de YouTube para publicar.

## Qué incluye el stock

- 180 videos renderizables (`quiz-001` a `quiz-180`): 90 días a dos publicaciones diarias.
- 12 preguntas por video: 4 fáciles, 4 medias y 4 difíciles.
- Combinaciones, IDs y títulos únicos, generados de manera determinista.
- Tres preguntas de la categoría principal y una pregunta complementaria por nivel.
- Opciones reordenadas sin modificar la respuesta correcta.
- Validaciones automatizadas contra conjuntos duplicados.

El banco vive en `src/videos-es.ts`. Para ampliar el stock, agrega preguntas verificadas al banco y aumenta `STOCK_VIDEO_COUNT`; no hace falta una API de IA.

## Primera ejecución local

Requisitos: Node.js 20+, Git, FFmpeg, Python 3.11+ y `uv`.

```bash
npm install
npm run setup:mpt
npm run create:video -- --index=1 --tts=mpt
```

El resultado queda en:

- `out/videos/quiz-001.mp4`
- `out/thumbnails/quiz-001.png`
- `out/jobs/quiz-001/manifest.json`

Para comprobar únicamente el render, sin narración:

```bash
npm run create:video -- --index=1 --tts=none
```

## Voz gratuita

MoneyPrinterTurbo ejecuta Edge TTS sin API key. Los valores predeterminados son:

```text
MPT_VOICE=es-ES-AlvaroNeural
MPT_VOICE_RATE=+15%
```

Pueden configurarse como variables del repositorio para probar otras voces o velocidades sin modificar código.

## Credenciales para YouTube

Solo son necesarios estos cuatro secretos en `Settings → Secrets and variables → Actions`:

- `YT_CLIENT_ID`
- `YT_CLIENT_SECRET`
- `YT_REDIRECT_URI`
- `YT_REFRESH_TOKEN`

No se necesita `OPENAI_API_KEY` para generar, narrar ni publicar el stock.

### Obtener las credenciales y el refresh token

1. Crea un proyecto en Google Cloud y habilita **YouTube Data API v3**.
2. Configura la pantalla de consentimiento OAuth como **External**. Para que el refresh token no caduque a los siete días, cambia el estado de publicación de **Testing** a **In production** antes de activar el cron.
3. Crea un cliente OAuth de tipo **Desktop app**.
4. Copia el archivo de configuración local y completa el client ID y el client secret:

```bash
cp .env.youtube.example .env.youtube.local
```

```text
YT_CLIENT_ID=...
YT_CLIENT_SECRET=...
YT_REDIRECT_URI=http://localhost:53682/oauth2callback
```

5. Autoriza la cuenta que administra `@thequizchannelytb`:

```bash
npm ci
npm run youtube:auth
```

El comando abre Google en el navegador, comprueba el canal seleccionado y muestra los cuatro valores que debes copiar a GitHub Actions Secrets. `.env.youtube.local` está ignorado por Git y nunca debe subirse al repositorio.

Puedes validar nuevamente el token y el canal con:

```bash
npm run youtube:check
```

Variables opcionales:

- `MPT_VOICE`
- `MPT_VOICE_RATE`
- `YT_STOCK_START_DATE` (`YYYY-MM-DD`, primer día de publicación)
- `YT_DEFAULT_CATEGORY_ID`
- `YT_DEFAULT_PLAYLIST_ID`
- `YT_EXPECTED_CHANNEL_ID` (recomendado; evita publicar en otra cuenta por error)
- `YT_AUTOMATION_PRIVACY` (`private` por defecto; usa `public` después de validar)

## Prueba privada

Ejecuta manualmente el workflow **Produce Quiz** con:

- `stock_index`: `1`
- `tts`: `mpt`
- `upload`: `true`
- `privacy`: `private`

Las ejecuciones manuales conservan sus artefactos durante un día. Las ejecuciones programadas no guardan videos como artefactos porque el resultado ya se publica en YouTube; así se evita acumular almacenamiento.

## Dos publicaciones automáticas por día

El workflow comprueba las **13:00 y 21:00 de Europe/Madrid**, adaptándose al horario de verano. Las cuatro expresiones UTC del workflow permiten identificar las dos horas locales correctas; las otras comprobaciones se descartan.

Después de validar una subida privada, crea esta variable del repositorio:

```text
YT_AUTOMATION_ENABLED=true
```

Configura también `YT_STOCK_START_DATE` con el día en que quieras comenzar y conserva `YT_AUTOMATION_PRIVACY=private` durante la primera ejecución programada. Cuando confirmes que el resultado es correcto, cambia esa variable a `public`.

Cada franja selecciona el siguiente índice del catálogo local, genera narración, renderiza y publica con la privacidad configurada. El selector usa la expresión cron original, por lo que un retraso de GitHub Actions no cambia el video elegido ni hace que se pierda la franja. La subida busca el marcador `[quiz-id:...]` para no duplicar un video si GitHub reintenta una ejecución.

Antes de renderizar, el workflow valida que el refresh token funcione y, si configuraste `YT_EXPECTED_CHANNEL_ID`, que pertenezca exactamente al canal esperado. También instala FFmpeg, necesario para medir la narración.

Con 180 elementos hay stock para 90 días. Al terminar, el cron deja de producir para no repetir contenido. Antes de agotarlo debe ampliarse `STOCK_VIDEO_COUNT` y el banco local.

## OpenAI opcional para desarrollo

Los scripts de generación dinámica y OpenAI TTS se mantienen como herramientas opcionales para uso local. No forman parte del workflow gratuito ni son necesarios para operar el canal.
