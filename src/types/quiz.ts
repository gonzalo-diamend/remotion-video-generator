export type ShortQuizItem = {
  id: string;
  series: string;
  level: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation?: string;
};
