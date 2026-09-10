import {QuizVideoPayload} from './quiz-schema';

export interface NarrationCue {
  id: string;
  src: string;
  from: number;
  text: string;
}

export interface NarrationSegment extends NarrationCue {
  fileName: string;
  availableFrames: number;
}

const optionLetter = (index: number): string => String.fromCharCode(65 + index);

export const buildNarrationSegments = (
  payload: QuizVideoPayload,
  mediaBasePath = `generated/${payload.video.id}`,
): NarrationSegment[] => {
  const segments: NarrationSegment[] = [
    {
      id: 'intro',
      fileName: 'intro.mp3',
      src: `${mediaBasePath}/intro.mp3`,
      from: 0,
      availableFrames: payload.intro.duration_frames,
      text: payload.intro.text,
    },
  ];

  let questionStart = payload.intro.duration_frames;

  payload.questions.forEach((question, index) => {
    const revealOffset = question.answer_reveal_frame ?? Math.floor(question.duration_frames * 0.75);
    const spokenOptions = question.options
      .map((option, optionIndex) => `Opción ${optionLetter(optionIndex)}: ${option}.`)
      .join(' ');
    const correctLetter = optionLetter(question.correct_index);
    const number = String(index + 1).padStart(2, '0');

    segments.push({
      id: `question-${number}`,
      fileName: `question-${number}.mp3`,
      src: `${mediaBasePath}/question-${number}.mp3`,
      from: questionStart,
      availableFrames: revealOffset,
      text: `Pregunta ${index + 1}. ${question.question}. ${spokenOptions}`,
    });
    segments.push({
      id: `answer-${number}`,
      fileName: `answer-${number}.mp3`,
      src: `${mediaBasePath}/answer-${number}.mp3`,
      from: questionStart + revealOffset,
      availableFrames: question.duration_frames - revealOffset,
      text: `La respuesta correcta es la ${correctLetter}: ${question.options[question.correct_index]}. ${question.explanation}`,
    });

    questionStart += question.duration_frames;
  });

  segments.push({
    id: 'outro',
    fileName: 'outro.mp3',
    src: `${mediaBasePath}/outro.mp3`,
    from: questionStart,
    availableFrames: payload.outro.duration_frames,
    text: payload.outro.text,
  });

  return segments;
};

export const buildNarrationCues = (
  payload: QuizVideoPayload,
  mediaBasePath?: string,
): NarrationCue[] => {
  return buildNarrationSegments(payload, mediaBasePath).map((segment) => ({
    id: segment.id,
    src: segment.src,
    from: segment.from,
    text: segment.text,
  }));
};
