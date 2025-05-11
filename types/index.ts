export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'organizer' | 'participant';
  createdAt: Date;
  updatedAt: Date;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  code: string;
  isActive: boolean;
  timePerQuestion: number;
  questions: Question[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  options: string[];
  correctOption: number;
  points: number;
  timeLimit: number;
  order: number;
}

export interface QuizSession {
  id: string;
  quizId: string;
  startTime: Date;
  endTime?: Date;
  participants: SessionParticipant[];
  currentQuestionIndex: number;
  status: 'waiting' | 'active' | 'finished';
}

export interface SessionParticipant {
  id: string;
  sessionId: string;
  userId: string;
  score: number;
  answers: Answer[];
  joinedAt: Date;
}

export interface Answer {
  questionId: string;
  selectedOption: number;
  timeToAnswer: number;
  isCorrect: boolean;
  pointsEarned: number;
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  score: number;
  position: number;
} 