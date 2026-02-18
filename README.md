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
# Ver todas las composiciones disponibles (incluye QuizVertical_001..050 y QuizThumb_001..050)
npx remotion compositions src/index.ts

# Render batch de videos verticales
mkdir -p out/videos
for id in $(seq -f "%03g" 1 50); do
  npx remotion render src/index.ts "QuizVertical_${id}" "out/videos/quiz-${id}.mp4"
done

# Render batch de miniaturas
mkdir -p out/thumbnails
for id in $(seq -f "%03g" 1 50); do
  npx remotion still src/index.ts "QuizThumb_${id}" "out/thumbnails/quiz-${id}.png"
done
```

Además, cada video ahora se genera con:
- `description` SEO-friendly
- `tags` enriquecidos por tópico
- `hashtags` automáticos

Puedes usar el catálogo `quizRenderCatalog` desde `src/videos-es.ts` para conectar publicación/descarga en tus pipelines.
