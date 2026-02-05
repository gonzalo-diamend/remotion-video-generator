# Ejemplos y Mejores Prácticas 📚

## 🎯 Ejemplos de Uso

### 1. Video Simple con Texto

La composición `HelloWorld` incluida muestra cómo crear un video básico:

```tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

export const HelloWorld: React.FC<Props> = ({ titleText, titleColor }) => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  
  return (
    <AbsoluteFill style={{ backgroundColor: 'white' }}>
      <h1 style={{ opacity, color: titleColor }}>{titleText}</h1>
    </AbsoluteFill>
  );
};
```

**Renderizar:**
```bash
npx remotion render src/index.ts HelloWorld out/hello.mp4
```

### 2. Video con Animaciones Spring

La composición `AnimatedLogo` usa animaciones spring:

```tsx
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

const scale = spring({
  frame,
  fps,
  config: {
    damping: 100,
    stiffness: 200,
  },
});
```

**Renderizar con props personalizados:**
```bash
npx remotion render src/index.ts AnimatedLogo out/logo.mp4 \
  --props='{"logoText":"MI MARCA","accentColor":"#FF6B6B"}'
```

### 3. Video con Imágenes y Assets

Crea una carpeta `public/` y coloca tus assets:

```tsx
import { Img, staticFile } from 'remotion';

export const ImageComposition: React.FC = () => {
  return (
    <AbsoluteFill>
      <Img src={staticFile('logo.png')} />
    </AbsoluteFill>
  );
};
```

### 4. Video con Audio

```tsx
import { Audio, staticFile } from 'remotion';

export const AudioVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio src={staticFile('background-music.mp3')} />
      {/* Tu contenido visual */}
    </AbsoluteFill>
  );
};
```

### 5. Secuencias y Composición de Escenas

```tsx
import { Sequence, useVideoConfig } from 'remotion';

export const MultiScene: React.FC = () => {
  const { fps } = useVideoConfig();
  
  return (
    <AbsoluteFill>
      {/* Escena 1: 0-3 segundos */}
      <Sequence from={0} durationInFrames={fps * 3}>
        <Scene1 />
      </Sequence>
      
      {/* Escena 2: 3-6 segundos */}
      <Sequence from={fps * 3} durationInFrames={fps * 3}>
        <Scene2 />
      </Sequence>
      
      {/* Escena 3: 6-9 segundos */}
      <Sequence from={fps * 6} durationInFrames={fps * 3}>
        <Scene3 />
      </Sequence>
    </AbsoluteFill>
  );
};
```

### 6. Video con Datos Dinámicos (JSON)

```tsx
import data from './data.json';

interface DataVideoProps {
  items: string[];
}

export const DataVideo: React.FC<DataVideoProps> = ({ items }) => {
  const frame = useCurrentFrame();
  const currentIndex = Math.floor(frame / 30) % items.length;
  
  return (
    <AbsoluteFill>
      <h1>{items[currentIndex]}</h1>
    </AbsoluteFill>
  );
};
```

**Renderizar con datos:**
```bash
npx remotion render src/index.ts DataVideo out/data.mp4 \
  --props='{"items":["Item 1","Item 2","Item 3"]}'
```

## 🛠️ Casos de Uso Comunes

### Generación de Thumbnails para YouTube

```tsx
export const Thumbnail: React.FC<{ title: string }> = ({ title }) => {
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 60,
      }}
    >
      <h1
        style={{
          fontSize: 120,
          fontWeight: 'bold',
          color: 'white',
          textAlign: 'center',
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        {title}
      </h1>
    </AbsoluteFill>
  );
};
```

**Renderizar como imagen:**
```bash
npx remotion still src/index.ts Thumbnail out/thumbnail.png \
  --props='{"title":"MI VIDEO"}'
```

### Videos de Gráficos/Datos (Data Visualization)

```tsx
import { useCurrentFrame, interpolate } from 'remotion';

interface ChartProps {
  data: number[];
}

export const AnimatedChart: React.FC<ChartProps> = ({ data }) => {
  const frame = useCurrentFrame();
  
  return (
    <AbsoluteFill style={{ padding: 100 }}>
      <svg width="1720" height="880">
        {data.map((value, index) => {
          const height = interpolate(
            frame,
            [index * 10, index * 10 + 30],
            [0, value * 5],
            { extrapolateRight: 'clamp' }
          );
          
          return (
            <rect
              key={index}
              x={index * 100}
              y={880 - height}
              width={80}
              height={height}
              fill="#4A90E2"
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
```

### Videos Personalizados por Usuario (Batch Rendering)

Crea un script para generar múltiples videos:

```javascript
// scripts/batch-render.js
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');

const users = [
  { name: 'Juan', email: 'juan@example.com' },
  { name: 'Maria', email: 'maria@example.com' },
  { name: 'Carlos', email: 'carlos@example.com' },
];

async function renderForUser(user) {
  const bundleLocation = await bundle({
    entryPoint: path.resolve('./src/index.ts'),
  });
  
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: 'PersonalizedVideo',
  });
  
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: `out/video-${user.name}.mp4`,
    inputProps: {
      userName: user.name,
      userEmail: user.email,
    },
  });
  
  console.log(`✅ Video generado para ${user.name}`);
}

async function main() {
  for (const user of users) {
    await renderForUser(user);
  }
}

main();
```

**Ejecutar:**
```bash
node scripts/batch-render.js
```

## ⚙️ Configuración Avanzada

### Configuración de Remotion

Crea `remotion.config.ts` para configuraciones globales:

```typescript
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setConcurrency(8);
Config.setCodec('h264');
```

### Optimización de Renderizado

```bash
# Usar GPU para renderizado más rápido (si está disponible)
npx remotion render src/index.ts MyVideo out/video.mp4 \
  --gl=angle \
  --concurrency=4

# Ajustar calidad de video
npx remotion render src/index.ts MyVideo out/video.mp4 \
  --crf=18 \
  --codec=h264

# Renderizado en partes (para videos largos)
npx remotion render src/index.ts MyVideo out/video.mp4 \
  --frames=0-100
```

### Renderizado Lambda (AWS)

Para renderizado escalable en la nube:

```bash
# Instalar Remotion Lambda
npm install @remotion/lambda

# Configurar AWS
npx remotion lambda sites create src/index.ts --site-name=my-site

# Renderizar en Lambda
npx remotion lambda render my-site MyVideo \
  --props='{"text":"Hello"}'
```

## 🏆 Mejores Prácticas

### 1. Organización de Componentes

```
src/
├── compositions/        # Composiciones principales
│   ├── HelloWorld.tsx
│   └── AnimatedLogo.tsx
├── components/          # Componentes reutilizables
│   ├── Title.tsx
│   └── Background.tsx
├── utils/               # Utilidades
│   ├── animations.ts
│   └── colors.ts
├── Root.tsx
└── index.ts
```

### 2. Performance

- **Evita re-renders innecesarios**: Usa `React.memo()`
- **Lazy loading**: Carga assets bajo demanda
- **Optimiza imágenes**: Usa formatos comprimidos (WebP, AVIF)
- **Limita complejidad visual**: Menos elementos = renderizado más rápido

### 3. Reutilización de Código

Crea funciones de utilidad para animaciones comunes:

```typescript
// utils/animations.ts
import { interpolate, useCurrentFrame } from 'remotion';

export const useFadeIn = (delay = 0, duration = 30) => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [delay, delay + duration],
    [0, 1],
    { extrapolateRight: 'clamp' }
  );
};

export const useSlideIn = (delay = 0, distance = 100) => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [delay, delay + 30],
    [distance, 0],
    { extrapolateRight: 'clamp' }
  );
};
```

### 4. Testing

Prueba tus composiciones en Remotion Studio antes de renderizar:

```bash
npm start
# Navega a http://localhost:3000
# Ajusta props en tiempo real
# Verifica cada frame
```

### 5. Versionado

Usa tags de Git para versiones de producción:

```bash
git tag -a v1.0.0 -m "Primera versión de producción"
git push origin v1.0.0
```

El pipeline CI/CD se activará automáticamente.

## 🐛 Troubleshooting

### Error: "Cannot find module"

```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

### Error de memoria durante renderizado

```bash
# Aumenta el límite de memoria de Node.js
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### Video se renderiza en negro

- Verifica que todos los assets existan en `public/`
- Comprueba que las rutas sean correctas
- Revisa la consola de Remotion Studio para errores

### Renderizado lento

- Reduce la resolución temporalmente para pruebas
- Usa `--concurrency` para paralelizar
- Considera usar Remotion Lambda para renderizado en la nube

## 🔗 Recursos Adicionales

- [Remotion Showcase](https://www.remotion.dev/showcase) - Inspiración
- [Remotion Templates](https://github.com/remotion-dev/template-collection) - Plantillas listas para usar
- [Video Tutorial Series](https://www.youtube.com/c/Remotion) - Tutoriales oficiales
- [Community Discord](https://remotion.dev/discord) - Soporte de la comunidad

---

¿Tienes preguntas? Abre un issue en GitHub o contáctame en gonzalo.diamend@gmail.com
