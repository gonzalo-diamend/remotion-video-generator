import React from 'react';
import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {QuizVideoPayload} from './quiz-schema';
import {NarrationCue} from './audio-cues';

interface Props { payload: QuizVideoPayload; audioCues?: NarrationCue[]; }

const Narration: React.FC<{cues: NarrationCue[]}> = ({cues}) => (
  <>{cues.map((cue) => <Sequence key={cue.id} from={cue.from}><Audio src={staticFile(cue.src)} /></Sequence>)}</>
);

export const QuizLandscape: React.FC<Props> = ({payload, audioCues = []}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const quizStart = payload.intro.duration_frames;
  const quizDuration = payload.questions.reduce((sum, q) => sum + q.duration_frames, 0);
  const outroStart = quizStart + quizDuration;

  if (frame < quizStart || frame >= outroStart) {
    const ending = frame >= outroStart;
    return (
      <AbsoluteFill style={styles.base}>
        <Narration cues={audioCues} />
        <div style={styles.hero}>
          <div style={styles.badge}>{ending ? 'RESULTADO FINAL' : `${payload.questions.length} PREGUNTAS`}</div>
          <h1 style={styles.heroTitle}>{ending ? '¡Reto completado!' : payload.video.title}</h1>
          <p style={styles.heroText}>{ending ? payload.outro.text : payload.intro.text}</p>
          <div style={styles.handle}>@thequizchannelytb</div>
        </div>
      </AbsoluteFill>
    );
  }

  const frameInQuiz = frame - quizStart;
  let elapsed = 0;
  let active = payload.questions[0];
  let localFrame = 0;
  for (const question of payload.questions) {
    if (frameInQuiz < elapsed + question.duration_frames) {
      active = question;
      localFrame = frameInQuiz - elapsed;
      break;
    }
    elapsed += question.duration_frames;
  }

  const revealAt = active.answer_reveal_frame ?? Math.floor(active.duration_frames * 0.72);
  const reveal = localFrame >= revealAt;
  const seconds = Math.max(1, Math.ceil((revealAt - localFrame) / fps));
  const progress = interpolate(frameInQuiz, [0, quizDuration], [0, 100], {extrapolateRight: 'clamp'});

  return (
    <AbsoluteFill style={styles.base}>
      <Narration cues={audioCues} />
      <div style={styles.header}>
        <span>{payload.video.topic.toUpperCase()}</span>
        <span>PREGUNTA {active.id} / {payload.questions.length}</span>
      </div>
      <div style={styles.progress}><div style={{...styles.progressFill, width: `${progress}%`}} /></div>
      <main style={styles.main}>
        <section style={styles.card}>
          <h2 style={styles.question}>{active.question}</h2>
          <div style={styles.options}>
            {active.options.map((option, index) => (
              <div key={option} style={{...styles.option, ...(reveal && index === active.correct_index ? styles.correct : {})}}>
                <span style={styles.letter}>{String.fromCharCode(65 + index)}</span>
                <span>{option}</span>
              </div>
            ))}
          </div>
          {reveal ? <div style={styles.explanation}>✓ {active.explanation}</div> : null}
        </section>
        <aside style={styles.side}>
          {reveal ? <div style={styles.points}>+1<br/><small>¿La acertaste?</small></div> : <div style={styles.timer}>{seconds}</div>}
          <div style={styles.cta}>Anota tu puntuación<br/><b>y compártela</b></div>
        </aside>
      </main>
      <footer style={styles.footer}>THE QUIZ CHANNEL · NUEVO RETO CADA DÍA</footer>
    </AbsoluteFill>
  );
};

const styles: Record<string, React.CSSProperties> = {
  base: {background: 'radial-gradient(circle at 20% 0%, #312e81 0%, #0f172a 46%, #020617 100%)', color: 'white', fontFamily: 'Inter, Arial, sans-serif', padding: 54, boxSizing: 'border-box'},
  header: {display: 'flex', justifyContent: 'space-between', fontSize: 28, fontWeight: 900, letterSpacing: 2, color: '#fde047'},
  progress: {height: 12, background: 'rgba(255,255,255,.14)', borderRadius: 20, marginTop: 18, overflow: 'hidden'},
  progressFill: {height: '100%', background: 'linear-gradient(90deg,#38bdf8,#facc15,#fb7185)'},
  main: {display: 'grid', gridTemplateColumns: '1fr 360px', gap: 46, flex: 1, alignItems: 'center'},
  card: {background: 'rgba(15,23,42,.84)', border: '2px solid rgba(148,163,184,.28)', borderRadius: 34, padding: 42, boxShadow: '0 28px 80px rgba(0,0,0,.4)'},
  question: {fontSize: 58, lineHeight: 1.06, margin: '0 0 32px'},
  options: {display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20},
  option: {minHeight: 94, display: 'flex', alignItems: 'center', gap: 18, padding: '14px 22px', borderRadius: 20, background: '#1e293b', border: '2px solid #475569', fontSize: 32, fontWeight: 750},
  correct: {background: 'linear-gradient(135deg,#16a34a,#4ade80)', color: '#052e16', borderColor: '#bbf7d0'},
  letter: {width: 52, height: 52, borderRadius: 50, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, flexShrink: 0},
  explanation: {marginTop: 28, fontSize: 30, fontWeight: 800, color: '#86efac'},
  side: {display: 'grid', placeItems: 'center', gap: 36},
  timer: {width: 240, height: 240, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 128, fontWeight: 950, color: '#fde047', border: '12px solid #fde047', boxShadow: '0 0 80px rgba(250,204,21,.24)'},
  points: {width: 260, height: 220, borderRadius: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 92, fontWeight: 950, color: '#052e16', background: 'linear-gradient(135deg,#86efac,#fde047)'}, 
  cta: {textAlign: 'center', fontSize: 28, lineHeight: 1.3},
  footer: {textAlign: 'center', fontSize: 23, fontWeight: 800, letterSpacing: 2, opacity: .72},
  hero: {margin: 'auto', maxWidth: 1500, textAlign: 'center', display: 'grid', justifyItems: 'center', gap: 28},
  badge: {background: '#fde047', color: '#172554', padding: '13px 28px', borderRadius: 14, fontSize: 30, fontWeight: 950, letterSpacing: 2},
  heroTitle: {fontSize: 90, lineHeight: 1, margin: 0, textTransform: 'uppercase'},
  heroText: {fontSize: 38, lineHeight: 1.3, margin: 0, maxWidth: 1250},
  handle: {fontSize: 28, opacity: .8},
};