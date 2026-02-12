// src/QuizEurope.tsx
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

export interface QuizQuestion {
  country: string;
  options: string[];
  correctIndex: number;
}

interface QuizEuropeProps {
  questions: QuizQuestion[];
}

const QUESTION_SECONDS = 10; // 10s por pregunta
const REVEAL_SECONDS = 3;    // últimos 3s mostrando la respuesta correcta

export const QuizEurope: React.FC<QuizEuropeProps> = ({ questions }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const questionDuration = QUESTION_SECONDS * fps;
  const totalFrames = questionDuration * questions.length;

  if (frame >= totalFrames) {
    return null;
  }

  const currentQuestionIndex = Math.floor(frame / questionDuration);
  const frameInQuestion = frame % questionDuration;

  const q = questions[currentQuestionIndex];

  const revealStart = (QUESTION_SECONDS - REVEAL_SECONDS) * fps;
  const isRevealTime = frameInQuestion >= revealStart;

  const progress =
    1 -
    interpolate(
      frameInQuestion,
      [0, questionDuration],
      [0, 1],
      { extrapolateRight: 'clamp' }
    );

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at top, #1f3b73 0%, #050816 60%)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
        padding: '60px 120px',
        boxSizing: 'border-box',
      }}
    >
      {/* Indicador de pregunta */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          left: 60,
          fontSize: 32,
          fontWeight: 600,
          opacity: 0.9,
        }}
      >
        Pregunta {currentQuestionIndex + 1} / {questions.length}
      </div>

      {/* Timer barra superior */}
      <div
        style={{
          position: 'absolute',
          top: 40,
          right: 60,
          width: 300,
          height: 16,
          borderRadius: 999,
          backgroundColor: 'rgba(255,255,255,0.15)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #FF6B6B, #FFD166)',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {/* Tarjeta principal */}
      <div
        style={{
          marginTop: 120,
          marginInline: 'auto',
          maxWidth: 1100,
          backgroundColor: 'rgba(0,0,0,0.45)',
          borderRadius: 32,
          padding: '40px 50px 50px',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div
          style={{
            fontSize: 28,
            textTransform: 'uppercase',
            letterSpacing: 4,
            color: '#A5B4FC',
            marginBottom: 18,
          }}
        >
          Geografía de Europa
        </div>

        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            marginBottom: 32,
          }}
        >
          ¿Cuál es la capital de {q.country}?
        </div>

        {/* Opciones */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
          }}
        >
          {q.options.map((opt, idx) => {
            const isCorrect = idx === q.correctIndex;
            const isHighlighted = isRevealTime && isCorrect;

            const bg = isHighlighted
              ? 'linear-gradient(135deg, #16a34a, #4ade80)'
              : 'rgba(15,23,42,0.9)';

            const border = isHighlighted
              ? '2px solid rgba(187,247,208,0.9)'
              : '1px solid rgba(148,163,184,0.35)';

            const color = isHighlighted ? '#052e16' : '#e5e7eb';

            return (
              <div
                key={idx}
                style={{
                  background: bg,
                  border,
                  borderRadius: 20,
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  boxShadow: isHighlighted
                    ? '0 20px 50px rgba(22,163,74,0.5)'
                    : '0 12px 30px rgba(15,23,42,0.7)',
                  transform: isHighlighted ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.2s ease-out',
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    backgroundColor: isHighlighted ? '#bbf7d0' : '#1f2937',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    color: isHighlighted ? '#166534' : '#e5e7eb',
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 500,
                    color,
                  }}
                >
                  {opt}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensaje de solución */}
        {isRevealTime && (
          <div
            style={{
              marginTop: 30,
              fontSize: 26,
              fontWeight: 600,
              color: '#bbf7d0',
            }}
          >
            ✅ Respuesta correcta: {q.options[q.correctIndex]}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
