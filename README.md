# Remotion Video Generator 🎬

Proyecto de generación de videos programáticos usando [Remotion](https://www.remotion.dev/), con pipelines CI/CD automatizados.

## 🚀 Características

- ✅ Configuración completa de Remotion v4
- ✅ TypeScript con configuración estricta
- ✅ Pipeline CI/CD de GitLab para renderizado automático
- ✅ Composición de ejemplo "HelloWorld"
- ✅ Linting y type checking automatizados
- ✅ Soporte para props dinámicos
- ✅ Dataset de 50 quizzes en español (formato render-ready para Remotion)

## 📋 Requisitos Previos

- Node.js 18+ (recomendado: 20+)
- npm o yarn
- Git

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone https://github.com/gonzalo-diamend/remotion-video-generator.git
cd remotion-video-generator

# Instalar dependencias
npm install
```

## 🎯 Uso

### Modo Desarrollo (Remotion Studio)

Inicia el servidor de desarrollo interactivo:

```bash
npm start
```

Esto abrirá Remotion Studio en `http://localhost:3000`, donde podrás:
- Ver preview en tiempo real
- Ajustar props de la composición
- Navegar frame por frame
- Exportar videos

### Renderizar Video desde CLI

```bash
# Renderizar con props por defecto
npm run build

# Renderizar con props personalizados
npx remotion render src/index.ts HelloWorld out/video.mp4 \
  --props='{"titleText":"Mi Video","titleColor":"#FF6B6B"}'
```

### Prueba rápida de build (ejecutada localmente)

Puedes probar rápidamente que el pipeline de render funciona con la composición `HelloWorld`.

```bash
# Ejecuta el build (usa Remotion CLI)
npm run build -- HelloWorld out/HelloWorld.mp4

# Alternativamente:
npx remotion render src/index.ts HelloWorld out/HelloWorld.mp4
```

En este repositorio ejecutamos el comando anterior como prueba y se generó `out/HelloWorld.mp4`.

## 📁 Estructura del Proyecto

```
remotion-video-generator/
├── src/
│   ├── Root.tsx          # Registro de composiciones
│   ├── HelloWorld.tsx    # Composición de ejemplo
│   └── index.ts          # Entry point
├── out/                  # Videos renderizados (git ignored)
├── .gitlab-ci.yml        # Pipeline CI/CD
├── package.json          # Dependencias y scripts
├── tsconfig.json         # Configuración TypeScript
└── README.md
```

## 🔄 Pipeline CI/CD (GitLab)

El proyecto incluye un pipeline automatizado con 3 stages:

### 1. **Test** - Validación de código
- Ejecuta linting (ESLint)
- Type checking (TypeScript)
- Se dispara en MRs y push a main

### 2. **Build** - Generación del bundle
- Compila el proyecto Remotion
- Genera artefactos reutilizables
- Solo en main y tags

### 3. **Render** - Generación de videos
- **Manual**: Renderiza video a demanda
- **Scheduled**: Renderizado automático diario/semanal
- Guarda videos como artefactos (1 mes)

### Configurar el Pipeline

1. **En GitLab**, navega a: Settings > CI/CD > Variables
2. Añade variables si necesitas personalizar:
   - `NODE_VERSION`: Versión de Node (default: 20)
   - `REMOTION_VERSION`: Versión de Remotion (default: 4.0.0)

3. **Para renderizado programado**:
   - Ve a: CI/CD > Schedules
   - Crea un schedule (ej: diario a las 9:00 AM)
   - El job `render:scheduled` se ejecutará automáticamente

## 🎨 Crear Nuevas Composiciones

1. Crea un nuevo componente en `src/`:

```tsx
// src/MyVideo.tsx
import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

interface MyVideoProps {
  text: string;
}

export const MyVideo: React.FC<MyVideoProps> = ({ text }) => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill style={{ backgroundColor: '#4A90E2' }}>
      <h1>{text} - Frame: {frame}</h1>
    </AbsoluteFill>
  );
};
```

2. Regístrala en `src/Root.tsx`:

```tsx
import { MyVideo } from './MyVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Composiciones existentes... */}
      
      <Composition
        id="MyVideo"
        component={MyVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          text: 'Hola Mundo',
        }}
      />
    </>
  );
};
```

3. Renderiza:

```bash
npx remotion render src/index.ts MyVideo out/my-video.mp4
```


### Render shorts

Se agregaron composiciones verticales de shorts virales bajo IDs `short-<id>` (por ejemplo `short-hist-roma-01`).

```bash
# Renderizar un short puntual
npx remotion render src/index.ts short-hist-roma-01 out/shorts/hist-roma-01.mp4

# Renderizar los shorts de ejemplo del dataset
npm run render:shorts

# Render incremental (salta outputs existentes) + reintentos
node scripts/render-batch.js --mode=videos --from=1 --to=50 --retries=2
node scripts/render-batch.js --mode=thumbs --from=1 --to=50 --retries=2
node scripts/render-shorts.js --retries=2
```

## 🧪 Testing

```bash
# Ejecutar linting y type checking
npm test

# Ejecutar tests unitarios (dataset/metadata/catalog)
npm run test:unit

# Solo linting
npx eslint src --ext ts,tsx

# Solo type checking
npx tsc --noEmit
```



### Browser executable en CI/headless

Para evitar descargas dinámicas de Chromium en entornos restringidos, puedes apuntar Remotion a un binario ya instalado:

```bash
export REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium
npx remotion render src/index.ts HelloWorld out/video.mp4 --browser-executable "$REMOTION_BROWSER_EXECUTABLE"
```

## 🔧 Configuración Avanzada

### Cambiar Resolución

En `src/Root.tsx`, modifica `width` y `height`:

```tsx
width={3840}  // 4K
height={2160}
```

### Cambiar FPS

```tsx
fps={60}  // 60fps para slow motion
```

### Usar Assets (imágenes, audio)

```tsx
import myImage from './assets/image.png';

<Img src={myImage} />
```

### Props Dinámicos desde CLI

```bash
npx remotion render src/index.ts HelloWorld out/video.mp4 \
  --props='{"titleText":"Q1 2026 Results","titleColor":"#00FF00"}'
```

## 📤 Publicación en YouTube (subida + programación)

El repo incluye un flujo automatizado de publicación con metadata (`title`, `description`, `tags`, miniatura y programación).

### 1) Render de assets

```bash
npm run render:batch
npm run render:thumbs
```

### 2) Configurar credenciales OAuth2

1. Crea una app OAuth en Google Cloud con YouTube Data API v3 habilitada.
2. Obtén `client_id`, `client_secret`, `redirect_uri` y `refresh_token`.
3. Copia `.env.youtube.example` y exporta variables al shell:

```bash
export YT_CLIENT_ID="..."
export YT_CLIENT_SECRET="..."
export YT_REDIRECT_URI="..."
export YT_REFRESH_TOKEN="..."
```

Opcionales:

```bash
export YT_DEFAULT_PRIVACY_STATUS="private"   # private|unlisted|public
export YT_DEFAULT_CATEGORY_ID="27"           # Education
export YT_DEFAULT_PLAYLIST_ID=""
export YT_SCHEDULE_START="2026-02-20T15:00:00Z"
export YT_SCHEDULE_INTERVAL_HOURS="24"
```

### 3) Generar manifiesto de publicación

```bash
# Usa metadata de src/videos-es.ts y src/render-catalog.ts
npm run publish:manifest

# Ejemplo: programar desde fecha/hora inicial, cada 12 horas
node scripts/build-publish-manifest.js \
  --from=1 --to=50 \
  --schedule-start=2026-02-20T15:00:00Z \
  --interval-hours=12
```

Salida: `out/publish/manifest.json`

### 4) Validar y subir/programar

```bash
# Vista previa sin subir nada
npm run publish:youtube:dry

# Subida real
npm run publish:youtube
```

Opciones útiles:

```bash
# Reintentos y rango parcial
node scripts/youtube-upload.js --from-index=1 --to-index=10 --retries=4

# Forzar re-subida de ítems ya marcados como subidos en el estado local
node scripts/youtube-upload.js --force
```

### 5) Estado e idempotencia

- Estado local: `out/publish/upload-state.json`
- Si un `localId` ya fue subido, se salta automáticamente (salvo `--force`).
- Si `publishAt` está definido, se sube como `private` y YouTube lo publica en la fecha/hora indicada.

## 📚 Recursos

- [Documentación Oficial de Remotion](https://www.remotion.dev/docs)
- [API Reference](https://www.remotion.dev/docs/api)
- [Ejemplos de la Comunidad](https://github.com/remotion-dev/remotion/tree/main/packages/example)
- [Discord de Remotion](https://remotion.dev/discord)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📝 Licencia

MIT License - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**Gonzalo Diamend**
- GitHub: [@gonzalo-diamend](https://github.com/gonzalo-diamend)
- Email: gonzalo.diamend@gmail.com
- Web: [gonzalodiamend.com](https://gonzalodiamend.com)

---

⭐ Si este proyecto te resulta útil, ¡dale una estrella en GitHub!


## 🧠 Dataset automático de quizzes (ES)

Se agregó un generador de 50 videos de quiz en español con formato estructurado para render:

- `src/quiz-schema.ts`: Tipos del payload (`video`, `intro`, `questions`, `outro`, `render`).
- `src/videos-es.ts`: Generador `spanishQuizVideos` con 50 quizzes únicos y rotación de temas.
- `src/QuizVertical.tsx`: Composición vertical 1080x1920 para render directo de un payload.

Composición registrada:

- `QuizVerticalAuto` (usa `spanishQuizVideos[0]` por defecto).


## 🧰 Render masivo + miniaturas + metadata

Quedó preparado un flujo para renderizar **múltiples videos** y también sus miniaturas:

```bash
# Ver todas las composiciones disponibles (incluye QuizVertical-001..050 y QuizThumb-001..050)
npx remotion compositions src/index.ts

# Render batch de videos verticales
mkdir -p out/videos
for id in $(seq -f "%03g" 1 50); do
  npx remotion render src/index.ts "QuizVertical-${id}" "out/videos/quiz-${id}.mp4"
done

# Render batch de miniaturas
mkdir -p out/thumbnails
for id in $(seq -f "%03g" 1 50); do
  npx remotion still src/index.ts "QuizThumb-${id}" "out/thumbnails/quiz-${id}.png"
done
```

Además, cada video ahora se genera con:
- `description` SEO-friendly
- `tags` enriquecidos por tópico
- `hashtags` automáticos

Puedes usar el catálogo `quizRenderCatalog` desde `src/videos-es.ts` para conectar publicación/descarga en tus pipelines.
