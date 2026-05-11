import { api } from './client';

export interface QuizPublic {
  quizId: string;
  question: string;
  options: string[];
  status: 'ACTIVE' | 'CLOSED';
  expiresAt?: string;
  totalAnswers: number;
}

export interface QuizResult extends QuizPublic {
  correctIndex: number;
  answerCounts: number[];
  userAnswer?: { chosenIndex: number; correct: boolean };
}

export const QuizApi = {
  getActive(): Promise<QuizPublic | QuizResult | null> {
    return api.get('/quiz/active').then((r) => r.data);
  },
  answer(quizId: string, chosenIndex: number): Promise<QuizResult> {
    return api.post(`/quiz/${quizId}/answer`, { chosenIndex }).then((r) => r.data);
  },
};
