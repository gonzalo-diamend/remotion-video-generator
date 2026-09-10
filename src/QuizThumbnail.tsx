import React from 'react';
import {AbsoluteFill} from 'remotion';
import {QuizVideoPayload} from './quiz-schema';
import {buildThumbnailTitle} from './quiz-metadata';

interface QuizThumbnailProps {
  payload: QuizVideoPayload;
}

const QuizGraphic: React.FC = () => (
  <svg width="500" height="500" viewBox="0 0 500 500" aria-hidden="true">
    <defs>
      <linearGradient id="quiz-ring" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fde047" />
        <stop offset="1" stopColor="#fb7185" />
      </linearGradient>
      <filter id="quiz-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" floodOpacity="0.35" />
      </filter>
    </defs>
    <circle cx="250" cy="250" r="188" fill="#0f172a" stroke="url(#quiz-ring)" strokeWidth="22" filter="url(#quiz-shadow)" />
    <path d="M250 62 A188 188 0 0 1 438 250" fill="none" stroke="#38bdf8" strokeWidth="22" />
    <path d="M438 250 A188 188 0 0 1 250 438" fill="none" stroke="#4ade80" strokeWidth="22" />
    <text x="250" y="320" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontSize="210" fontWeight="900">?</text>
    {[
      {x: 86, y: 92, label: 'A', fill: '#38bdf8'},
      {x: 414, y: 92, label: 'B', fill: '#fb7185'},
      {x: 86, y: 408, label: 'C', fill: '#4ade80'},
      {x: 414, y: 408, label: 'D', fill: '#fde047'},
    ].map((item) => (
      <g key={item.label}>
        <circle cx={item.x} cy={item.y} r="48" fill={item.fill} stroke="white" strokeWidth="7" />
        <text x={item.x} y={item.y + 17} textAnchor="middle" fill="#0f172a" fontFamily="Inter, sans-serif" fontSize="50" fontWeight="900">{item.label}</text>
      </g>
    ))}
  </svg>
);

export const QuizThumbnail: React.FC<QuizThumbnailProps> = ({payload}) => {
  const title = buildThumbnailTitle(payload);
  const titleSize = title.length > 24 ? 76 : title.length > 18 ? 88 : 100;

  return (
    <AbsoluteFill style={styles.base}>
      <div style={{...styles.glow, ...styles.glowOne}} />
      <div style={{...styles.glow, ...styles.glowTwo}} />
      <div style={styles.content}>
        <div style={styles.copy}>
          <div style={styles.badge}>12 PREGUNTAS</div>
          <h1 style={{...styles.title, fontSize: titleSize}}>{title}</h1>
          <div style={styles.challenge}>¿CUÁNTAS PUEDES ACERTAR?</div>
          <div style={styles.channel}>@thequizchannelytb</div>
        </div>
        <div style={styles.graphicWrap}>
          <QuizGraphic />
          <div style={styles.difficulty}>DE FÁCIL A IMPOSIBLE</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const styles: Record<string, React.CSSProperties> = {
  base: {
    background: 'linear-gradient(125deg, #172554 0%, #4c1d95 48%, #be123c 100%)',
    color: 'white',
    fontFamily: 'Inter, system-ui, sans-serif',
    overflow: 'hidden',
  },
  glow: {position: 'absolute', borderRadius: '50%', filter: 'blur(18px)', opacity: 0.5},
  glowOne: {width: 430, height: 430, left: -170, top: -180, backgroundColor: '#38bdf8'},
  glowTwo: {width: 390, height: 390, right: -100, bottom: -180, backgroundColor: '#facc15'},
  content: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    display: 'grid',
    gridTemplateColumns: '58% 42%',
    alignItems: 'center',
    padding: '54px 46px 46px 66px',
    boxSizing: 'border-box',
  },
  copy: {display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 20},
  badge: {
    padding: '11px 24px',
    borderRadius: 12,
    backgroundColor: '#fde047',
    color: '#172554',
    fontSize: 32,
    fontWeight: 900,
    letterSpacing: 2,
    transform: 'rotate(-2deg)',
    boxShadow: '0 10px 0 rgba(15,23,42,0.35)',
  },
  title: {
    maxWidth: 700,
    margin: 0,
    lineHeight: 0.92,
    textAlign: 'left',
    fontWeight: 950,
    letterSpacing: -3,
    textTransform: 'uppercase',
    textShadow: '0 10px 30px rgba(0,0,0,0.42)',
  },
  challenge: {
    padding: '13px 20px',
    borderLeft: '8px solid #38bdf8',
    backgroundColor: 'rgba(15,23,42,0.72)',
    fontSize: 30,
    fontWeight: 850,
  },
  channel: {fontSize: 25, fontWeight: 700, opacity: 0.86},
  graphicWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(2deg)',
  },
  difficulty: {
    position: 'absolute',
    bottom: 18,
    padding: '12px 22px',
    borderRadius: 999,
    backgroundColor: '#f8fafc',
    color: '#be123c',
    fontSize: 24,
    fontWeight: 950,
    boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
  },
};
