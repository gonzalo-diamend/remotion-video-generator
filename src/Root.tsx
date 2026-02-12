import React from 'react';
import { Composition, Sequence, useVideoConfig, AbsoluteFill } from 'remotion';
import { HelloWorld } from './HelloWorld';
import { AnimatedLogo } from './AnimatedLogo'; // Tu intro con logo
import { QuizEurope, QuizQuestion } from './QuizEurope';

// --- Datos del Quiz ---
const europeQuestions: QuizQuestion[] = [
  { country: 'España', options: ['Madrid', 'Barcelona', 'Sevilla', 'Valencia'], correctIndex: 0 },
  { country: 'Francia', options: ['Lyon', 'Marsella', 'París', 'Niza'], correctIndex: 2 },
  { country: 'Alemania', options: ['Hamburgo', 'Múnich', 'Berlín', 'Colonia'], correctIndex: 2 },
  { country: 'Italia', options: ['Milán', 'Roma', 'Nápoles', 'Turín'], correctIndex: 1 },
  { country: 'Portugal', options: ['Oporto', 'Lisboa', 'Braga', 'Coímbra'], correctIndex: 1 },
  { country: 'Países Bajos', options: ['Rotterdam', 'La Haya', 'Utrecht', 'Ámsterdam'], correctIndex: 3 },
  { country: 'Suecia', options: ['Gotemburgo', 'Malmö', 'Estocolmo', 'Uppsala'], correctIndex: 2 },
  { country: 'Noruega', options: ['Bergen', 'Oslo', 'Trondheim', 'Stavanger'], correctIndex: 1 },
  { country: 'Polonia', options: ['Cracovia', 'Varsovia', 'Gdansk', 'Wroclaw'], correctIndex: 1 },
  { country: 'Grecia', options: ['Tesalónica', 'Heraclión', 'Atenas', 'Patras'], correctIndex: 2 },
];

const INTRO_DURATION_SEC = 5; // Duración de tu intro
const QUESTION_DURATION_SEC = 10; // Duración por pregunta
const OUTRO_DURATION_SEC = 5; // Duración del cierre

// --- Componente Outro Simple (Reutilizamos estilos) ---
const SimpleOutro: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#050816', justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ color: 'white', fontSize: 80, textAlign: 'center' }}>
        ¡Gracias por ver! <br/>
        <span style={{ color: '#FFE066', fontSize: 50 }}>Suscríbete para más</span>
      </h1>
    </AbsoluteFill>
  );
};

// --- Componente que Une Todo (Intro + Quiz + Outro) ---
const FullVideoComposition: React.FC<{ questions: QuizQuestion[] }> = ({ questions }) => {
  const { fps } = useVideoConfig();

  const introFrames = INTRO_DURATION_SEC * fps;
  const quizFrames = questions.length * QUESTION_DURATION_SEC * fps;
  const outroFrames = OUTRO_DURATION_SEC * fps;

  return (
    <AbsoluteFill>
      {/* 1. Intro */}
      <Sequence from={0} durationInFrames={introFrames}>
        <AnimatedLogo />
      </Sequence>

      {/* 2. Quiz */}
      <Sequence from={introFrames} durationInFrames={quizFrames}>
        <QuizEurope questions={questions} />
      </Sequence>

      {/* 3. Outro */}
      <Sequence from={introFrames + quizFrames} durationInFrames={outroFrames}>
        <SimpleOutro />
      </Sequence>
    </AbsoluteFill>
  );
};

// --- Root Principal ---
export const RemotionRoot: React.FC = () => {
  const totalDurationFrames = (INTRO_DURATION_SEC + (europeQuestions.length * QUESTION_DURATION_SEC) + OUTRO_DURATION_SEC) * 30;

  return (
    <>
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          titleText: 'Welcome to Remotion',
          titleColor: '#000000',
        }}
      />
      
      {/* Intro sola (útil para pruebas) */}
      <Composition
        id="AnimatedLogo"
        component={AnimatedLogo}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Quiz solo (útil para pruebas) */}
      <Composition
        id="QuizEurope"
        component={QuizEurope}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={europeQuestions.length * 30 * 10}
        defaultProps={{ questions: europeQuestions }}
      />

      {/* VIDEO COMPLETO FINAL */}
      <Composition
        id="FullVideoEurope"
        component={FullVideoComposition}
        fps={30}
        width={1920}
        height={1080}
        durationInFrames={totalDurationFrames}
        defaultProps={{ questions: europeQuestions }}
      />
    </>
  );
};
