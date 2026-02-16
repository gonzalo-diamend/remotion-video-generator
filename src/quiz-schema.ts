export type Difficulty = 'easy' | 'medium' | 'hard' | 'mixed';

export interface QuizVideoMeta {
  id: string;
  title: string;
  description: string;
  tags: string[];
  hashtags: string[];
  duration_seconds: number;
  difficulty: Difficulty;
  topic: string;
  language: 'es';
  target_audience: 'general' | 'kids' | 'experts';
}

export interface IntroOutroBlock {
  text: string;
  duration_frames: number;
}

export interface QuizQuestionItem {
  id: number;
  question: string;
  options: [string, string, string, string];
  correct_index: number;
  explanation: string;
  difficulty: Exclude<Difficulty, 'mixed'>;
  duration_frames: number;
}

export interface QuizRenderConfig {
  fps: 30;
  width: 1080;
  height: 1920;
  background_style: 'gradient' | 'dark' | 'light';
  voice_style: 'energetic' | 'neutral' | 'dramatic';
  music_style: 'quiz' | 'suspense' | 'epic';
}

export interface QuizVideoPayload {
  video: QuizVideoMeta;
  intro: IntroOutroBlock;
  questions: QuizQuestionItem[];
  outro: IntroOutroBlock;
  render: QuizRenderConfig;
}
