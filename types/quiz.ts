export enum PlayerRole {
  PLAYER = 'player',
  HOST = 'host',
  HOST_PLAYER = 'host_player'
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  role: PlayerRole;
}

export interface Category {
  name: string;
  questions: Question[];
}

export interface Question {
  text: string;
  answer: string;
  points: number;
}

export interface Quiz {
  id: number;
  title: string;
  categories: Category[];
}

export interface AnsweredQuestion {
  categoryIndex: number;
  questionIndex: number;
} 