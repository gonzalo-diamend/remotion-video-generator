import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  staticFile,
} from 'remotion';

interface AnimatedLogoProps {
  logoText?: string;   // Lo mantenemos opcional por compatibilidad
  accentColor?: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Animación de escala (rebote)
  const scale = spring({
    frame: frame - 10,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  // Animación de opacidad
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Animación de rotación suave
  const rotate = interpolate(frame, [0, 150], [0, 10], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050816', // Fondo oscuro elegante
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale}) rotate(${rotate}deg)`,
        }}
      >
        {/* Aquí cargamos tu logo desde la carpeta public */}
        <Img
          src={staticFile('logo.png')}
          style={{
            width: 400,          // Ajusta el tamaño según necesites
            height: 'auto',
            borderRadius: '50%', // Opcional: si quieres recortarlo circular
            boxShadow: '0 0 40px rgba(255, 107, 107, 0.4)', // Resplandor acorde a tus colores
          }}
        />
      </div>

      {/* Título debajo del logo */}
      <div
        style={{
          marginTop: 40,
          opacity: interpolate(frame, [30, 60], [0, 1]),
          transform: `translateY(${interpolate(frame, [30, 60], [20, 0], { extrapolateRight: 'clamp' })}px)`,
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 60, fontWeight: 800, color: 'white' }}>
          THE QUIZ CHANNEL
        </h1>
        <p style={{ margin: '10px 0 0', fontSize: 30, color: '#ccc' }}>
          Pon a prueba tu mente
        </p>
      </div>
    </AbsoluteFill>
  );
};
