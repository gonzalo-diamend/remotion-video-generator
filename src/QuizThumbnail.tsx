import React from 'react';
import {AbsoluteFill} from 'remotion';
import {QuizVideoPayload} from './quiz-schema';
import {buildThumbnailTitle} from './quiz-metadata';

interface QuizThumbnailProps {
  payload: QuizVideoPayload;
}

export const QuizThumbnail: React.FC<QuizThumbnailProps> = ({payload}) => {
  return (
    <AbsoluteFill style={styles.base}>
      <div style={styles.badge}>NUEVO QUIZ</div>
      <h1 style={styles.title}>{buildThumbnailTitle(payload)}</h1>
      <p style={styles.subtitle}>¿Aceptas el reto de 12 preguntas?</p>
      <div style={styles.footer}>@quizchannel • {payload.video.id}</div>
    </AbsoluteFill>
  );
};

const styles: Record<string, React.CSSProperties> = {
  base: {
    background: 'linear-gradient(135deg, #1d4ed8 0%, #312e81 45%, #020617 100%)',
    color: 'white',
    fontFamily: 'Inter, system-ui, sans-serif',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: 60,
    boxSizing: 'border-box',
    gap: 30,
  },
  badge: {
    fontSize: 42,
    fontWeight: 800,
    backgroundColor: '#facc15',
    color: '#111827',
    padding: '12px 26px',
    borderRadius: 999,
  },
  title: {
    margin: 0,
    fontSize: 112,
    lineHeight: 1,
    textShadow: '0 10px 30px rgba(0,0,0,0.45)',
  },
  subtitle: {
    margin: 0,
    fontSize: 46,
    fontWeight: 600,
    opacity: 0.95,
  },
  footer: {
    fontSize: 30,
    opacity: 0.8,
  },
};
