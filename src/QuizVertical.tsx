import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {QuizVideoPayload} from './quiz-schema';

interface QuizVerticalProps {
  payload: QuizVideoPayload;
}

export const QuizVertical: React.FC<QuizVerticalProps> = ({payload}) => {
  const frame = useCurrentFrame();
  const {intro, questions, outro} = payload;

  const quizStart = intro.duration_frames;
  const quizDuration = questions.reduce((acc, q) => acc + q.duration_frames, 0);
  const outroStart = quizStart + quizDuration;

  if (frame < quizStart) {
    return (
      <AbsoluteFill style={styles.base}>
        <div style={styles.centerWrap}>
          <h1 style={styles.title}>{payload.video.title}</h1>
          <p style={styles.subtitle}>{intro.text}</p>
        </div>
      </AbsoluteFill>
    );
  }

  if (frame >= outroStart) {
    return (
      <AbsoluteFill style={styles.base}>
        <div style={styles.centerWrap}>
          <h1 style={styles.title}>🎉 Fin del Quiz</h1>
          <p style={styles.subtitle}>{outro.text}</p>
        </div>
      </AbsoluteFill>
    );
  }

  const frameInQuiz = frame - quizStart;
  let accumulated = 0;
  let active = questions[0];
  let frameInQuestion = 0;

  for (const question of questions) {
    if (frameInQuiz < accumulated + question.duration_frames) {
      active = question;
      frameInQuestion = frameInQuiz - accumulated;
      break;
    }
    accumulated += question.duration_frames;
  }

  const revealFrom = Math.floor(active.duration_frames * 0.75);
  const reveal = frameInQuestion >= revealFrom;
  const progress =
    1 -
    interpolate(frameInQuestion, [0, active.duration_frames], [0, 1], {
      extrapolateRight: 'clamp',
    });

  return (
    <AbsoluteFill style={styles.base}>
      <div style={styles.topRow}>
        <span>
          {payload.video.topic.toUpperCase()} • {active.id}/{questions.length}
        </span>
        <div style={styles.progressBarWrap}>
          <div style={{...styles.progressBar, width: `${progress * 100}%`}} />
        </div>
      </div>

      <div style={styles.card}>
        <h2 style={styles.question}>{active.question}</h2>

        <div style={styles.optionsGrid}>
          {active.options.map((opt, idx) => {
            const isCorrect = idx === active.correct_index;
            const activeStyle = reveal && isCorrect;
            return (
              <div
                key={`${active.id}-${idx}`}
                style={{
                  ...styles.option,
                  ...(activeStyle ? styles.optionCorrect : {}),
                }}
              >
                <span style={styles.optionLabel}>{String.fromCharCode(65 + idx)}</span>
                <span>{opt}</span>
              </div>
            );
          })}
        </div>

        {reveal ? <p style={styles.explain}>✅ {active.explanation}</p> : null}
      </div>

      <div style={styles.footer}>#{payload.video.id} · {payload.video.hashtags.join(' ')}</div>
    </AbsoluteFill>
  );
};

const styles: Record<string, React.CSSProperties> = {
  base: {
    background: 'radial-gradient(circle at top, #101f4d 0%, #04060f 60%)',
    color: 'white',
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: 40,
    boxSizing: 'border-box',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 28,
    fontWeight: 700,
  },
  progressBarWrap: {
    width: 320,
    height: 14,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #fb7185, #facc15)',
  },
  card: {
    marginTop: 50,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 24,
    padding: '30px 28px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  },
  question: {
    margin: 0,
    fontSize: 54,
    lineHeight: 1.1,
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: 14,
  },
  option: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '16px 18px',
    borderRadius: 16,
    fontSize: 34,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    border: '1px solid rgba(148,163,184,0.35)',
  },
  optionCorrect: {
    background: 'linear-gradient(135deg, #16a34a, #4ade80)',
    color: '#052e16',
    border: '2px solid rgba(187,247,208,0.9)',
    fontWeight: 700,
  },
  optionLabel: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    fontWeight: 700,
    flexShrink: 0,
  },
  explain: {
    margin: 0,
    fontSize: 30,
    color: '#86efac',
    fontWeight: 700,
  },
  centerWrap: {
    margin: 'auto',
    textAlign: 'center',
    maxWidth: 920,
    display: 'grid',
    gap: 28,
  },
  title: {
    fontSize: 66,
    margin: 0,
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: 34,
    margin: 0,
    opacity: 0.95,
  },
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    fontSize: 24,
    opacity: 0.75,
  },
};
