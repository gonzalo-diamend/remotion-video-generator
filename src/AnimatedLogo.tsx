import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

interface AnimatedLogoProps {
  logoText: string;
  accentColor: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  logoText,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Spring animation for entrance
  const scale = spring({
    frame: frame - 10,
    fps,
    config: {
      damping: 100,
      stiffness: 200,
      mass: 0.5,
    },
  });

  // Rotation animation
  const rotation = interpolate(frame, [0, 150], [0, 360], {
    extrapolateRight: 'clamp',
  });

  // Opacity fade in
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });

  // Color transition
  const hue = interpolate(frame, [0, 150], [0, 360]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 70%, 50%), hsl(${hue + 60}, 70%, 50%))`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          opacity,
        }}
      >
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '50%',
            width: 300,
            height: 300,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          }}
        >
          <h1
            style={{
              fontSize: 60,
              fontWeight: 'bold',
              color: accentColor,
              margin: 0,
              textAlign: 'center',
            }}
          >
            {logoText}
          </h1>
        </div>
      </div>
    </AbsoluteFill>
  );
};
