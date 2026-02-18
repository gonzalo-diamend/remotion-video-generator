import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {ShortQuizItem} from '../types/quiz';

type QuizShortViralProps = ShortQuizItem & {
  episode: number;
};

const optionLetters = ['A', 'B', 'C', 'D'] as const;

export const QuizShortViral: React.FC<QuizShortViralProps> = ({
  series,
  level,
  episode,
  question,
  options,
  correctIndex,
  explanation,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const revealStart = Math.floor(7.2 * fps);
  const timerStart = Math.floor(3.2 * fps);
  const timerEnd = Math.floor(7.2 * fps);

  const hookOpacity = interpolate(frame, [0, 15, 80, 100], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cardScale = spring({
    fps,
    frame,
    config: {damping: 14, stiffness: 120},
  });

  const isTimerVisible = frame >= timerStart && frame < timerEnd;
  const timerValue = isTimerVisible ? 4 - Math.floor((frame - timerStart) / fps) : null;
  const showReveal = frame >= revealStart;
  const safeCorrectIndex = Math.min(Math.max(correctIndex, 0), optionLetters.length - 1);

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at top, #1e2447 0%, #0a1026 45%, #060811 100%)',
        color: '#ecf1ff',
        fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        padding: 56,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 22,
          padding: '20px 28px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.35)',
          marginBottom: 26,
        }}
      >
        <div style={{fontSize: 36, fontWeight: 700}}>{series} · Ep. {episode}</div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: 999,
            backgroundColor: 'rgba(136, 183, 255, 0.2)',
            border: '1px solid rgba(136,183,255,0.38)',
          }}
        >
          {level}
        </div>
      </div>

      <div
        style={{
          opacity: hookOpacity,
          textAlign: 'center',
          marginBottom: 24,
          minHeight: 156,
        }}
      >
        <div style={{fontSize: 84, fontWeight: 800, letterSpacing: 1, color: '#ffd166'}}>EL 97% FALLA</div>
        <div style={{fontSize: 58, fontWeight: 700}}>¿La acertás?</div>
      </div>

      <div
        style={{
          flex: 1,
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 28,
          boxShadow: '0 22px 45px rgba(0,0,0,0.42)',
          padding: 38,
          transform: `scale(${0.96 + cardScale * 0.04})`,
        }}
      >
        <div style={{fontSize: 56, fontWeight: 700, lineHeight: 1.15, marginBottom: 30}}>{question}</div>

        <div style={{display: 'grid', gap: 16}}>
          {options.map((option, index) => {
            const isCorrect = showReveal && index === safeCorrectIndex;
            return (
              <div
                key={`${index}-${option}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  borderRadius: 18,
                  padding: '16px 20px',
                  border: isCorrect ? '2px solid #39d98a' : '1px solid rgba(255,255,255,0.16)',
                  backgroundColor: isCorrect ? 'rgba(57,217,138,0.18)' : 'rgba(0,0,0,0.25)',
                  boxShadow: isCorrect ? '0 0 0 1px rgba(57,217,138,0.35), 0 10px 24px rgba(0,0,0,0.28)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: 'rgba(136,183,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 30,
                    fontWeight: 800,
                  }}
                >
                  {optionLetters[index]}
                </div>
                <div style={{fontSize: 38, fontWeight: 600}}>{option}</div>
              </div>
            );
          })}
        </div>

        <div style={{height: 120, marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {isTimerVisible ? (
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                border: '4px solid rgba(255, 209, 102, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 58,
                fontWeight: 800,
                color: '#ffd166',
                boxShadow: '0 0 24px rgba(255,209,102,0.35)',
              }}
            >
              {timerValue}
            </div>
          ) : null}
        </div>

        {showReveal ? (
          <div
            style={{
              marginTop: 8,
              borderRadius: 18,
              padding: '18px 20px',
              backgroundColor: 'rgba(57,217,138,0.12)',
              border: '1px solid rgba(57,217,138,0.38)',
            }}
          >
            <div style={{fontSize: 36, fontWeight: 700, color: '#7ff0b4'}}>✅ Correcta: {optionLetters[safeCorrectIndex]}</div>
            {explanation ? <div style={{fontSize: 30, marginTop: 8, lineHeight: 1.28}}>{explanation}</div> : null}
          </div>
        ) : null}
      </div>

      <div
        style={{
          marginTop: 24,
          backgroundColor: 'rgba(255, 209, 102, 0.14)',
          border: '1px solid rgba(255,209,102,0.4)',
          borderRadius: 18,
          padding: '16px 22px',
          textAlign: 'center',
          fontSize: 34,
          fontWeight: 700,
          boxShadow: '0 14px 28px rgba(0,0,0,0.34)',
        }}
      >
        Seguime para más trivias diarias
      </div>
    </AbsoluteFill>
  );
};
